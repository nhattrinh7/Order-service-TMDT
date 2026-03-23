import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { IOrderDeliveryHistoryRepository } from '~/domain/repositories/order-delivery-history.repository.interface'
import { OrderDeliveryHistory as PrismaOrderDeliveryHistory } from '@prisma/client'
import { OrderDeliveryHistory } from '~/domain/entities/order-delivery-history.entity'
import { OrderDeliveryHistoryMapper } from '~/infrastructure/database/mappers/order-delivery-history.mapper'

@Injectable()
export class OrderDeliveryHistoryRepository implements IOrderDeliveryHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(orderId: string, tx?: any): Promise<PrismaOrderDeliveryHistory | null> {
    const prisma = tx || this.prisma
    return await prisma.orderDeliveryHistory.findFirst({
      where: { orderId },
    })
  }

  async createMany(
    histories: OrderDeliveryHistory[],
    tx?: any
  ): Promise<void> {
    if (histories.length === 0) return

    const prisma = tx || this.prisma
    await prisma.orderDeliveryHistory.createMany({
      data: histories.map(history => OrderDeliveryHistoryMapper.toPersistence(history))
    })
  }

  async updateWarehouse(
    orderId: string,
    warehouse: { name: string; address: string; time: string },
    tx?: any
  ): Promise<void> {
    const prisma = tx || this.prisma
    const history = await this.findByOrderId(orderId, tx)

    if (!history) {
      throw new NotFoundException(`Khong tim thay lich su giao hang voi orderId: ${orderId}`)
    }

    const currentWarehouses = Array.isArray(history.warehouses) 
      ? history.warehouses 
      : []

    await prisma.orderDeliveryHistory.update({
      where: { id: history.id },
      data: {
        warehouses: [...currentWarehouses, warehouse as any]
      }
    })
  }

  async updateShipper(
    orderId: string,
    shipper: { name: string; phoneNumber: string; time: string },
    tx?: any
  ): Promise<void> {
    const prisma = tx || this.prisma
    const history = await this.findByOrderId(orderId, tx)

    if (!history) {
      throw new NotFoundException(`Khong tim thay lich su giao hang voi orderId: ${orderId}`)
    }

    await prisma.orderDeliveryHistory.update({
      where: { id: history.id },
      data: {
        shipper: shipper as any
      }
    })
  }

  async updateDispatchToCarrierAt(orderId: string, dispatchToCarrierAt: Date, tx?: any): Promise<void> {
    const prisma = tx || this.prisma
    const history = await this.findByOrderId(orderId, tx)

    if (!history) {
      throw new NotFoundException(`Khong tim thay lich su giao hang voi orderId: ${orderId}`)
    }

    await prisma.orderDeliveryHistory.update({
      where: { id: history.id },
      data: {
        dispatchToCarrierAt
      }
    })
  }

  async updateDeliverySuccessAt(orderId: string, deliverySuccessAt: Date, tx?: any): Promise<void> {
    const prisma = tx || this.prisma
    const history = await this.findByOrderId(orderId, tx)

    if (!history) {
      throw new NotFoundException(`Khong tim thay lich su giao hang voi orderId: ${orderId}`)
    }

    await prisma.orderDeliveryHistory.update({
      where: { id: history.id },
      data: {
        deliverySuccessAt
      }
    })
  }

  async updateDeliveryFailAt(orderId: string, deliveryFailAt: Date, tx?: any): Promise<void> {
    const prisma = tx || this.prisma
    const history = await this.findByOrderId(orderId, tx)

    if (!history) {
      throw new NotFoundException(`Khong tim thay lich su giao hang voi orderId: ${orderId}`)
    }

    await prisma.orderDeliveryHistory.update({
      where: { id: history.id },
      data: {
        deliveryFailAt
      }
    })
  }
}
