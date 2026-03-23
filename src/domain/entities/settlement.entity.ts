import { v4 as uuidv4 } from 'uuid'
import { SettlementPaymentMethod, SettlementStatus } from '~/domain/enums/settlement.enum'

export class Settlement {
  constructor(
    public id: string,
    public orderId: string,
    public shopId: string,
    public goodsPrice: number,
    public finalPrice: number,
    public shippingFee: number,
    public commissionFee: number,
    public payout: number,
    public paymentMethod: SettlementPaymentMethod,
    public status: SettlementStatus,
    public payoutAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(data: {
    orderId: string
    shopId: string
    goodsPrice: number
    finalPrice: number
    shippingFee: number
    commissionFee: number
    payout: number
    paymentMethod: SettlementPaymentMethod
    status: SettlementStatus
    payoutAt: Date | null
    createdAt?: Date
    updatedAt?: Date
  }): Settlement {
    const now = new Date()
    return new Settlement(
      uuidv4(),
      data.orderId,
      data.shopId,
      data.goodsPrice,
      data.finalPrice,
      data.shippingFee,
      data.commissionFee,
      data.payout,
      data.paymentMethod,
      data.status,
      data.payoutAt,
      data.createdAt ?? now,
      data.updatedAt ?? now,
    )
  }
}
