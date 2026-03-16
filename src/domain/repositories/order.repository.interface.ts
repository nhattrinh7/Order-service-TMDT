import { Order } from '~/domain/entities/order.entity'
import { OrderStatus } from '~/domain/enums/order.enum'
import { OrderPaymentMethod } from '~/domain/enums/order.enum' // Assuming OrderPaymentMethod is also an enum from order.enum

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
  returnReason: string | null
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
    cursorTimestamp?: Date,
    cursorId?: string,
    limit?: number,
  ): Promise<OrderWithItems[]>

  countByShopId(
    shopId: string,
    status: OrderStatus,
    search?: string,
  ): Promise<number>

  findByShopIdPaginated(
    shopId: string,
    status: OrderStatus,
    skip: number,
    take: number,
    search?: string,
  ): Promise<OrderWithItems[]>
}
export const ORDER_REPOSITORY = Symbol('IOrderRepository')
