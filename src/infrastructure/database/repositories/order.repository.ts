import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { IOrderRepository, OrderWithItems } from '~/domain/repositories/order.repository.interface'
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

  async updateStatus(orderId: string, status: OrderStatus, cancelReason?: string): Promise<void> {
    const data: any = {
      status: status as unknown as PrismaOrderStatus,
      updatedAt: new Date(),
    }
    if (cancelReason !== undefined) {
      data.cancelReason = cancelReason
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data,
    })
  }

  async findById(orderId: string): Promise<Order | null> {
    const prismaOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!prismaOrder) return null

    return OrderMapper.toDomain(prismaOrder)
  }

  async findByUserIdPaginated(
    userId: string,
    status: OrderStatus,
    cursorTimestamp?: Date,
    cursorId?: string,
    limit: number = 10,
  ): Promise<OrderWithItems[]> {
    const where: any = {
      userId,
      status: status as unknown as PrismaOrderStatus,
    }

    // Compound cursor: lấy các đơn cũ hơn cursor (createdAt, id)
    if (cursorTimestamp && cursorId) {
      where.OR = [
        { createdAt: { lt: cursorTimestamp } },
        { createdAt: cursorTimestamp, id: { lt: cursorId } },
      ]
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: { orderItems: true },
    })

    return orders.map((order: any) => ({
      id: order.id,
      userId: order.userId,
      shopId: order.shopId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      goodsPrice: order.goodsPrice,
      finalPrice: order.finalPrice,
      shippingAddress: order.shippingAddress,
      receiverName: order.receiverName,
      receiverPhoneNumber: order.receiverPhoneNumber,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      szoneVoucherDiscount: order.szoneVoucherDiscount,
      shopVoucherDiscount: order.shopVoucherDiscount,
      cancelReason: order.cancelReason,
      returnReason: order.returnReason,
      createdAt: order.createdAt,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        variantImage: item.variantImage,
        sku: item.sku,
        quantity: item.quantity,
        finalPrice: item.finalPrice,
      })),
    }))
  }

  async countByShopId(shopId: string, status: OrderStatus, search?: string): Promise<number> {
    const where: any = {
      shopId,
      status: status as unknown as PrismaOrderStatus,
    }

    if (search) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search)
      
      where.OR = []
      
      if (isUuid) {
        where.OR.push({ id: search })
      }
      
      where.OR.push({
        orderItems: {
          some: {
            productName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      })
    }

    return this.prisma.order.count({ where })
  }

  async findByShopIdPaginated(
    shopId: string,
    status: OrderStatus,
    skip: number,
    take: number,
    search?: string,
  ): Promise<OrderWithItems[]> {
    const where: any = {
      shopId,
      status: status as unknown as PrismaOrderStatus,
    }

    if (search) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search)
      
      where.OR = []

      if (isUuid) {
        where.OR.push({ id: search })
      }
      
      where.OR.push({
        orderItems: {
          some: {
            productName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      })
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
      include: { orderItems: true },
    })

    return orders.map((order: any) => ({
      id: order.id,
      userId: order.userId,
      shopId: order.shopId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      goodsPrice: order.goodsPrice,
      finalPrice: order.finalPrice,
      shippingAddress: order.shippingAddress,
      receiverName: order.receiverName,
      receiverPhoneNumber: order.receiverPhoneNumber,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      szoneVoucherDiscount: order.szoneVoucherDiscount,
      shopVoucherDiscount: order.shopVoucherDiscount,
      cancelReason: order.cancelReason,
      returnReason: order.returnReason,
      createdAt: order.createdAt,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        variantImage: item.variantImage,
        sku: item.sku,
        quantity: item.quantity,
        finalPrice: item.finalPrice,
      })),
    }))
  }
}
