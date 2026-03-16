import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { GetScannerWarehouseQuery } from '~/application/queries/get-scanner-warehouse/get-scanner-warehouse.query'

@Controller('v1/scanners')
export class ScannerController {
  constructor(
    private readonly queryBus: QueryBus,
  ) {}
  
  @Get(':scannerId/warehouse')
  async getScannerWarehouse(
    @Param('scannerId', ParseUUIDPipe) scannerId: string
  ) {
    const result = await this.queryBus.execute(
      new GetScannerWarehouseQuery(scannerId),
    )
    return { message: 'Get scanner warehouse successfully', data: result }
  }

}
