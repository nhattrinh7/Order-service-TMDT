import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { Order } from '~/domain/entities/order.entity'
import { OrderMapper } from '~/infrastructure/database/mappers/order.mapper'
import { IOrderRepository } from '~/domain/repositories/order.repository.interface'

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  
}
