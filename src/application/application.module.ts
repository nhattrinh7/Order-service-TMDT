import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { CalculatePriceHandler } from './commands/calculate-price/calculate-price.command.handler'
import { SagaCreateOrdersHandler } from './commands/saga-create-orders/saga-create-orders.command.handler'
import { SagaCancelOrdersHandler } from './commands/saga-cancel-orders/saga-cancel-orders.command.handler'
import { SagaUpdateOrdersStatusHandler } from './commands/saga-update-orders-status/saga-update-orders-status.command.handler'
import { CancelOrderHandler } from './commands/cancel-order/cancel-order.command.handler'
import { AcceptOrderHandler } from './commands/accept-order/accept-order.command.handler'
import { GetUserOrdersHandler } from './queries/get-user-orders/get-user-orders.query.handler'
import { GetShopOrdersHandler } from './queries/get-shop-orders/get-shop-orders.query.handler'
import { DispatchOrderHandler } from './commands/dispatch-order/dispatch-order.command.handler'

const CommandHandlers = [
  CalculatePriceHandler,
  SagaCreateOrdersHandler,
  SagaCancelOrdersHandler,
  SagaUpdateOrdersStatusHandler,
  CancelOrderHandler,
  AcceptOrderHandler,
  DispatchOrderHandler,
]

const QueryHandlers = [
  GetUserOrdersHandler,
  GetShopOrdersHandler,
]

const EventHandlers = [

]
 
@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    MessagingModule
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [],
})
export class ApplicationModule {}