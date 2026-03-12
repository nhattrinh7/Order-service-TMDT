import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { OrderStatus } from '~/domain/enums/order.enum'

export const GetUserOrdersQuerySchema = z.object({
  status: z.enum(OrderStatus),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(50)),
})
export class GetUserOrdersQueryDto extends createZodDto(GetUserOrdersQuerySchema) {}
