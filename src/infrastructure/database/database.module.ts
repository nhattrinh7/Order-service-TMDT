import { Module } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { OrderRepository } from '~/infrastructure/database/repositories/order.repository'
import { WAREHOUSE_REPOSITORY } from '~/domain/repositories/warehouse.repository.interface'
import { WarehouseRepository } from '~/infrastructure/database/repositories/warehouse.repository'
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
    
  ],

  exports: [
    PrismaService,
    ORDER_REPOSITORY,
    WAREHOUSE_REPOSITORY,
  ],

})
export class DatabaseModule {}
