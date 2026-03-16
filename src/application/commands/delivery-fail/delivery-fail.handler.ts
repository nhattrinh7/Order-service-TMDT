import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import { DeliveryFailCommand } from './delivery-fail.command'
import { type IOrderRepository, ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { OrderStatus } from '~/domain/enums/order.enum'

@CommandHandler(DeliveryFailCommand)
export class DeliveryFailHandler implements ICommandHandler<DeliveryFailCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(command: DeliveryFailCommand): Promise<void> {
    const { orderId } = command

    // 1. Kiểm tra đơn hàng có tồn tại không
    const order = await this.orderRepository.findById(orderId)
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
    await this.orderRepository.updateStatus(orderId, OrderStatus.DELIVERY_FAILED)
  }
}
