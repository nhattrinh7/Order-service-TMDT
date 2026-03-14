import { OrderStatus } from '~/domain/enums/order.enum'

export class GetShopOrdersQuery {
  constructor(
    public readonly shopId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly status: OrderStatus,
    public readonly search?: string,
  ) {}
}
