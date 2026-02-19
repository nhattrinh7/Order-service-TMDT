export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  PREPARING: 'PREPARING',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
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
