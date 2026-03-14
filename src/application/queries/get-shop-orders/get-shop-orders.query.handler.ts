import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetShopOrdersQuery } from './get-shop-orders.query'
import { type IOrderRepository, ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'

interface OrderItemResponse {
  id: string
  productId: string
  productVariantId: string
  productName: string
  variantImage: string
  sku: string
  quantity: number
  finalPrice: number
}

interface OrderResponse {
  id: string
  shopId: string
  shopName: string
  buyerUsername: string
  buyerAvatar: string | null
  status: string
  paymentMethod: string
  finalPrice: number
  shippingAddress: string
  receiverName: string
  receiverPhoneNumber: string
  subtotal: number
  shippingFee: number
  szoneVoucherDiscount: number
  shopVoucherDiscount: number
  cancelReason: string | null
  returnReason: string | null
  createdAt: Date
  orderItems: OrderItemResponse[]
}

@QueryHandler(GetShopOrdersQuery)
export class GetShopOrdersHandler implements IQueryHandler<GetShopOrdersQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(query: GetShopOrdersQuery) {
    const { shopId, page, limit, status, search } = query
    const skip = (page - 1) * limit

    const [totalItems, orders] = await Promise.all([
      this.orderRepository.countByShopId(shopId, status, search),
      this.orderRepository.findByShopIdPaginated(shopId, status, skip, limit, search),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    // Lấy shopName từ shop-service
    let shopName = `Shop ${shopId.slice(0, 6)}`

    const shopsResponse = await this.messagePublisher.sendToShopService<
      { shopIds: string[] },
      Array<{ id: string; name: string; logo: string | null }>
    >('get.shop.simple_data', { shopIds: [shopId] })
    
    if (shopsResponse && shopsResponse.length > 0) {
      shopName = shopsResponse[0].name
    }


    // Lấy buyerUsername từ user-service
    const userIds = [...new Set(orders.map(order => order.userId))]
    const userMap = new Map<string, { username: string; avatar: string | null }>()
    if (userIds.length > 0) {
      const usersResponse = await this.messagePublisher.sendToUserService<
        { userIds: string[] },
        Array<{ id: string; username: string; avatar: string | null }>
      >('get.users_info', { userIds })

      if (usersResponse && usersResponse.length > 0) {
        usersResponse.forEach(user => {
          userMap.set(user.id, { username: user.username, avatar: user.avatar })
        })
      }
    }

    // Build response
    const formattedOrders: OrderResponse[] = orders.map(order => ({
      id: order.id,
      shopId: order.shopId,
      shopName,
      buyerUsername: userMap.get(order.userId)?.username || order.receiverName,
      buyerAvatar: userMap.get(order.userId)?.avatar || null,
      status: order.status,
      paymentMethod: order.paymentMethod,
      finalPrice: order.finalPrice,
      shippingAddress: order.shippingAddress,
      receiverName: order.receiverName,
      receiverPhoneNumber: order.receiverPhoneNumber,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      szoneVoucherDiscount: order.szoneVoucherDiscount,
      shopVoucherDiscount: order.shopVoucherDiscount,
      cancelReason: order.cancelReason,
      returnReason: order.returnReason,
      createdAt: order.createdAt,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        variantImage: item.variantImage,
        sku: item.sku,
        quantity: item.quantity,
        finalPrice: item.finalPrice,
      })),
    }))

    return {
      success: true,
      data: {
        items: formattedOrders,
        meta: {
          page,
          limit,
          totalPages,
          totalItems,
        },
      },
    }
  }
}
