import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetAdminOrdersQuery } from './get-admin-orders.query'
import {
  type IOrderRepository,
  ORDER_REPOSITORY,
} from '~/domain/repositories/order.repository.interface'
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
  returnReason: string | null
  returnStatus: string
  returnRequestedAt: Date | null
  returnResolvedAt: Date | null
}

interface OrderResponse {
  id: string
  userId: string
  shopId: string
  buyerUsername: string
  buyerAvatar: string | null
  status: string
  paymentMethod: string
  goodsPrice: number
  finalPrice: number
  shippingAddress: string
  receiverName: string
  receiverPhoneNumber: string
  subtotal: number
  shippingFee: number
  szoneVoucherDiscount: number
  shopVoucherDiscount: number
  cancelReason: string | null
  createdAt: Date
  orderItems: OrderItemResponse[]
}

@QueryHandler(GetAdminOrdersQuery)
export class GetAdminOrdersHandler implements IQueryHandler<GetAdminOrdersQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(query: GetAdminOrdersQuery) {
    const { page, limit, status, returnStatus, search } = query
    const skip = (page - 1) * limit

    const [totalItems, orders] = await Promise.all([
      this.orderRepository.countByStatus(status, search, returnStatus),
      this.orderRepository.findByStatusPaginated(status, skip, limit, search, returnStatus),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    // Lay thong tin nguoi mua tu user-service
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

    const formattedOrders: OrderResponse[] = orders.map(order => ({
      id: order.id,
      userId: order.userId,
      shopId: order.shopId,
      buyerUsername: userMap.get(order.userId)?.username || order.receiverName,
      buyerAvatar: userMap.get(order.userId)?.avatar || null,
      status: order.status,
      paymentMethod: order.paymentMethod,
      goodsPrice: order.goodsPrice,
      finalPrice: order.finalPrice,
      shippingAddress: order.shippingAddress,
      receiverName: order.receiverName,
      receiverPhoneNumber: order.receiverPhoneNumber,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      szoneVoucherDiscount: order.szoneVoucherDiscount,
      shopVoucherDiscount: order.shopVoucherDiscount,
      cancelReason: order.cancelReason,
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
        returnReason: item.returnReason,
        returnStatus: item.returnStatus,
        returnRequestedAt: item.returnRequestedAt,
        returnResolvedAt: item.returnResolvedAt,
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
