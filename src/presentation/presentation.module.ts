import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { OrderController } from '~/presentation/v1/controllers/order.controller'
import { ApplicationModule } from '~/application/application.module'
import { MessagingModule } from '~/infrastructure/messaging/messaging.module'
import { ScannerController } from '~/presentation/v1/controllers/scanner.controller'

@Module({
  imports: [CqrsModule, ApplicationModule, MessagingModule],
  controllers: [OrderController, ScannerController],
  exports: [],
})
export class PresentationModule {}
