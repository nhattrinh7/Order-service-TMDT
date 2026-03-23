import { OrderDeliveryHistory } from '~/domain/entities/order-delivery-history.entity'

export class OrderDeliveryHistoryMapper {
  static toPersistence(history: OrderDeliveryHistory) {
    return {
      id: history.id,
      orderId: history.orderId,
      orderedAt: history.orderedAt,
      dispatchToCarrierAt: history.dispatchToCarrierAt,
      deliverySuccessAt: history.deliverySuccessAt,
      deliveryFailAt: history.deliveryFailAt,
      warehouses: history.warehouses as any,
      shipper: history.shipper as any,
    }
  }
}
