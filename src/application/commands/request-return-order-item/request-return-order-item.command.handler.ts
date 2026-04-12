import { BadRequestException, ForbiddenException, Inject, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { RequestReturnOrderItemCommand } from './request-return-order-item.command'
import {
  ORDER_REPOSITORY,
  type IOrderRepository,
} from '~/domain/repositories/order.repository.interface'
import { OrderItemReturnStatus, OrderStatus } from '~/domain/enums/order.enum'
import {
  MESSAGE_PUBLISHER,
  type IMessagePublisher,
} from '~/domain/contracts/message-publisher.interface'

@CommandHandler(RequestReturnOrderItemCommand)
export class RequestReturnOrderItemHandler
  implements ICommandHandler<RequestReturnOrderItemCommand>
{
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(command: RequestReturnOrderItemCommand) {
    const { orderItemId, userId, returnReason } = command

    const orderItem = await this.orderRepository.findOrderItemByIdWithOrder(orderItemId)
    if (!orderItem) throw new NotFoundException('Không tìm thấy sản phẩm trong đơn hàng')

    if (orderItem.order.userId !== userId) {
      throw new ForbiddenException('Không có quyền yêu cầu trả hàng cho sản phẩm này')
    }

    if (orderItem.order.status !== OrderStatus.DELIVERY_COMPLETED) {
      throw new BadRequestException('Chỉ có thể yêu cầu trả hàng sau khi đơn đã giao thành công')
    }

    if (orderItem.returnStatus !== OrderItemReturnStatus.NONE) {
      throw new BadRequestException('Sản phẩm này đã được hoàn tiền')
    }

    await this.orderRepository.updateOrderItemReturnRequest(orderItemId, returnReason)

    this.messagePublisher.emitToUserService('refund.wallet', {
      userId: orderItem.order.userId,
      amount: orderItem.finalPrice,
    })

    return {
      success: true,
      message: 'Đã hoàn tiền cho sản phẩm thành công',
    }
  }
}
