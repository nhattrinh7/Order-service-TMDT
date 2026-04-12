export const SettlementPaymentMethod = {
  WALLET: 'WALLET',
} as const
export type SettlementPaymentMethod =
  (typeof SettlementPaymentMethod)[keyof typeof SettlementPaymentMethod]

export const SettlementStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
} as const
export type SettlementStatus = (typeof SettlementStatus)[keyof typeof SettlementStatus]
