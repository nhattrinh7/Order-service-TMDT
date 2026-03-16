import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { IOrderDeliveryHistoryRepository } from '~/domain/repositories/order-delivery-history.repository.interface'
import { OrderDeliveryHistory, Prisma } from '@prisma/client'

@Injectable()
export class OrderDeliveryHistoryRepository implements IOrderDeliveryHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(orderId: string, tx?: any): Promise<OrderDeliveryHistory | null> {
    const prisma = tx || this.prisma
    return await prisma.orderDeliveryHistory.findFirst({
      where: { orderId },
    })
  }

  async upsertWarehouse(orderId: string, warehouse: { name: string; address: string; time: string }, tx?: any): Promise<void> {
    const prisma = tx || this.prisma
    const history = await this.findByOrderId(orderId, tx)

    if (history) {
      // Đã có bản ghi, cập nhật mảng warehouses append thêm
      const currentWarehouses = Array.isArray(history.warehouses) 
        ? history.warehouses 
        : []
        
      await prisma.orderDeliveryHistory.update({
        where: { id: history.id },
        data: {
          warehouses: [...currentWarehouses, warehouse as any]
        }
      })
    } else {
      // Chưa có, tạo mới
      await prisma.orderDeliveryHistory.create({
        data: {
          orderId,
          warehouses: [warehouse as any],
          shipper: Prisma.JsonNull
        }
      })
    }
  }

  async upsertShipper(orderId: string, shipper: { name: string; phoneNumber: string; time: string }, tx?: any): Promise<void> {
    const prisma = tx || this.prisma
    const history = await this.findByOrderId(orderId, tx)

    if (history) {
      await prisma.orderDeliveryHistory.update({
        where: { id: history.id },
        data: {
          shipper: shipper as any
        }
      })
    } else {
      await prisma.orderDeliveryHistory.create({
        data: {
          orderId,
          warehouses: Prisma.JsonNull,
          shipper: shipper as any
        }
      })
    }
  }
}
