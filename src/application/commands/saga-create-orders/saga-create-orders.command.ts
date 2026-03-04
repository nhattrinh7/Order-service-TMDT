export class SagaCreateOrdersCommand {
  constructor(
    public readonly sagaId: string,
    public readonly userId: string,
    public readonly paymentMethod: string,
    public readonly orders: Array<{
      shopId: string
      subtotal: number
      shippingFee: number
      shopVoucherDiscount: number
      szoneVoucherDiscount: number
      finalPrice: number
      paymentMethod: string
      paymentId?: string
      shippingAddress: string
      receiverName: string
      receiverPhoneNumber: string
      items: Array<{
        productId: string
        productVariantId: string
        quantity: number
        price: number
        productName: string
        sku: string
        image: string
      }>
    }>,
  ) {}
}
