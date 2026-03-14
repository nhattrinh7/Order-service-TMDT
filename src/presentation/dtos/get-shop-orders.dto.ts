import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { OrderStatus } from '~/domain/enums/order.enum'

export const GetShopOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  status: z.enum(OrderStatus),
  search: z.string().optional(),
})

export class GetShopOrdersQueryDto extends createZodDto(GetShopOrdersQuerySchema) {}
