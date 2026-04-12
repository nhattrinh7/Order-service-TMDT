import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { CancelOrderCommand } from './cancel-order.command'
import {
  type IOrderRepository,
  ORDER_REPOSITORY,
} from '~/domain/repositories/order.repository.interface'
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
    const { orderId, userId, cancelReason } = command

    // 1. Tìm đơn hàng
    const order = await this.orderRepository.findByIdWithItems(orderId)
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

    // 4. Cập nhật trạng thái sang CANCELLED và lưu lý do
    await this.orderRepository.updateStatus(orderId, OrderStatus.CANCELLED, cancelReason)

    // 5. Giảm buy_count ở catalog-service
    const quantities = new Map<string, number>()
    for (const item of order.orderItems) {
      const current = quantities.get(item.productId) ?? 0
      quantities.set(item.productId, current + item.quantity)
    }
    const items = Array.from(quantities.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }))

    if (items.length > 0) {
      this.messagePublisher.emitToCatalogService('order.decrease-buy-count', {
        orderId,
        items,
      })
    }

    // 6. Hoàn tiền vào ví nếu đơn đã thanh toán online (QRCODE hoặc WALLET)
    if (
      order.paymentMethod === OrderPaymentMethod.QRCODE ||
      order.paymentMethod === OrderPaymentMethod.WALLET
    ) {
      this.messagePublisher.emitToUserService('refund.wallet', {
        userId: order.userId,
        amount: order.goodsPrice,
      })
    }

    return {
      success: true,
      message: 'Hủy đơn hàng thành công',
    }
  }
}
