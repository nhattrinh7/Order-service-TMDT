import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const SettlementStatusEnum = z.enum(['PENDING', 'COMPLETED'])

export const GetShopSettlementsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(5),
    status: SettlementStatusEnum,
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine(data => data.startDate <= data.endDate, {
    message: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc',
    path: ['endDate'],
  })

export class GetShopSettlementsQueryDto extends createZodDto(GetShopSettlementsQuerySchema) {}
