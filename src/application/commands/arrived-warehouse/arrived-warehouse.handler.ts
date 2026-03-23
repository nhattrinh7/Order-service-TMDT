import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException } from '@nestjs/common'
import { ArrivedWarehouseCommand } from './arrived-warehouse.command'
import type { IOrderRepository } from '~/domain/repositories/order.repository.interface'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import type { IOrderDeliveryHistoryRepository } from '~/domain/repositories/order-delivery-history.repository.interface'
import { ORDER_DELIVERY_HISTORY_REPOSITORY } from '~/domain/repositories/order-delivery-history.repository.interface'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'

@CommandHandler(ArrivedWarehouseCommand)
export class ArrivedWarehouseHandler implements ICommandHandler<ArrivedWarehouseCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(ORDER_DELIVERY_HISTORY_REPOSITORY)
    private readonly historyRepository: IOrderDeliveryHistoryRepository,

    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: ArrivedWarehouseCommand): Promise<void> {
    const { orderId, name, address } = command

    await this.prismaService.transaction(async (tx) => {
      // 1. Kiểm tra đơn hàng có tồn tại không
      const order = await this.orderRepository.findById(orderId, tx)
      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng với id: ${orderId}`)
      }

      // 2. Format dữ liệu warehouse
      const warehouseData = {
        name,
        address,
        time: new Date().toISOString()
      }

      // 3. Upsert vào bảng OrderDeliveryHistory (chỉ append vào trường warehouses)
      await this.historyRepository.updateWarehouse(orderId, warehouseData, tx)
    })
  }
}
