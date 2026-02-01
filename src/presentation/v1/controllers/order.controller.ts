import {
  Body,
  Controller,
  Get,
  Param,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { GetOrderToShipperQuery } from '~/application/queries/get-order-to-shipper/get-order-to-shipper.query';

@Controller('v1/orders')
export class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':id/shipper')
  async getOrderToShipper(
    @Param('id') orderId: string,
    @Body() body: { name: string; phoneNumber: string },
  ) {
    const result = await this.queryBus.execute(new GetOrderToShipperQuery(orderId, body))

    return { message: 'Get order to shipper successful', data: result }
  }

}
