import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createWarehouseSchema = z.object({
  scannerId: z.uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
})
export class CreateWarehouseDto extends createZodDto(createWarehouseSchema) {}

export const arrivedWarehouseSchema = z.object({
  name: z.string().min(1), // tên của warehouse
  address: z.string().min(1), // địa chỉ của warehouse
})
export class ArrivedWarehouseDto extends createZodDto(arrivedWarehouseSchema) {}