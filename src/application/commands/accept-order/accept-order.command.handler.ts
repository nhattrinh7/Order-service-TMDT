import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { AcceptOrderCommand } from './accept-order.command'
import { type IOrderRepository, ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { OrderStatus } from '~/domain/enums/order.enum'

@CommandHandler(AcceptOrderCommand)
export class AcceptOrderHandler implements ICommandHandler<AcceptOrderCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(command: AcceptOrderCommand) {
    const { orderId, userId } = command

    // 1. Tìm đơn hàng
    const order = await this.orderRepository.findById(orderId)
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại')
    }

    // 2. Kiểm tra quyền sở hữu shop: lấy shop theo shopId, verify userId là chủ shop
    const shopResponse = await this.messagePublisher.sendToShopService<
      { shopIds: string[] },
      Array<{ id: string; ownerId: string; name: string; logo: string | null }>
    >('get.shop', { shopIds: [order.shopId] })

    if (!shopResponse || shopResponse.length === 0) {
      throw new NotFoundException('Shop không tồn tại')
    }

    const shop = shopResponse[0]
    if (shop.ownerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xác nhận đơn hàng này')
    }

    // 3. Kiểm tra trạng thái phải là AWAITING_CONFIRMATION
    if (order.status !== OrderStatus.AWAITING_CONFIRMATION) {
      throw new BadRequestException(
        'Chỉ có thể xác nhận đơn hàng đang ở trạng thái chờ xác nhận',
      )
    }

    // 4. Cập nhật trạng thái sang PREPARING
    await this.orderRepository.updateStatus(orderId, OrderStatus.PREPARING)
  }
}
