import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import { DeliveryFailCommand } from './delivery-fail.command'
import {
  type IOrderRepository,
  ORDER_REPOSITORY,
} from '~/domain/repositories/order.repository.interface'
import { OrderStatus, OrderPaymentMethod } from '~/domain/enums/order.enum'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import type { IOrderDeliveryHistoryRepository } from '~/domain/repositories/order-delivery-history.repository.interface'
import { ORDER_DELIVERY_HISTORY_REPOSITORY } from '~/domain/repositories/order-delivery-history.repository.interface'

@CommandHandler(DeliveryFailCommand)
export class DeliveryFailHandler implements ICommandHandler<DeliveryFailCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(ORDER_DELIVERY_HISTORY_REPOSITORY)
    private readonly historyRepository: IOrderDeliveryHistoryRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(command: DeliveryFailCommand): Promise<void> {
    const { orderId } = command

    // 1. Kiểm tra đơn hàng có tồn tại không
    const order = await this.orderRepository.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với id: ${orderId}`)
    }

    // 2. Chỉ trạng thái SHIPPING mới có thể đánh dấu là DELIVERY_FAILED
    if (order.status !== OrderStatus.SHIPPING) {
      throw new BadRequestException(
        `Chỉ đơn hàng đang Giao hàng (SHIPPING) mới có thể chuyển sang trạng thái Giao thất bại (DELIVERY_FAILED). Trạng thái hiện tại: ${order.status}`,
      )
    }

    // 3. Cập nhật trạng thái và lý do (dùng chung trường cancelReason)
    const quantities = new Map<string, number>()
    for (const item of order.orderItems) {
      const current = quantities.get(item.productVariantId) ?? 0
      quantities.set(item.productVariantId, current + item.quantity)
    }
    const inventoryItems = Array.from(quantities.entries()).map(([productVariantId, quantity]) => ({
      productVariantId,
      quantity,
    }))

    await this.orderRepository.updateStatus(orderId, OrderStatus.DELIVERY_FAILED)
    await this.historyRepository.updateDeliveryFailAt(orderId, new Date())

    if (inventoryItems.length > 0) {
      this.messagePublisher.emitToInventoryService('inventory.delivery-fail', {
        orderId: order.id,
        items: inventoryItems,
      })
    }

    if (
      order.paymentMethod === OrderPaymentMethod.QRCODE ||
      order.paymentMethod === OrderPaymentMethod.WALLET
    ) {
      this.messagePublisher.emitToUserService('refund.wallet', {
        userId: order.userId,
        amount: order.goodsPrice,
      })
    }
  }
}
