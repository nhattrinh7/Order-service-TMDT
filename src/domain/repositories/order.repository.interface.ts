import { Order } from '~/domain/entities/order.entity'
import { OrderStatus } from '~/domain/enums/order.enum'

export interface OrderWithItems {
  id: string
  shopId: string
  status: string
  paymentMethod: string
  finalPrice: number
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

  findById(orderId: string): Promise<Order | null>

  findByUserIdPaginated(
    userId: string,
    status: OrderStatus,
    cursorTimestamp?: Date,
    cursorId?: string,
    limit?: number,
  ): Promise<OrderWithItems[]>
}
export const ORDER_REPOSITORY = Symbol('IOrderRepository')
