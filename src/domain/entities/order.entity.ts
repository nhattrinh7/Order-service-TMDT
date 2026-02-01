import { AggregateRoot } from '@nestjs/cqrs'
import { v4 as uuidv4 } from 'uuid'
import { OrderStatus } from '~/domain/enums/order.enum'

export class Order extends AggregateRoot {
  constructor(
    public id: string,
    public paymentId: string | null,
    public userId: string,
    public shopId: string,
    public status: OrderStatus,
    public shippingAddressId: string,
    public subtotal: number,
    public shippingFee: number,
    public szoneVoucherDiscount: number,
    public shopVoucherDiscount: number,
    public finalPrice: number,
    public createdAt: Date,
    public updatedAt: Date,
  ) {
    super()
  }
} 