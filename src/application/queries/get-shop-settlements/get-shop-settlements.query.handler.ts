import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetShopSettlementsQuery } from './get-shop-settlements.query'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { PayoutStatus } from '@prisma/client'
import { DAY_START_TIME_SUFFIX, DAY_END_TIME_SUFFIX } from '~/common/constants/constant'

interface SettlementResponse {
  orderId: string
  goodsPrice: number
  commissionFee: number
  payout: number
  paymentMethod: string
  status: string
  payoutAt: Date | null
  createdAt: Date
}

@QueryHandler(GetShopSettlementsQuery)
export class GetShopSettlementsHandler implements IQueryHandler<GetShopSettlementsQuery> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(query: GetShopSettlementsQuery) {
    const { shopId, page, limit, status, startDate, endDate } = query
    const skip = (page - 1) * limit

    const start = new Date(`${startDate}${DAY_START_TIME_SUFFIX}`)
    const end = new Date(`${endDate}${DAY_END_TIME_SUFFIX}`)

    const where = {
      shopId,
      status: status as PayoutStatus,
      createdAt: {
        gte: start,
        lte: end,
      },
    }

    const [totalItems, settlements, payoutSum] = await Promise.all([
      this.prismaService.settlement.count({ where }),
      this.prismaService.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.settlement.aggregate({
        where,
        _sum: { payout: true },
      }),
    ])

    const totalPages = Math.ceil(totalItems / limit)

    const items: SettlementResponse[] = settlements.map(settlement => ({
      orderId: settlement.orderId,
      goodsPrice: settlement.goodsPrice,
      commissionFee: settlement.commissionFee,
      payout: settlement.payout,
      paymentMethod: settlement.paymentMethod,
      status: settlement.status,
      payoutAt: settlement.payoutAt,
      createdAt: settlement.createdAt,
    }))

    const result = {
      items,
      meta: {
        page,
        limit,
        totalPages,
        totalItems,
      },
      totalPayout: payoutSum._sum.payout ?? 0,
    }

    return result
  }
}
