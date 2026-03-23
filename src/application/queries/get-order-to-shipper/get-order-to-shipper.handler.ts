import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException } from '@nestjs/common'
import { GetOrderToShipperQuery } from './get-order-to-shipper.query'
import type { IOrderRepository } from '~/domain/repositories/order.repository.interface'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import type { IOrderDeliveryHistoryRepository } from '~/domain/repositories/order-delivery-history.repository.interface'
import { ORDER_DELIVERY_HISTORY_REPOSITORY } from '~/domain/repositories/order-delivery-history.repository.interface'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { OrderStatus } from '~/domain/enums/order.enum'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'

@QueryHandler(GetOrderToShipperQuery)
export class GetOrderToShipperHandler implements IQueryHandler<GetOrderToShipperQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(ORDER_DELIVERY_HISTORY_REPOSITORY)
    private readonly historyRepository: IOrderDeliveryHistoryRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,

    private readonly prismaService: PrismaService,
  ) {}

  async execute(query: GetOrderToShipperQuery): Promise<any> {
    const { orderId, shipperName, shipperPhoneNumber } = query

    const order = await this.prismaService.transaction(async (tx) => {
      // 1. Get order with items
      const orderData = await this.orderRepository.findByIdWithItems(orderId, tx)
      if (!orderData) {
        throw new NotFoundException(`Không tìm thấy đơn hàng với id: ${orderId}`)
      }

      // 2. Upsert shipper into OrderDeliveryHistory
      const shipperData = {
        name: shipperName,
        phoneNumber: shipperPhoneNumber,
        time: new Date().toISOString()
      }
      
      await this.historyRepository.updateShipper(orderId, shipperData, tx)

      return orderData
    })

    // 3. Get Shop & User Info via RabbitMQ
    // Gọi sang shop-service để lấy delivery info (shopName, phoneNumber, address)
    const shopInfoResponse = await this.messagePublisher.sendToShopService<
      { shopId: string },
      { shopId: string; name: string; phoneNumber: string; shopAddress: string }
    >('get.shop.delivery_info', { shopId: order.shopId })

    // // Lấy price theo requirement: "hoặc 0 nếu đã thanh toán"
    const price = order.paymentMethod === 'COD' 
      ? order.finalPrice 
      : 0

    // 4. Format Output
    return {
      order: {
        id: order.id,
        recipient: {
          name: order.receiverName,
          phoneNumber: order.receiverPhoneNumber,
          shippingAddress: order.shippingAddress,
        },
        shop: {
          id: order.shopId,
          name: shopInfoResponse.name,
          phoneNumber: shopInfoResponse.phoneNumber,
          shopAddress: shopInfoResponse.shopAddress,
        },
        price: price,
        productList: order.orderItems.map(item => ({
          name: item.productName,
          sku: item.sku,
          quantity: item.quantity,
        }))
      }
    }
  }
}
