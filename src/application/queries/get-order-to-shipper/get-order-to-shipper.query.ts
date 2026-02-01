import { IQuery } from '@nestjs/cqrs'

export class GetOrderToShipperQuery implements IQuery {
  constructor(
    public readonly orderId: string,
    public readonly shipper: { name: string; phoneNumber: string },
  ) {}
}
