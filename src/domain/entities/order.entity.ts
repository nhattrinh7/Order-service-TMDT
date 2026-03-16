import { AggregateRoot } from '@nestjs/cqrs'
import { v4 as uuidv4 } from 'uuid'
import { OrderStatus, OrderPaymentMethod } from '~/domain/enums/order.enum'
import { OrderItem } from '~/domain/entities/order-item.entity'

export class Order extends AggregateRoot {
  public orderItems: OrderItem[]

  constructor(
    public id: string,
    public paymentId: string | null,
    public userId: string,
    public shopId: string,
    public status: OrderStatus,
    public paymentMethod: OrderPaymentMethod,
    public shippingAddress: string,
    public receiverName: string,
    public receiverPhoneNumber: string,
    public subtotal: number,
    public shippingFee: number,
    public szoneVoucherDiscount: number,
    public shopVoucherDiscount: number,
    public goodsPrice: number,
    public finalPrice: number,
    public cancelReason: string | null,
    public returnReason: string | null,
    public qrCode: string | null,
    public createdAt: Date,
    public updatedAt: Date,
    orderItems: OrderItem[] = [],
  ) {
    super()
    this.orderItems = orderItems
  }

  static create(data: {
    userId: string
    shopId: string
    paymentMethod: OrderPaymentMethod
    shippingAddress: string
    receiverName: string
    receiverPhoneNumber: string
    subtotal: number
    shippingFee: number
    szoneVoucherDiscount: number
    shopVoucherDiscount: number
    goodsPrice: number
    finalPrice: number
    paymentId?: string
    items: Array<{
      productId: string
      productVariantId: string
      productName: string
      variantImage: string
      sku: string
      quantity: number
      finalPrice: number
    }>
  }): Order {
    const initialStatus = data.paymentMethod === OrderPaymentMethod.COD
      ? OrderStatus.AWAITING_CONFIRMATION
      : OrderStatus.PENDING_PAYMENT

    const orderItems = data.items.map(item => OrderItem.create(item))

    return new Order(
      uuidv4(),
      data.paymentId || null,
      data.userId,
      data.shopId,
      initialStatus,
      data.paymentMethod,
      data.shippingAddress,
      data.receiverName,
      data.receiverPhoneNumber,
      data.subtotal,
      data.shippingFee,
      data.szoneVoucherDiscount,
      data.shopVoucherDiscount,
      data.goodsPrice,
      data.finalPrice,
      null,
      null,
      null, // qrCode - sẽ được gán ở handler
      new Date(),
      new Date(),
      orderItems,
    )
  }

  cancel(): void {
    this.status = OrderStatus.CANCELLED
    this.updatedAt = new Date()
  }

  updateStatus(status: OrderStatus): void {
    this.status = status
    this.updatedAt = new Date()
  }
}