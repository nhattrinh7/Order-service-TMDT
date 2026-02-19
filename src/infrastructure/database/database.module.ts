import { Module } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { ORDER_REPOSITORY } from '~/domain/repositories/order.repository.interface'
import { OrderRepository } from '~/infrastructure/database/repositories/order.repository'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [CqrsModule],
  providers: [
    PrismaService,
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },
    
  ],
  exports: [
    ORDER_REPOSITORY,
  ],
})
export class DatabaseModule {}
