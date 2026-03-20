import { v4 as uuidv4 } from 'uuid'
import { OrderItemReturnStatus } from '~/domain/enums/order.enum'

interface OrderItemProps {
  id: string
  productId: string
  productVariantId: string
  productName: string
  variantImage: string
  sku: string
  quantity: number
  finalPrice: number
  returnReason: string | null
  returnStatus: OrderItemReturnStatus
  returnRequestedAt: Date | null
  returnResolvedAt: Date | null
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
    returnReason?: string | null
    returnStatus?: OrderItemReturnStatus
    returnRequestedAt?: Date | null
    returnResolvedAt?: Date | null
  }): OrderItem {
    return new OrderItem({
      id: uuidv4(),
      returnReason: data.returnReason ?? null,
      returnStatus: data.returnStatus ?? OrderItemReturnStatus.NONE,
      returnRequestedAt: data.returnRequestedAt ?? null,
      returnResolvedAt: data.returnResolvedAt ?? null,
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
  get returnReason(): string | null { return this.props.returnReason }
  get returnStatus(): OrderItemReturnStatus { return this.props.returnStatus }
  get returnRequestedAt(): Date | null { return this.props.returnRequestedAt }
  get returnResolvedAt(): Date | null { return this.props.returnResolvedAt }

  toPlainObject(): OrderItemProps {
    return { ...this.props }
  }
}
