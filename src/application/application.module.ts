import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { DatabaseModule } from '~/infrastructure/database/database.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { CalculatePriceHandler } from './commands/calculate-price/calculate-price.command.handler'
import { SagaCreateOrdersHandler } from './commands/saga-create-orders/saga-create-orders.command.handler'
import { SagaCancelOrdersHandler } from './commands/saga-cancel-orders/saga-cancel-orders.command.handler'
import { SagaUpdateOrdersStatusHandler } from './commands/saga-update-orders-status/saga-update-orders-status.command.handler'

const CommandHandlers = [
  CalculatePriceHandler,
  SagaCreateOrdersHandler,
  SagaCancelOrdersHandler,
  SagaUpdateOrdersStatusHandler,
]

const QueryHandlers = [
  
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