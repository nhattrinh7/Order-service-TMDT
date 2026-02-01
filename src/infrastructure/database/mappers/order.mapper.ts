
import { Order as PrismaOrder} from '@prisma/client'
import { Order } from '~/domain/entities/order.entity'

export class OrderMapper {
  static toDomain(prismaOrder: PrismaOrder): Order {
    return new Order(
      prismaOrder.id,
      prismaOrder.paymentId,
      prismaOrder.userId,
      prismaOrder.shopId,
      prismaOrder.status,
      prismaOrder.shippingAddressId,
      prismaOrder.subtotal,
      prismaOrder.shippingFee,
      prismaOrder.szoneVoucherDiscount,
      prismaOrder.shopVoucherDiscount,
      prismaOrder.finalPrice,
      prismaOrder.createdAt,
      prismaOrder.updatedAt,
    )
  }

  static toPersistence(order: Order): PrismaOrder {
    return {
      id: order.id,
      paymentId: order.paymentId,
      userId: order.userId,
      shopId: order.shopId,
      status: order.status,
      shippingAddressId: order.shippingAddressId,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      szoneVoucherDiscount: order.szoneVoucherDiscount,
      shopVoucherDiscount: order.shopVoucherDiscount,
      finalPrice: order.finalPrice,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }
  }
}