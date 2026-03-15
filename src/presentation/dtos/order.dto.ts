import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { OrderStatus, OrderPaymentMethod } from '~/domain/enums/order.enum'

export const OrderSchema = z.object({
  id: z.uuid(),
  paymentId: z.uuid().nullable(),
  userId: z.uuid(),
  shopId: z.uuid(),
  status: z.enum(OrderStatus),
  paymentMethod: z.enum(OrderPaymentMethod),
  shippingAddress: z.string(),
  receiverName: z.string(),
  receiverPhoneNumber: z.string(),
  subtotal: z.number().min(0),
  shippingFee: z.number().min(0),
  szoneVoucherDiscount: z.number().min(0),
  shopVoucherDiscount: z.number().min(0),
  goodsPrice: z.number().min(0),
  finalPrice: z.number().min(0),
  cancelReason: z.string().nullable(),
  returnReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export class OrderDto extends createZodDto(OrderSchema) {}

export const GetOrderToShipperDtoSchema = z.object({
  name: z.string(),
  phoneNumber: z.string()
})
export class GetOrderToShipperDto extends createZodDto(GetOrderToShipperDtoSchema) {}