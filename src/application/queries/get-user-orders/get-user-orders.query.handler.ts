import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { GetUserOrdersQuery } from './get-user-orders.query'
import { type IOrderRepository, ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { OrderStatus } from '~/domain/enums/order.enum'
import { encodeCursor, decodeCursor } from '~/common/utils/cursor.util'

interface OrderItemResponse {
  id: string
  productId: string
  productVariantId: string
  productName: string
  variantImage: string
  sku: string
  quantity: number
  finalPrice: number
  isReviewed?: boolean
  returnReason?: string | null
  returnStatus?: string
  returnRequestedAt?: Date | null
  returnResolvedAt?: Date | null
}

interface OrderResponse {
  id: string
  shopId: string
  shopName: string
  status: string
  paymentMethod: string
  goodsPrice: number
  finalPrice: number
  createdAt: Date
  orderItems: OrderItemResponse[]
}

@QueryHandler(GetUserOrdersQuery)
export class GetUserOrdersHandler implements IQueryHandler<GetUserOrdersQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(query: GetUserOrdersQuery) {
    const { userId, status, returnStatus, cursor, limit } = query

    // Decode compound cursor nếu có
    let cursorTimestamp: Date | undefined
    let cursorId: string | undefined
    if (cursor) {
      const decoded = decodeCursor(cursor)
      cursorTimestamp = decoded.timestamp
      cursorId = decoded.id
    }

    // Lấy thêm 1 bản ghi để kiểm tra hasMore
    const orders = await this.orderRepository.findByUserIdPaginated(
      userId,
      status,
      returnStatus,
      cursorTimestamp,
      cursorId,
      limit + 1,
    )

    const hasMore = orders.length > limit
    const resultOrders = hasMore ? orders.slice(0, limit) : orders

    // Lấy shopName từ shop-service
    const shopIds = [...new Set(resultOrders.map(o => o.shopId))]
    let shopsMap = new Map<string, { id: string; name: string; logo: string | null }>()

    if (shopIds.length > 0) {
      const shopsResponse = await this.messagePublisher.sendToShopService<
        { shopIds: string[] },
        Array<{ id: string; name: string; logo: string | null }>
      >('get.shop.simple_data', { shopIds })

      shopsMap = new Map(shopsResponse.map(s => [s.id, s]))
    }

    // Lấy reviewed items từ catalog-service (chỉ khi đơn giao thành công)
    const shouldCheckReviewed = status === OrderStatus.DELIVERY_COMPLETED
    const reviewedKeySet = new Set<string>()

    if (shouldCheckReviewed) {
      const reviewPairsMap = new Map<string, { orderId: string; productId: string }>()
      resultOrders.forEach(order => {
        order.orderItems.forEach(item => {
          const key = `${order.id}:${item.productId}`
          if (!reviewPairsMap.has(key)) {
            reviewPairsMap.set(key, { orderId: order.id, productId: item.productId })
          }
        })
      })
      const reviewPairs = Array.from(reviewPairsMap.values())
      
      console.log('reviewPairs', reviewPairs)

      if (reviewPairs.length > 0) {
        const reviewedPairs = await this.messagePublisher.sendToCatalogService<
          { items: Array<{ orderId: string; productId: string }> },
          Array<{ orderId: string; productId: string }>
        >('get.reviewed.order-items', { items: reviewPairs })

        console.log('reviewedPairs', reviewedPairs)

        reviewedPairs.forEach(pair => {
          reviewedKeySet.add(`${pair.orderId}:${pair.productId}`)
        })
      }
    }

    // Build response
    const data: OrderResponse[] = resultOrders.map(order => {
      const shopInfo = shopsMap.get(order.shopId)
      return {
        id: order.id,
        shopId: order.shopId,
        shopName: shopInfo?.name || `Shop ${order.shopId.slice(0, 6)}`,
        status: order.status,
        paymentMethod: order.paymentMethod,
        goodsPrice: order.goodsPrice,
        finalPrice: order.finalPrice,
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
          isReviewed: shouldCheckReviewed
            ? reviewedKeySet.has(`${order.id}:${item.productId}`)
            : false,
        })),
      }
    })

    // Compound cursor từ bản ghi cuối cùng
    const lastOrder = resultOrders[resultOrders.length - 1]
    const nextCursor = hasMore && lastOrder
      ? encodeCursor(lastOrder.createdAt, lastOrder.id)
      : null

    return {
      success: true,
      data,
      meta: {
        nextCursor,
        hasMore,
        limit,
      },
    }
  }
}
