import { Order } from '~/domain/entities/order.entity'
import { OrderStatus } from '~/domain/enums/order.enum'
import { OrderPaymentMethod, OrderItemReturnStatus } from '~/domain/enums/order.enum' // Assuming OrderPaymentMethod is also an enum from order.enum

export interface OrderWithItems {
  id: string
  userId: string
  shopId: string
  status: OrderStatus
  paymentMethod: OrderPaymentMethod
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
  orderItems: Array<{
    id: string
    productId: string
    productVariantId: string
    productName: string
    variantImage: string
    sku: string
    quantity: number
    finalPrice: number
    returnReason: string | null
    returnStatus: OrderItemReturnStatus
    returnRequestedAt: Date | null
    returnResolvedAt: Date | null
  }>
}

export interface IOrderRepository {
  saveMany(orders: Order[], tx?: any): Promise<string[]>

  updateManyStatus(orderIds: string[], status: OrderStatus, tx?: any): Promise<number>

  updateStatus(orderId: string, status: OrderStatus, cancelReason?: string): Promise<void>

  findById(orderId: string, tx?: any): Promise<Order | null>

  findByIdWithItems(orderId: string, tx?: any): Promise<Order | null>

  findByUserIdPaginated(
    userId: string,
    status: OrderStatus,
    returnStatus?: OrderItemReturnStatus,
    cursorTimestamp?: Date,
    cursorId?: string,
    limit?: number,
  ): Promise<OrderWithItems[]>

  countByStatus(
    status: OrderStatus,
    search?: string,
    returnStatus?: OrderItemReturnStatus,
  ): Promise<number>

  findByStatusPaginated(
    status: OrderStatus,
    skip: number,
    take: number,
    search?: string,
    returnStatus?: OrderItemReturnStatus,
  ): Promise<OrderWithItems[]>

  countByShopId(
    shopId: string,
    status: OrderStatus,
    search?: string,
    returnStatus?: OrderItemReturnStatus,
  ): Promise<number>

  findByShopIdPaginated(
    shopId: string,
    status: OrderStatus,
    skip: number,
    take: number,
    search?: string,
    returnStatus?: OrderItemReturnStatus,
  ): Promise<OrderWithItems[]>

  findOrderItemByIdWithOrder(
    orderItemId: string,
  ): Promise<{
    id: string
    returnStatus: OrderItemReturnStatus
    finalPrice: number
    orderId: string
    order: { userId: string; status: OrderStatus }
  } | null>

  updateOrderItemReturnRequest(
    orderItemId: string,
    returnReason: string,
  ): Promise<void>
}
export const ORDER_REPOSITORY = Symbol('IOrderRepository')
