import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { OrderController } from '~/presentation/v1/controllers/order.controller'
import { ApplicationModule } from '~/application/application.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'

@Module({
  imports: [CqrsModule, ApplicationModule, MessagingModule],
  controllers: [OrderController],
  exports: [],
})
export class PresentationModule {}
