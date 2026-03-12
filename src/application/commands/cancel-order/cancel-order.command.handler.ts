import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { CancelOrderCommand } from './cancel-order.command'
import { type IOrderRepository, ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { OrderStatus, OrderPaymentMethod } from '~/domain/enums/order.enum'

const CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PREPARING,
  OrderStatus.AWAITING_CONFIRMATION,
]

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(command: CancelOrderCommand) {
    const { orderId, userId } = command

    // 1. Tìm đơn hàng
    const order = await this.orderRepository.findById(orderId)
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại')
    }

    // 2. Kiểm tra quyền sở hữu
    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này')
    }

    // 3. Kiểm tra trạng thái có được phép hủy không
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Không thể hủy đơn hàng sau khi đơn hàng đã bắt đầu được vận chuyển.`,
      )
    }

    // 4. Cập nhật trạng thái sang CANCELLED
    await this.orderRepository.updateStatus(orderId, OrderStatus.CANCELLED)

    // 5. Hoàn tiền vào ví nếu đơn đã thanh toán online (QRCODE hoặc WALLET)
    if (
      order.paymentMethod === OrderPaymentMethod.QRCODE ||
      order.paymentMethod === OrderPaymentMethod.WALLET
    ) {
      this.messagePublisher.emitToUserService('refund.wallet', {
        userId: order.userId,
        amount: order.finalPrice,
      })
    }

    return {
      success: true,
      message: 'Hủy đơn hàng thành công',
    }
  }
}
