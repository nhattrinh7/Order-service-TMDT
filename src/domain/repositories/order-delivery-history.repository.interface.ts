import { OrderDeliveryHistory as PrismaOrderDeliveryHistory } from '@prisma/client'
import { OrderDeliveryHistory } from '~/domain/entities/order-delivery-history.entity'

export const ORDER_DELIVERY_HISTORY_REPOSITORY = Symbol('ORDER_DELIVERY_HISTORY_REPOSITORY')

export interface IOrderDeliveryHistoryRepository {
  findByOrderId(orderId: string, tx?: any): Promise<PrismaOrderDeliveryHistory | null>
  createMany(histories: OrderDeliveryHistory[], tx?: any): Promise<void>
  updateWarehouse(
    orderId: string,
    warehouse: { name: string; address: string; time: string },
    tx?: any,
  ): Promise<void>
  updateShipper(
    orderId: string,
    shipper: { name: string; phoneNumber: string; time: string },
    tx?: any,
  ): Promise<void>
  updateDispatchToCarrierAt(orderId: string, dispatchToCarrierAt: Date, tx?: any): Promise<void>
  updateDeliverySuccessAt(orderId: string, deliverySuccessAt: Date, tx?: any): Promise<void>
  updateDeliveryFailAt(orderId: string, deliveryFailAt: Date, tx?: any): Promise<void>
}
