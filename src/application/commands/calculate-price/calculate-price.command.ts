export class CalculatePriceCommand {
  constructor(
    public readonly itemsByShop: Record<string, Array<{ // key là shopId
      productId: string
      productVariantId: string
      quantity: number
    }>>,
    public readonly userId: string,
    public readonly szoneVoucherId?: string, // đảm bảo chỉ nhận lên 1 szone voucher 
    public readonly shopVouchers?: Record<string, string>, // đảm bảo chỉ nhận lên 1 shop voucher mỗi shop
  ) {}
}
