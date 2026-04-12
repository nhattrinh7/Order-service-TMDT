import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { DispatchOrderCommand } from './dispatch-order.command'
import {
  type IOrderRepository,
  ORDER_REPOSITORY,
} from '~/domain/repositories/order.repository.interface'
import type { IOrderDeliveryHistoryRepository } from '~/domain/repositories/order-delivery-history.repository.interface'
import { ORDER_DELIVERY_HISTORY_REPOSITORY } from '~/domain/repositories/order-delivery-history.repository.interface'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { OrderStatus } from '~/domain/enums/order.enum'

@CommandHandler(DispatchOrderCommand)
export class DispatchOrderHandler implements ICommandHandler<DispatchOrderCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(ORDER_DELIVERY_HISTORY_REPOSITORY)
    private readonly historyRepository: IOrderDeliveryHistoryRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(command: DispatchOrderCommand) {
    const { orderId, userId } = command

    // 1. Tìm đơn hàng
    const order = await this.orderRepository.findById(orderId)
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại')
    }

    // 2. Kiểm tra quyền sở hữu shop
    const shopResponse = await this.messagePublisher.sendToShopService<
      { shopIds: string[] },
      Array<{ id: string; ownerId: string; name: string; logo: string | null }>
    >('get.shop', { shopIds: [order.shopId] })

    if (!shopResponse || shopResponse.length === 0) {
      throw new NotFoundException('Shop không tồn tại')
    }

    const shop = shopResponse[0]
    if (shop.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật đơn hàng này')
    }

    // 3. Kiểm tra trạng thái phải là PREPARING
    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException(
        'Chỉ có thể giao vận chuyển cho đơn hàng đang ở trạng thái chờ lấy hàng (PREPARING)',
      )
    }

    // 4. Cập nhật trạng thái sang SHIPPING
    await this.orderRepository.updateStatus(orderId, OrderStatus.SHIPPING)
    await this.historyRepository.updateDispatchToCarrierAt(orderId, new Date())
  }
}
