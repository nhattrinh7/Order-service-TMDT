import { Controller, Inject } from '@nestjs/common'
import { Payload, Ctx, RmqContext, EventPattern } from '@nestjs/microservices'
import { CommandBus } from '@nestjs/cqrs'
import { BaseRetryConsumer } from '~/common/utils/base-retry.consumer'
import { SagaCreateOrdersCommand } from '~/application/commands/saga-create-orders/saga-create-orders.command'
import { SagaCancelOrdersCommand } from '~/application/commands/saga-cancel-orders/saga-cancel-orders.command'
import { SagaUpdateOrdersStatusCommand } from '~/application/commands/saga-update-orders-status/saga-update-orders-status.command'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'

@Controller()
export class SagaOrderConsumer extends BaseRetryConsumer {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {
    super()
  }

  @EventPattern('saga.create-orders')
  async handleCreateOrders(
    @Payload()
    data: {
      sagaId: string
      userId: string
      paymentMethod: string
      paymentId?: string
      orders: Array<{
        shopId: string
        subtotal: number
        shippingFee: number
        shopVoucherDiscount: number
        szoneVoucherDiscount: number
        goodsPrice: number
        finalPrice: number
        paymentMethod: string
        paymentId?: string
        shippingAddress: string
        receiverName: string
        receiverPhoneNumber: string
        items: Array<{
          productId: string
          productVariantId: string
          quantity: number
          price: number
          productName: string
          sku: string
          image: string
        }>
      }>
    },
    @Ctx() context: RmqContext,
  ) {
    await this.handleWithRetry(context, async () => {
      this.logger.log(`Event saga.create-orders received, sagaId=${data.sagaId}`)
      try {
        const result = await this.commandBus.execute(
          new SagaCreateOrdersCommand(data.sagaId, data.userId, data.paymentMethod, data.orders),
        )

        this.messagePublisher.emitToSagaOrchestrator('saga.result.create-orders', {
          sagaId: data.sagaId,
          success: true,
          orderIds: result.orderIds,
        })
      } catch (error: any) {
        this.messagePublisher.emitToSagaOrchestrator('saga.result.create-orders', {
          sagaId: data.sagaId,
          success: false,
          error: error.message || 'Lỗi tạo đơn hàng',
        })
      }
    })
  }

  @EventPattern('saga.cancel-orders')
  async handleCancelOrders(
    @Payload() data: { sagaId: string; orderIds: string[]; status: string },
    @Ctx() context: RmqContext,
  ) {
    await this.handleWithRetry(context, async () => {
      this.logger.log(`Event saga.cancel-orders received, sagaId=${data.sagaId}`)
      try {
        await this.commandBus.execute(
          new SagaCancelOrdersCommand(data.sagaId, data.orderIds, data.status),
        )
      } catch (error: any) {
        this.logger.error(`Cancel orders failed: ${error.message}`)
      }
    })
  }

  @EventPattern('saga.update-orders-status')
  async handleUpdateOrdersStatus(
    @Payload() data: { sagaId: string; orderIds: string[]; status: string },
    @Ctx() context: RmqContext,
  ) {
    await this.handleWithRetry(context, async () => {
      this.logger.log(`Event saga.update-orders-status received, sagaId=${data.sagaId}`)
      try {
        await this.commandBus.execute(
          new SagaUpdateOrdersStatusCommand(data.sagaId, data.orderIds, data.status),
        )
      } catch (error: any) {
        this.logger.error(`Update orders status failed: ${error.message}`)
      }
    })
  }
}
