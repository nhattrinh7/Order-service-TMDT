import { Order } from '~/domain/entities/order.entity'
import { OrderDto } from '~/presentation/dtos/order.dto'

export class OrderMapper {
  static toOrderResponse (order: Order): OrderDto {
    return {
      id: order.id,
      paymentId: order.paymentId,
      userId: order.userId,
      shopId: order.shopId,
      status: order.status,
      paymentMethod: order.paymentMethod,
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
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    } 
  }
}
