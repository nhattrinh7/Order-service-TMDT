import { v4 as uuidv4 } from 'uuid'

export class OrderDeliveryHistory {
  constructor(
    public id: string,
    public orderId: string,
    public orderedAt: Date | null,
    public dispatchToCarrierAt: Date | null,
    public deliverySuccessAt: Date | null,
    public deliveryFailAt: Date | null,
    public warehouses: any[] | null,
    public shipper: any | null,
  ) {}

  static create(data: { orderId: string; orderedAt: Date }): OrderDeliveryHistory {
    return new OrderDeliveryHistory(
      uuidv4(),
      data.orderId,
      data.orderedAt,
      null,
      null,
      null,
      null,
      null,
    )
  }
}
