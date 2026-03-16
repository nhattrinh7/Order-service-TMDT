import { Body, Controller, Post } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { CreateWarehouseDto } from '~/presentation/dtos/warehouse.dto'
import { CreateWarehouseCommand } from '~/application/commands/create-warehouse/create-warehouse.command'

@Controller('v1/warehouses')
export class WarehouseController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  async createWarehouse(
    @Body() body: CreateWarehouseDto
  ) {
    const result = await this.commandBus.execute(
      new CreateWarehouseCommand(body),
    )
    return { message: 'Create warehouse successfully', data: result }
  }
}
