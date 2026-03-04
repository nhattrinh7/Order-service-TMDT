import { v4 as uuidv4 } from 'uuid'

interface OrderItemProps {
  id: string
  productId: string
  productVariantId: string
  productName: string
  variantImage: string
  sku: string
  quantity: number
  finalPrice: number
}

export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {}

  static create(data: {
    productId: string
    productVariantId: string
    productName: string
    variantImage: string
    sku: string
    quantity: number
    finalPrice: number
  }): OrderItem {
    return new OrderItem({
      id: uuidv4(),
      ...data,
    })
  }

  get id(): string { return this.props.id }
  get productId(): string { return this.props.productId }
  get productVariantId(): string { return this.props.productVariantId }
  get productName(): string { return this.props.productName }
  get variantImage(): string { return this.props.variantImage }
  get sku(): string { return this.props.sku }
  get quantity(): number { return this.props.quantity }
  get finalPrice(): number { return this.props.finalPrice }

  toPlainObject(): OrderItemProps {
    return { ...this.props }
  }
}
