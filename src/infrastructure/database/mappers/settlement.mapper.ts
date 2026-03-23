import { PaymentMethod as PrismaPaymentMethod, PayoutStatus as PrismaPayoutStatus } from '@prisma/client'
import { Settlement } from '~/domain/entities/settlement.entity'

export class SettlementMapper {
  static toPersistence(settlement: Settlement) {
    return {
      id: settlement.id,
      orderId: settlement.orderId,
      shopId: settlement.shopId,
      goodsPrice: settlement.goodsPrice,
      finalPrice: settlement.finalPrice,
      shippingFee: settlement.shippingFee,
      commissionFee: settlement.commissionFee,
      payout: settlement.payout,
      paymentMethod: settlement.paymentMethod as unknown as PrismaPaymentMethod,
      status: settlement.status as unknown as PrismaPayoutStatus,
      payoutAt: settlement.payoutAt,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
    }
  }
}
