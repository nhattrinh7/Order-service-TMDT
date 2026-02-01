import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import type { IOrderRepository } from '~/domain/repositories/order.repository.interface'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { Inject, NotFoundException } from '@nestjs/common'
import { GetOrderToShipperQuery } from '~/application/queries/get-order-to-shipper/get-order-to-shipper.query'
import { OrderDto } from '~/presentation/dtos/order.dto'
import { type IMessagePublisher, MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'

@QueryHandler(GetOrderToShipperQuery)
export class GetOrderToShipperHandler implements IQueryHandler<GetOrderToShipperQuery, OrderDto[]> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(query: GetOrderToShipperQuery) {
    const { orderId, shipper } = query

    const order = await this.orderRepository.findById(orderId)
    if (!order) throw new NotFoundException('Order not found')
    

    return 
  }
}