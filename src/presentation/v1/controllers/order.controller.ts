import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  Headers,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CalculatePriceRequestDto } from '~/presentation/dtos/calculate-price.dto'
import { CalculatePriceCommand } from '~/application/commands/calculate-price/calculate-price.command'
import { CancelOrderCommand } from '~/application/commands/cancel-order/cancel-order.command'
import { GetUserOrdersQuery } from '~/application/queries/get-user-orders/get-user-orders.query'
import { GetUserOrdersQueryDto } from '~/presentation/dtos/get-user-orders.dto'

@Controller('v1/orders')
export class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  
  @Get('users/:userId')
  async getUserOrders(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: GetUserOrdersQueryDto,
  ) {
    return this.queryBus.execute(
      new GetUserOrdersQuery(userId, query.status, query.cursor, query.limit),
    )
  }

  @Post('calculate-price')
  async calculatePrice(
    @Body() body: CalculatePriceRequestDto,
    @Headers('x-user-id') userId: string,
  ) {
    const result = await this.commandBus.execute(
      new CalculatePriceCommand(
        body.itemsByShop,
        userId,
        body.szoneVoucherId,
        body.shopVouchers
      )
    )

    return result
  }

  @Patch(':orderId/cancel')
  async cancelOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.commandBus.execute(
      new CancelOrderCommand(orderId, userId),
    )
  }

}
