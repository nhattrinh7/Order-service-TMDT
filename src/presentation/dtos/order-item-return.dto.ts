import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const RequestReturnOrderItemSchema = z.object({
  returnReason: z.string().min(1),
})

export class RequestReturnOrderItemDto extends createZodDto(RequestReturnOrderItemSchema) {}
