import { OrderStatus, OrderItemReturnStatus } from '~/domain/enums/order.enum'

export class GetUserOrdersQuery {
  constructor(
    public readonly userId: string,
    public readonly status: OrderStatus,
    public readonly returnStatus?: OrderItemReturnStatus,
    public readonly cursor?: string,
    public readonly limit: number = 10,
  ) {}
}
