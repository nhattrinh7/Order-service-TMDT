import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { IOrderRepository } from '~/domain/repositories/order.repository.interface'
import { Order } from '~/domain/entities/order.entity'
import { OrderMapper } from '~/infrastructure/database/mappers/order.mapper'
import { OrderStatus } from '~/domain/enums/order.enum'
import { OrderStatus as PrismaOrderStatus } from '@prisma/client'

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveMany(orders: Order[], tx?: any): Promise<string[]> {
    const client = tx || this.prisma
    const orderIds: string[] = []

    for (const order of orders) {
      const persistenceData = OrderMapper.toPersistence(order)
      const orderItems = order.orderItems.map(item => item.toPlainObject())

      await client.order.create({
        data: {
          ...persistenceData,
          orderItems: {
            createMany: {
              data: orderItems,
            },
          },
        },
      })

      orderIds.push(order.id)
    }

    return orderIds
  }

  async updateManyStatus(orderIds: string[], status: OrderStatus, tx?: any): Promise<number> {
    const client = tx || this.prisma
    const result = await client.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        status: status as unknown as PrismaOrderStatus,
        updatedAt: new Date(),
      },
    })

    return result.count
  }
}
