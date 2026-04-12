import { CreateWarehouseDto } from '~/presentation/dtos/warehouse.dto'

export class CreateWarehouseCommand {
  constructor(public readonly dto: CreateWarehouseDto) {}
}
