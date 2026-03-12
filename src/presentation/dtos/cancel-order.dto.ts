import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const CancelOrderSchema = z.object({
  cancelReason: z.string().max(500).optional(),
})

export class CancelOrderDto extends createZodDto(CancelOrderSchema) {}
