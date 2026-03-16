import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createWarehouseSchema = z.object({
  scannerId: z.uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
})

export class CreateWarehouseDto extends createZodDto(createWarehouseSchema) {}
