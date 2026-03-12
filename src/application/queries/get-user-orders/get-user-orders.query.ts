import { OrderStatus } from '~/domain/enums/order.enum'

export class GetUserOrdersQuery {
  constructor(
    public readonly userId: string,
    public readonly status: OrderStatus,
    public readonly cursor?: string,
    public readonly limit: number = 10,
  ) {}
}
