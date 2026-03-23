import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import { RabbitMQPublisher } from '~/infrastructure/messaging/publishers/rabbitmq.publisher'
import { CqrsModule } from '@nestjs/cqrs'
import { SagaOrderConsumer } from '~/infrastructure/messaging/consumers/saga-order.consumer'


@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATION_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin123@localhost:5672'],
          queue: 'notification_queue',
          persistent: true,
        },
      },
      {
        name: 'USER_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin123@localhost:5672'],
          queue: 'user_queue',
          persistent: true,
        },
      },
      {
        name: 'SHOP_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin123@localhost:5672'],
          queue: 'shop_queue',
          persistent: true,
        },
      },
      {
        name: 'CATALOG_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin123@localhost:5672'],
          queue: 'catalog_queue',
          persistent: true,
        },
      },
      {
        name: 'INVENTORY_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin123@localhost:5672'],
          queue: 'inventory_queue',
          persistent: true,
        },
      },
      {
        name: 'VOUCHER_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin123@localhost:5672'],
          queue: 'voucher_queue',
          persistent: true,
        },
      },
      {
        name: 'SAGA_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:admin123@localhost:5672'],
          queue: 'saga_queue',
          persistent: true,
        },
      },
    ]),
  ],
  controllers: [
    SagaOrderConsumer,
  ],
  providers: [
    {
      provide: MESSAGE_PUBLISHER,
      useClass: RabbitMQPublisher,
    },
  ],
  exports: [ClientsModule, MESSAGE_PUBLISHER],
})
export class MessagingModule {}
