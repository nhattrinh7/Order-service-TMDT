import { Injectable, Inject } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs/internal/lastValueFrom'
import { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'

@Injectable()
export class RabbitMQPublisher implements IMessagePublisher {
  constructor(
    @Inject('NOTIFICATION_CLIENT') 
    private readonly notificationClient: ClientProxy,
    @Inject('SHOP_CLIENT') 
    private readonly shopClient: ClientProxy,
    @Inject('USER_CLIENT') 
    private readonly userClient: ClientProxy,
  ) {}

  publish<T>(pattern: string, event: T): void {
    this.notificationClient.emit(pattern, event)
  }

  async sendToUserService<T, R = any>(pattern: string, data: T): Promise<R> {
    const response$ = this.userClient.send<R, T>(pattern, data)
    return lastValueFrom(response$)
  }

  async sendToShopService<T, R = any>(pattern: string, data: T): Promise<R> {
    const response$ = this.shopClient.send<R, T>(pattern, data)
    return lastValueFrom(response$)
  }
}