import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetScannerWarehouseQuery } from './get-scanner-warehouse.query'
import { NotFoundException, Inject } from '@nestjs/common'
import {
  WAREHOUSE_REPOSITORY,
  type IWarehouseRepository,
} from '~/domain/repositories/warehouse.repository.interface'

@QueryHandler(GetScannerWarehouseQuery)
export class GetScannerWarehouseHandler implements IQueryHandler<GetScannerWarehouseQuery> {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async execute(query: GetScannerWarehouseQuery) {
    const warehouse = await this.warehouseRepository.findByScannerId(query.scannerId)

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found')
    }

    return warehouse
  }
}
