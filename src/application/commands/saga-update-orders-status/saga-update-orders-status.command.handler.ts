import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { SagaUpdateOrdersStatusCommand } from './saga-update-orders-status.command'
import type { IOrderRepository } from '~/domain/repositories/order.repository.interface'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { OrderStatus } from '~/domain/enums/order.enum'

@CommandHandler(SagaUpdateOrdersStatusCommand)
export class SagaUpdateOrdersStatusHandler
  implements ICommandHandler<SagaUpdateOrdersStatusCommand>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(command: SagaUpdateOrdersStatusCommand): Promise<void> {
    const { orderIds, status } = command

    await this.orderRepository.updateManyStatus(orderIds, status as OrderStatus)
  }
}
