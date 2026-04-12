export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  PREPARING: 'PREPARING',
  SHIPPING: 'SHIPPING',
  DELIVERY_COMPLETED: 'DELIVERY_COMPLETED',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  ORDER_FAILED: 'ORDER_FAILED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const OrderPaymentMethod = {
  COD: 'COD',
  WALLET: 'WALLET',
  QRCODE: 'QRCODE',
} as const
export type OrderPaymentMethod = (typeof OrderPaymentMethod)[keyof typeof OrderPaymentMethod]

export const OrderItemReturnStatus = {
  NONE: 'NONE',
  REFUNDED: 'REFUNDED',
} as const
export type OrderItemReturnStatus =
  (typeof OrderItemReturnStatus)[keyof typeof OrderItemReturnStatus]
