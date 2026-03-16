import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CreateWarehouseCommand } from './create-warehouse.command'
import { ConflictException, Inject } from '@nestjs/common'
import { WAREHOUSE_REPOSITORY, type IWarehouseRepository } from '~/domain/repositories/warehouse.repository.interface'



@CommandHandler(CreateWarehouseCommand)
export class CreateWarehouseHandler implements ICommandHandler<CreateWarehouseCommand> {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)

    private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async execute(command: CreateWarehouseCommand) {
    const { scannerId, name, address } = command.dto

    // Check if warehouse already exists by scannerId or name
    const existingWarehouse = await this.warehouseRepository.findByScannerIdOrName(scannerId, name)

    if (existingWarehouse) {
      throw new ConflictException('Warehouse with this scannerId or name already exists')
    }

    const newWarehouse = await this.warehouseRepository.create({
      scannerId,
      name,
      address,
    })


    return newWarehouse
  }
}
