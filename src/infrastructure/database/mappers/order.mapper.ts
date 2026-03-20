
import { Order as PrismaOrder, OrderStatus as PrismaOrderStatus, OrderPaymentMethod as PrismaOrderPaymentMethod } from '@prisma/client'
import { Order } from '~/domain/entities/order.entity'
import { OrderItem } from '~/domain/entities/order-item.entity'
import { OrderStatus, OrderPaymentMethod } from '~/domain/enums/order.enum'

export class OrderMapper {
  static toDomain(prismaOrder: PrismaOrder): Order {
    return new Order(
      prismaOrder.id,
      prismaOrder.paymentId,
      prismaOrder.userId,
      prismaOrder.shopId,
      prismaOrder.status as OrderStatus,
      prismaOrder.paymentMethod as OrderPaymentMethod,
      prismaOrder.shippingAddress,
      prismaOrder.receiverName,
      prismaOrder.receiverPhoneNumber,
      prismaOrder.subtotal,
      prismaOrder.shippingFee,
      prismaOrder.szoneVoucherDiscount,
      prismaOrder.shopVoucherDiscount,
      prismaOrder.goodsPrice,
      prismaOrder.finalPrice,
      prismaOrder.cancelReason,
      prismaOrder.qrCode,
      prismaOrder.createdAt,
      prismaOrder.updatedAt,
    )
  }

  static toDomainWithItems(prismaOrder: PrismaOrder & { orderItems: any[] }): Order {
    const orderItems = prismaOrder.orderItems.map((item: any) => {
      const orderItem = OrderItem.create({
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
      });
      (orderItem as any).props.id = item.id;
      return orderItem;
    })

    const order = this.toDomain(prismaOrder)
    order.orderItems = orderItems
    return order
  }

  static toPersistence(order: Order): PrismaOrder {
    return {
      id: order.id,
      paymentId: order.paymentId,
      userId: order.userId,
      shopId: order.shopId,
      status: order.status as PrismaOrderStatus,
      paymentMethod: order.paymentMethod as PrismaOrderPaymentMethod,
      shippingAddress: order.shippingAddress,
      receiverName: order.receiverName,
      receiverPhoneNumber: order.receiverPhoneNumber,
      subtotal: order.subtotal, 
      shippingFee: order.shippingFee,
      szoneVoucherDiscount: order.szoneVoucherDiscount,
      shopVoucherDiscount: order.shopVoucherDiscount,
      goodsPrice: order.goodsPrice,
      finalPrice: order.finalPrice,
      cancelReason: order.cancelReason,
      qrCode: order.qrCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }
  }
}
