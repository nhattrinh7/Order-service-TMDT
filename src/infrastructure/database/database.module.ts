import { Module } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { OrderRepository } from '~/infrastructure/database/repositories/order.repository'
import { WAREHOUSE_REPOSITORY } from '~/domain/repositories/warehouse.repository.interface'
import { WarehouseRepository } from '~/infrastructure/database/repositories/warehouse.repository'
import { ORDER_DELIVERY_HISTORY_REPOSITORY } from '~/domain/repositories/order-delivery-history.repository.interface'
import { OrderDeliveryHistoryRepository } from '~/infrastructure/database/repositories/order-delivery-history.repository'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [CqrsModule],
  providers: [
    PrismaService,
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },
    {
      provide: WAREHOUSE_REPOSITORY,
      useClass: WarehouseRepository,
    },
    {
      provide: ORDER_DELIVERY_HISTORY_REPOSITORY,
      useClass: OrderDeliveryHistoryRepository,
    },
  ],

  exports: [
    PrismaService,
    ORDER_REPOSITORY,
    WAREHOUSE_REPOSITORY,
    ORDER_DELIVERY_HISTORY_REPOSITORY,
  ],
})
export class DatabaseModule {}
