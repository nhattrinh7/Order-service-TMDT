import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, Logger } from '@nestjs/common'
import { SagaCancelOrdersCommand } from './saga-cancel-orders.command'
import type { IOrderRepository } from '~/domain/repositories/order.repository.interface'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { OrderStatus } from '~/domain/enums/order.enum'

@CommandHandler(SagaCancelOrdersCommand)
export class SagaCancelOrdersHandler implements ICommandHandler<SagaCancelOrdersCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  private readonly logger = new Logger(SagaCancelOrdersHandler.name)

  async execute(command: SagaCancelOrdersCommand): Promise<void> {
    const { orderIds, status } = command

    this.logger.log(`SagaCancelOrdersHandler: orderIds count=${orderIds.length}, status=${status}`)

    const updatedCount = await this.orderRepository.updateManyStatus(
      orderIds,
      (status as OrderStatus) || OrderStatus.ORDER_FAILED,
    )

    this.logger.log(`SagaCancelOrdersHandler: ${updatedCount} orders updated to ${status}`)
  }
}
