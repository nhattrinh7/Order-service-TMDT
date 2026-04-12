import { OrderStatus, OrderItemReturnStatus } from '~/domain/enums/order.enum'

export class GetAdminOrdersQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly status: OrderStatus,
    public readonly returnStatus?: OrderItemReturnStatus,
    public readonly search?: string,
  ) {}
}
