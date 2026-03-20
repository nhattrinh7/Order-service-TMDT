import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { GetShopSettlementsQuery } from '~/application/queries/get-shop-settlements/get-shop-settlements.query'
import { GetShopSettlementsQueryDto } from '~/presentation/dtos/get-shop-settlements.dto'

@Controller('v1/settlements')
export class SettlementController {
  constructor(
    private readonly queryBus: QueryBus,
  ) {}

  @Get('shop/:shopId')
  async getShopSettlements(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Query() query: GetShopSettlementsQueryDto,
  ) {
    return this.queryBus.execute(
      new GetShopSettlementsQuery(
        shopId,
        query.page,
        query.limit,
        query.status,
        query.startDate,
        query.endDate,
      ),
    )
  }
}
