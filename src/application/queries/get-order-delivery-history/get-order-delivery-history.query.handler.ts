import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException } from '@nestjs/common'
import { GetOrderDeliveryHistoryQuery } from './get-order-delivery-history.query'
import type { IOrderDeliveryHistoryRepository } from '~/domain/repositories/order-delivery-history.repository.interface'
import { ORDER_DELIVERY_HISTORY_REPOSITORY } from '~/domain/repositories/order-delivery-history.repository.interface'

@QueryHandler(GetOrderDeliveryHistoryQuery)
export class GetOrderDeliveryHistoryHandler implements IQueryHandler<GetOrderDeliveryHistoryQuery> {
  constructor(
    @Inject(ORDER_DELIVERY_HISTORY_REPOSITORY)
    private readonly historyRepository: IOrderDeliveryHistoryRepository,
  ) {}

  async execute(query: GetOrderDeliveryHistoryQuery) {
    const { orderId } = query

    const history = await this.historyRepository.findByOrderId(orderId)
    if (!history) {
      throw new NotFoundException(`Khong tim thay lich su giao hang voi orderId: ${orderId}`)
    }

    return {
      data: history,
    }
  }
}
