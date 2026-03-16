import { IQuery } from '@nestjs/cqrs'

export class GetOrderToShipperQuery implements IQuery {
  constructor(
    public readonly orderId: string,
    public readonly shipperId: string,
    public readonly shipperName: string,
    public readonly shipperPhoneNumber: string,
  ) {}
}
