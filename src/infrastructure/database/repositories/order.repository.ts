import { Injectable } from '@nestjs/common'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'
import { IOrderRepository, OrderWithItems } from '~/domain/repositories/order.repository.interface'
import { Order } from '~/domain/entities/order.entity'
import { OrderMapper } from '~/infrastructure/database/mappers/order.mapper'
import { OrderStatus, OrderItemReturnStatus } from '~/domain/enums/order.enum'
import {
  OrderStatus as PrismaOrderStatus,
  OrderItemReturnStatus as PrismaOrderItemReturnStatus,
} from '@prisma/client'

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

  async findById(orderId: string, tx?: any): Promise<Order | null> {
    const client = tx || this.prisma
    const prismaOrder = await client.order.findUnique({
      where: { id: orderId },
    })

    if (!prismaOrder) return null

    return OrderMapper.toDomain(prismaOrder)
  }

  async findByIdWithItems(orderId: string, tx?: any): Promise<Order | null> {
    const client = tx || this.prisma
    const prismaOrder = await client.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    })

    if (!prismaOrder) return null

    return OrderMapper.toDomainWithItems(prismaOrder)
  }

  async findByUserIdPaginated(
    userId: string,
    status: OrderStatus,
    returnStatus?: OrderItemReturnStatus,
    cursorTimestamp?: Date,
    cursorId?: string,
    limit: number = 10,
  ): Promise<OrderWithItems[]> {
    const where: any = {
      userId,
      status: status as unknown as PrismaOrderStatus,
    }

    if (returnStatus) {
      where.orderItems = {
        some: {
          returnStatus: returnStatus as unknown as PrismaOrderItemReturnStatus,
        },
      }
    }

    // Compound cursor: lay cac don cu hon cursor (createdAt, id)
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
        returnReason: item.returnReason,
        returnStatus: item.returnStatus,
        returnRequestedAt: item.returnRequestedAt,
        returnResolvedAt: item.returnResolvedAt,
      })),
    }))
  }

  async countByStatus(
    status: OrderStatus,
    search?: string,
    returnStatus?: OrderItemReturnStatus,
  ): Promise<number> {
    const where: any = {
      status: status as unknown as PrismaOrderStatus,
    }

    if (returnStatus) {
      where.orderItems = {
        some: {
          returnStatus: returnStatus as unknown as PrismaOrderItemReturnStatus,
        },
      }
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

  async findByStatusPaginated(
    status: OrderStatus,
    skip: number,
    take: number,
    search?: string,
    returnStatus?: OrderItemReturnStatus,
  ): Promise<OrderWithItems[]> {
    const where: any = {
      status: status as unknown as PrismaOrderStatus,
    }

    if (returnStatus) {
      where.orderItems = {
        some: {
          returnStatus: returnStatus as unknown as PrismaOrderItemReturnStatus,
        },
      }
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
        returnReason: item.returnReason,
        returnStatus: item.returnStatus,
        returnRequestedAt: item.returnRequestedAt,
        returnResolvedAt: item.returnResolvedAt,
      })),
    }))
  }

  async countByShopId(
    shopId: string,
    status: OrderStatus,
    search?: string,
    returnStatus?: OrderItemReturnStatus,
  ): Promise<number> {
    const where: any = {
      shopId,
      status: status as unknown as PrismaOrderStatus,
    }

    if (returnStatus) {
      where.orderItems = {
        some: {
          returnStatus: returnStatus as unknown as PrismaOrderItemReturnStatus,
        },
      }
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
    returnStatus?: OrderItemReturnStatus,
  ): Promise<OrderWithItems[]> {
    const where: any = {
      shopId,
      status: status as unknown as PrismaOrderStatus,
    }

    if (returnStatus) {
      where.orderItems = {
        some: {
          returnStatus: returnStatus as unknown as PrismaOrderItemReturnStatus,
        },
      }
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
        returnReason: item.returnReason,
        returnStatus: item.returnStatus,
        returnRequestedAt: item.returnRequestedAt,
        returnResolvedAt: item.returnResolvedAt,
      })),
    }))
  }

  async findOrderItemByIdWithOrder(orderItemId: string) {
    return (await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: {
        id: true,
        returnStatus: true,
        finalPrice: true,
        orderId: true,
        order: {
          select: {
            userId: true,
            status: true,
          },
        },
      },
    })) as any
  }

  async updateOrderItemReturnRequest(orderItemId: string, returnReason: string): Promise<void> {
    await this.prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        returnReason,
        returnStatus: PrismaOrderItemReturnStatus.REFUNDED,
        returnRequestedAt: new Date(),
        returnResolvedAt: new Date(),
      },
    })
  }
}
