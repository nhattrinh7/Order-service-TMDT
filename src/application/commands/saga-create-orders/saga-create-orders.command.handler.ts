import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import * as QRCode from 'qrcode'
import { SagaCreateOrdersCommand } from './saga-create-orders.command'
import type { IOrderRepository } from '~/domain/repositories/order.repository.interface'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { Order } from '~/domain/entities/order.entity'
import { OrderPaymentMethod } from '~/domain/enums/order.enum'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'

@CommandHandler(SagaCreateOrdersCommand)
export class SagaCreateOrdersHandler implements ICommandHandler<SagaCreateOrdersCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: SagaCreateOrdersCommand): Promise<{ success: boolean; orderIds: string[] }> {
    const { userId, orders: orderDatas } = command

    const orders = orderDatas.map(data =>
      Order.create({
        userId,
        shopId: data.shopId,
        paymentMethod: data.paymentMethod as OrderPaymentMethod,
        shippingAddress: data.shippingAddress,
        receiverName: data.receiverName,
        receiverPhoneNumber: data.receiverPhoneNumber,
        subtotal: data.subtotal,
        shippingFee: data.shippingFee,
        szoneVoucherDiscount: data.szoneVoucherDiscount,
        shopVoucherDiscount: data.shopVoucherDiscount,
        goodsPrice: data.goodsPrice,
        finalPrice: data.finalPrice,
        paymentId: data.paymentId,
        items: data.items.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          productName: item.productName,
          variantImage: item.image,
          sku: item.sku,
          quantity: item.quantity,
          finalPrice: item.price,
        })),
      })
    )

    // Sinh QR code cho từng đơn hàng từ order id
    for (const order of orders) {
      order.qrCode = await QRCode.toDataURL(order.id)
    }

    // Transaction: tạo nhiều orders + orderItems phải atomic
    const orderIds = await this.prismaService.transaction(async (tx) => {
      return this.orderRepository.saveMany(orders, tx)
    })

    return {
      success: true,
      orderIds,
    }
  }
}
