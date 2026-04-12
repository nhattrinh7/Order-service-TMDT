import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject, BadRequestException } from '@nestjs/common'
import { CalculatePriceCommand } from './calculate-price.command'
import type { IMessagePublisher } from '~/domain/contracts/message-publisher.interface'
import { MESSAGE_PUBLISHER } from '~/domain/contracts/message-publisher.interface'
import type {
  CalculatePriceResponseDto,
  ShopItemsDto,
  SummaryDto,
} from '~/presentation/dtos/calculate-price.dto'
import { SHIPPING_FEE_PER_SHOP } from '~/common/constants/constant'

// Types cho validate voucher message
interface ValidateVouchersBatchRequest {
  userId: string
  vouchers: Array<{
    voucherId: string
    orderValue: number
    items?: Array<{
      productId: string
      categoryId: string
    }>
  }>
}

interface ValidateVoucherResult {
  valid: boolean
  voucher?: {
    id: string
    code: string
    type: 'SHOP' | 'SZONE'
    discountType: 'PERCENT' | 'FIXED'
    discountValue: number
    maxDiscountValue?: number
    minOrderValue: number
    scope: 'ALL' | 'CATEGORY' | 'PRODUCT'
    applicableProductIds?: string[]
    applicableCategoryIds?: string[]
    shopId?: string
  }
  error?: string
}

interface ValidateVouchersBatchResponse {
  results: Record<string, ValidateVoucherResult>
}

// Giữ lại type cho validate voucher đơn lẻ (dùng cho szone voucher)
interface ValidateVoucherRequest {
  voucherId: string
  userId: string
  orderValue: number
  items?: Array<{
    productId: string
    categoryId: string
  }>
}

@CommandHandler(CalculatePriceCommand)
export class CalculatePriceHandler
  implements ICommandHandler<CalculatePriceCommand, CalculatePriceResponseDto>
{
  constructor(
    @Inject(MESSAGE_PUBLISHER)
    private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(command: CalculatePriceCommand): Promise<CalculatePriceResponseDto> {
    const { itemsByShop, userId, szoneVoucherId, shopVouchers } = command

    // 0. Xóa tất cả bản ghi VoucherUsage RESERVED cũ của user trước khi tạo mới
    await this.messagePublisher.sendToVoucherService('cancel.all.reserved.voucher.usages', {
      userId,
    })

    // 1. Thu thập tất cả variant IDs
    const allVariantIds: string[] = []
    Object.values(itemsByShop).forEach(items => {
      items.forEach(item => allVariantIds.push(item.productVariantId))
    })

    // 2. Lấy thông tin variant từ catalog-service và thông tin shop từ shop-service (song song)
    const shopIds = Object.keys(itemsByShop)

    const [variantsResponse, shopsResponse] = await Promise.all([
      this.messagePublisher.sendToCatalogService<
        { productVariantIds: string[] },
        {
          variants: Array<{
            id: string
            productId: string
            productName: string
            price: number
            sku: string
            image: string | null
            shopId: string
            categoryId: string // có lấy categoryId cấp lá từ catalog-service sang nhé
          }>
        }
      >('get.variants.batch', { productVariantIds: allVariantIds }),

      this.messagePublisher.sendToShopService<
        { shopIds: string[] },
        Array<{ id: string; name: string; logo: string | null }>
      >('get.shop.simple_data', { shopIds }),
    ])

    const variantsMap = new Map(variantsResponse.variants.map(v => [v.id, v]))
    const shopsMap = new Map(shopsResponse.map(s => [s.id, s]))

    // 3. Kiểm tra các variant gửi lên từ FE có tồn tại trong catalog-service không
    // hoặc có tình trạng dữ liệu FE gửi lên nói item A thuộc shop B nhưng check DB thì không phải hay không
    for (const [shopId, items] of Object.entries(itemsByShop)) {
      for (const item of items) {
        const variant = variantsMap.get(item.productVariantId)
        if (!variant) {
          throw new BadRequestException(`Product variant ${item.productVariantId} not found`)
        }
        if (variant.shopId !== shopId) {
          throw new BadRequestException(`ShopId mismatch for variant ${item.productVariantId}`)
        }
      }
    }

    // 4. Phase 1: Tính shopSubtotal và chuẩn bị data cho từng shop TRƯỚC
    const shopDataMap = new Map<
      string,
      {
        shopSubtotal: number
        shopItems: Array<{
          id: string
          productId: string
          productVariantId: string
          name: string
          price: number
          quantity: number
          image: string
          sku: string
        }>
        items: (typeof itemsByShop)[string]
      }
    >()

    for (const [shopId, items] of Object.entries(itemsByShop)) {
      let shopSubtotal = 0

      const shopItems = items.map(item => {
        const variant = variantsMap.get(item.productVariantId)!
        const itemTotal = variant.price * item.quantity
        shopSubtotal += itemTotal

        return {
          id: item.productVariantId,
          productId: variant.productId,
          productVariantId: variant.id,
          name: variant.productName,
          price: variant.price,
          quantity: item.quantity,
          image: variant.image || '',
          sku: variant.sku,
        }
      })

      shopDataMap.set(shopId, { shopSubtotal, shopItems, items })
    }

    // 5. Phase 2: Batch validate tất cả shop vouchers (1 lần gọi duy nhất)
    let shopVoucherResults: Record<string, ValidateVoucherResult> = {}

    if (shopVouchers && Object.keys(shopVouchers).length > 0) {
      const batchRequest: ValidateVouchersBatchRequest = {
        userId,
        vouchers: Object.entries(shopVouchers).map(([shopId, voucherId]) => {
          const shopData = shopDataMap.get(shopId)!
          return {
            voucherId,
            orderValue: shopData.shopSubtotal,
            items: shopData.items.map(item => {
              const variant = variantsMap.get(item.productVariantId)!
              return {
                productId: variant.productId,
                categoryId: variant.categoryId,
              }
            }),
          }
        }),
      }

      const batchResponse = await this.messagePublisher.sendToVoucherService<
        ValidateVouchersBatchRequest,
        ValidateVouchersBatchResponse
      >('validate.vouchers.batch', batchRequest)

      shopVoucherResults = batchResponse.results
    }

    // 6. Phase 3: Build response và tính discount dùng batch results
    const itemsWithShop: ShopItemsDto[] = []
    let totalSubtotal = 0
    let totalShippingFee = 0
    let totalShopVoucherDiscount = 0
    const reservePromises: Promise<any>[] = []

    for (const [shopId] of Object.entries(itemsByShop)) {
      const shopData = shopDataMap.get(shopId)!
      const { shopSubtotal, shopItems, items } = shopData

      let shopVoucherDiscount = 0

      // Áp dụng voucher shop nếu có - lấy kết quả từ batch response
      if (shopVouchers && shopVouchers[shopId]) {
        const voucherId = shopVouchers[shopId]
        const validationResult = shopVoucherResults[voucherId]

        if (validationResult && validationResult.valid && validationResult.voucher) {
          // shop voucher lấy về từ voucher service
          const voucher = validationResult.voucher

          // Tính applicableSubtotal dựa trên scope của voucher
          // applicableSubtotal là tổng giá trị của những items được áp dụng voucher
          let applicableSubtotal = shopSubtotal
          if (voucher.scope === 'PRODUCT' && voucher.applicableProductIds) {
            // Chỉ tính subtotal của những products được áp dụng voucher
            applicableSubtotal = items
              .filter(item => {
                // kiểm tra productId có nằm trong danh sách productId được áp dụng voucher không
                const variant = variantsMap.get(item.productVariantId)!
                return voucher.applicableProductIds!.includes(variant.productId)
              })
              .reduce((sum, item) => {
                // Tính tổng giá trị từ danh sách items đã lọc
                const variant = variantsMap.get(item.productVariantId)!
                return sum + variant.price * item.quantity
              }, 0)
          }
          // Nếu scope = 'ALL', applicableSubtotal = shopSubtotal
          // Note: Shop voucher không có scope CATEGORY

          // Tính discount dựa trên applicableSubtotal
          if (voucher.discountType === 'FIXED') {
            shopVoucherDiscount = Math.min(voucher.discountValue, applicableSubtotal)
          } else {
            // Loại PERCENT
            shopVoucherDiscount = Math.floor((applicableSubtotal * voucher.discountValue) / 100)
            if (voucher.maxDiscountValue) {
              shopVoucherDiscount = Math.min(shopVoucherDiscount, voucher.maxDiscountValue)
            }
          }

          // Tạo bản ghi VoucherUsage với trạng thái RESERVED
          reservePromises.push(
            this.messagePublisher.sendToVoucherService('reserve.voucher.usage', {
              voucherId,
              userId,
            }),
          )
        }
      }

      totalSubtotal += shopSubtotal
      totalShippingFee += SHIPPING_FEE_PER_SHOP
      totalShopVoucherDiscount += shopVoucherDiscount

      const shopInfo = shopsMap.get(shopId)

      itemsWithShop.push({
        id: shopId,
        name: shopInfo?.name || `Shop ${shopId}`,
        logo: shopInfo?.logo || '',
        shopSubtotal: shopSubtotal,
        shopShippingFee: SHIPPING_FEE_PER_SHOP,
        shopVoucherDiscount,
        items: shopItems,
      })
    }

    // 7. Áp dụng voucher szone nếu có
    let szoneVoucherDiscount = 0
    if (szoneVoucherId) {
      const allItems = Object.entries(itemsByShop).flatMap(([, items]) =>
        items.map(item => {
          const variant = variantsMap.get(item.productVariantId)!
          return {
            productId: variant.productId,
            categoryId: variant.categoryId,
            shopId: variant.shopId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          }
        }),
      )

      const validationResult = await this.messagePublisher.sendToVoucherService<
        ValidateVoucherRequest,
        ValidateVoucherResult
      >('validate.voucher', {
        voucherId: szoneVoucherId,
        userId,
        orderValue: totalSubtotal,
        items: allItems.map(item => ({
          productId: item.productId,
          categoryId: item.categoryId,
        })),
      })

      if (validationResult.valid && validationResult.voucher) {
        const voucher = validationResult.voucher

        // Tính applicableSubtotal dựa trên scope của voucher
        let applicableSubtotal = totalSubtotal
        if (voucher.scope === 'CATEGORY' && voucher.applicableCategoryIds) {
          // Chỉ tính subtotal của những products thuộc categories được áp dụng voucher
          applicableSubtotal = allItems
            .filter(item => {
              const variant = variantsMap.get(item.productVariantId)!
              return voucher.applicableCategoryIds!.includes(variant.categoryId)
            })
            .reduce((sum, item) => {
              const variant = variantsMap.get(item.productVariantId)!
              return sum + variant.price * item.quantity
            }, 0)
        }
        // Nếu scope = 'ALL', applicableSubtotal = totalSubtotal
        // Note: Szone voucher không có scope PRODUCT

        // Tính discount dựa trên applicableSubtotal (trước khi trừ shop discount)
        if (voucher.discountType === 'FIXED') {
          szoneVoucherDiscount = Math.min(voucher.discountValue, applicableSubtotal)
        } else {
          // Loại PERCENT
          szoneVoucherDiscount = Math.floor((applicableSubtotal * voucher.discountValue) / 100)
          if (voucher.maxDiscountValue) {
            szoneVoucherDiscount = Math.min(szoneVoucherDiscount, voucher.maxDiscountValue)
          }
        }

        // Tạo bản ghi VoucherUsage với trạng thái RESERVED
        reservePromises.push(
          this.messagePublisher.sendToVoucherService('reserve.voucher.usage', {
            voucherId: szoneVoucherId,
            userId,
          }),
        )
      }
    }

    // 8. Chờ tất cả reserve voucher usage promises hoàn thành
    if (reservePromises.length > 0) {
      await Promise.all(reservePromises)
    }

    // 9. Tính tổng giá cuối cùng
    const finalPrice =
      totalSubtotal + totalShippingFee - totalShopVoucherDiscount - szoneVoucherDiscount
    const goodsPrice = totalSubtotal - totalShopVoucherDiscount - szoneVoucherDiscount

    const summary: SummaryDto = {
      subtotal: totalSubtotal,
      shippingFee: totalShippingFee,
      shopsVoucherDiscount: totalShopVoucherDiscount,
      szoneVoucherDiscount,
      goodsPrice,
      finalPrice,
    }

    return {
      success: true,
      data: {
        itemsWithShop,
        summary,
      },
    }
  }
}
