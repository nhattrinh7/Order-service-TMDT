import { Order } from '~/domain/entities/order.entity'
import { OrderStatus } from '~/domain/enums/order.enum'

export interface IOrderRepository {
  saveMany(orders: Order[], tx?: any): Promise<string[]>

  updateManyStatus(orderIds: string[], status: OrderStatus, tx?: any): Promise<number>
}
export const ORDER_REPOSITORY = Symbol('IOrderRepository')
