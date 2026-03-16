import { OrderDeliveryHistory } from '@prisma/client'

export const ORDER_DELIVERY_HISTORY_REPOSITORY = Symbol('ORDER_DELIVERY_HISTORY_REPOSITORY')

export interface IOrderDeliveryHistoryRepository {
  findByOrderId(orderId: string, tx?: any): Promise<OrderDeliveryHistory | null>
  upsertWarehouse(orderId: string, warehouse: { name: string; address: string; time: string }, tx?: any): Promise<void>
  upsertShipper(orderId: string, shipper: { name: string; phoneNumber: string; time: string }, tx?: any): Promise<void>
}
