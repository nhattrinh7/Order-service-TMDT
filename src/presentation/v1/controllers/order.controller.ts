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
import { AcceptOrderCommand } from '~/application/commands/accept-order/accept-order.command'
import { DispatchOrderCommand } from '~/application/commands/dispatch-order/dispatch-order.command'
import { CancelOrderDto } from '~/presentation/dtos/cancel-order.dto'
import { GetUserOrdersQuery } from '~/application/queries/get-user-orders/get-user-orders.query'
import { GetUserOrdersQueryDto } from '~/presentation/dtos/get-user-orders.dto'
import { GetShopOrdersQuery } from '~/application/queries/get-shop-orders/get-shop-orders.query'
import { GetShopOrdersQueryDto } from '~/presentation/dtos/get-shop-orders.dto'
import { GetOrderToShipperDto } from '~/presentation/dtos/order.dto'

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
    @Body() body: CancelOrderDto,
  ) {
    return this.commandBus.execute(
      new CancelOrderCommand(orderId, userId, body.cancelReason),
    )
  }

  @Patch(':orderId/accept')
  async acceptOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Headers('x-user-id') userId: string,
  ) {
    await this.commandBus.execute(
      new AcceptOrderCommand(orderId, userId),
    )

    return { message: 'Xác nhận đơn hàng thành công' }
  }

  @Patch(':orderId/dispatch-to-carrier')
  async dispatchOrderToCarrier(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Headers('x-user-id') userId: string,
  ) {
    await this.commandBus.execute(
      new DispatchOrderCommand(orderId, userId),
    )

    return { message: 'Đã cập nhật trạng thái giao đơn vị vận chuyển' }
  }

  @Get('shop/:shopId')
  async getShopOrders(
    @Param('shopId', ParseUUIDPipe) shopId: string,
    @Query() query: GetShopOrdersQueryDto,
  ) {
    return this.queryBus.execute(
      new GetShopOrdersQuery(
        shopId,
        query.page,
        query.limit,
        query.status,
        query.search,
      ),
    )
  }

  // @Get(':id/shipper')
  // async getOrderToShipper(
  //   @Param('id', ParseUUIDPipe) orderId: string,
  //   @Headers('x-user-id') shipperId: string,
  //   @Body() body: GetOrderToShipperDto,
  // ) {
  //   return this.queryBus.execute(
  //     new GetOrderToShipperQuery(orderId, shipperId, body.name, body.phoneNumber),
  //   )
  // }
}
