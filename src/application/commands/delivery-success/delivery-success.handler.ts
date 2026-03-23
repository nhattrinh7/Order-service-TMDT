import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common'
import { DeliverySuccessCommand } from './delivery-success.command'
import { type IOrderRepository, ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { OrderStatus } from '~/domain/enums/order.enum'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { OrderStatus as PrismaOrderStatus } from '@prisma/client'
import { env } from '~/configs/env.config'
import type { IOrderDeliveryHistoryRepository } from '~/domain/repositories/order-delivery-history.repository.interface'
import { ORDER_DELIVERY_HISTORY_REPOSITORY } from '~/domain/repositories/order-delivery-history.repository.interface'
import { Settlement } from '~/domain/entities/settlement.entity'
import { SettlementMapper } from '~/infrastructure/database/mappers/settlement.mapper'
import { SettlementPaymentMethod, SettlementStatus } from '~/domain/enums/settlement.enum'

@CommandHandler(DeliverySuccessCommand)
export class DeliverySuccessHandler implements ICommandHandler<DeliverySuccessCommand> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,

    @Inject(ORDER_DELIVERY_HISTORY_REPOSITORY)
    private readonly historyRepository: IOrderDeliveryHistoryRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,

    private readonly prismaService: PrismaService,
  ) {}

  async execute(command: DeliverySuccessCommand): Promise<void> {
    const { orderId, shopId } = command

    const superAdminId = env.config.SUPER_ADMIN_ID
    if (!superAdminId) {
      throw new InternalServerErrorException('Chưa cấu hình SUPER_ADMIN_ID')
    }

    // 1. Kiểm tra đơn hàng có tồn tại không
    const order = await this.orderRepository.findByIdWithItems(orderId)
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với id: ${orderId}`)
    }

    if (order.shopId !== shopId) {
      throw new BadRequestException('Shop không khớp với đơn hàng')
    }

    // 2. Chỉ trạng thái SHIPPING mới có thể đánh dấu là DELIVERY_COMPLETED
    if (order.status !== OrderStatus.SHIPPING) {
      throw new BadRequestException(
        `Chỉ đơn hàng đang Giao hàng (SHIPPING) mới có thể đánh dấu là Đã giao thành công (DELIVERY_COMPLETED). Trạng thái hiện tại: ${order.status}`,
      )
    }

    const quantities = new Map<string, number>()
    for (const item of order.orderItems) {
      const current = quantities.get(item.productVariantId) ?? 0
      quantities.set(item.productVariantId, current + item.quantity)
    }
    const inventoryItems = Array.from(quantities.entries()).map(([productVariantId, quantity]) => ({
      productVariantId,
      quantity,
    }))

    const shopResponse = await this.messagePublisher.sendToShopService<
      { shopIds: string[] },
      Array<{ id: string; ownerId: string; name: string; logo: string | null }>
    >('get.shop', { shopIds: [order.shopId] })

    if (!shopResponse || shopResponse.length === 0) {
      throw new NotFoundException('Shop không tồn tại')
    }

    const shopOwnerId = shopResponse[0].ownerId
    const commissionFee = Math.floor(order.goodsPrice * 5 / 100)
    const payout = order.finalPrice - commissionFee
    const now = new Date()

    await this.prismaService.transaction(async (tx) => {
      const existingSettlement = await tx.settlement.findUnique({
        where: { orderId },
      })

      if (existingSettlement) {
        throw new BadRequestException('Đơn hàng đã được đối soát trước đó')
      }

      // 3. Cập nhật trạng thái
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: PrismaOrderStatus.DELIVERY_COMPLETED,
          updatedAt: now,
        },
      })

      // 4. Cập nhật lịch sử giao hàng
      await this.historyRepository.updateDeliverySuccessAt(orderId, now, tx)

      // 5. Tạo bản ghi settlement
      const settlement = Settlement.create({
        orderId: order.id,
        shopId: order.shopId,
        goodsPrice: order.goodsPrice,
        finalPrice: order.finalPrice,
        shippingFee: order.shippingFee,
        commissionFee,
        payout,
        paymentMethod: SettlementPaymentMethod.WALLET,
        status: SettlementStatus.COMPLETED,
        payoutAt: now,
        createdAt: now,
        updatedAt: now,
      })

      await tx.settlement.create({
        data: SettlementMapper.toPersistence(settlement),
      })
    })

    if (inventoryItems.length > 0) {
      this.messagePublisher.emitToInventoryService('inventory.delivery-success', {
        orderId: order.id,
        items: inventoryItems,
      })
    }

    // 6. Cộng commissionFee vào ví superadmin và payout vào ví shop
    this.messagePublisher.emitToUserService('refund.wallet', {
      userId: superAdminId,
      amount: commissionFee,
    })

    this.messagePublisher.emitToUserService('refund.wallet', {
      userId: shopOwnerId,
      amount: payout,
    })
  }
}
