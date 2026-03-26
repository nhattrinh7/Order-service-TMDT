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
import { GetAdminOrdersHandler } from './queries/get-admin-orders/get-admin-orders.query.handler'
import { DispatchOrderHandler } from './commands/dispatch-order/dispatch-order.command.handler'
import { GetScannerWarehouseHandler } from './queries/get-scanner-warehouse/get-scanner-warehouse.query.handler'
import { CreateWarehouseHandler } from './commands/create-warehouse/create-warehouse.command.handler'
import { ArrivedWarehouseHandler } from './commands/arrived-warehouse/arrived-warehouse.command.handler'
import { GetOrderToShipperHandler } from './queries/get-order-to-shipper/get-order-to-shipper.query.handler'
import { DeliverySuccessHandler } from './commands/delivery-success/delivery-success.command.handler'
import { DeliveryFailHandler } from './commands/delivery-fail/delivery-fail.command.handler'
import { RequestReturnOrderItemHandler } from './commands/request-return-order-item/request-return-order-item.command.handler'
import { GetShopSettlementsHandler } from './queries/get-shop-settlements/get-shop-settlements.query.handler'
import { GetOrderDeliveryHistoryHandler } from './queries/get-order-delivery-history/get-order-delivery-history.query.handler'

const CommandHandlers = [
  CalculatePriceHandler,
  SagaCreateOrdersHandler,
  SagaCancelOrdersHandler,
  SagaUpdateOrdersStatusHandler,
  CancelOrderHandler,
  AcceptOrderHandler,
  DispatchOrderHandler,
  CreateWarehouseHandler,
  ArrivedWarehouseHandler,
  DeliverySuccessHandler,
  DeliveryFailHandler,
  RequestReturnOrderItemHandler,
]

const QueryHandlers = [
  GetUserOrdersHandler,
  GetShopOrdersHandler,
  GetAdminOrdersHandler,
  GetScannerWarehouseHandler,
  GetOrderToShipperHandler,
  GetOrderDeliveryHistoryHandler,
  GetShopSettlementsHandler,
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
