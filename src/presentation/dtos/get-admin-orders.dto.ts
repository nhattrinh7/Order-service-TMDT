import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { OrderStatus, OrderItemReturnStatus } from '~/domain/enums/order.enum'

export const GetAdminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  status: z.enum(OrderStatus),
  returnStatus: z.enum(OrderItemReturnStatus).optional(),
  search: z.string().optional(),
})

export class GetAdminOrdersQueryDto extends createZodDto(GetAdminOrdersQuerySchema) {}
