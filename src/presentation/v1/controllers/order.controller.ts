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
import { ArrivedWarehouseCommand } from '~/application/commands/arrived-warehouse/arrived-warehouse.command'
import { CancelOrderDto } from '~/presentation/dtos/cancel-order.dto'
import { GetUserOrdersQuery } from '~/application/queries/get-user-orders/get-user-orders.query'
import { GetUserOrdersQueryDto } from '~/presentation/dtos/order.dto'
import { GetShopOrdersQuery } from '~/application/queries/get-shop-orders/get-shop-orders.query'
import { GetShopOrdersQueryDto } from '~/presentation/dtos/get-shop-orders.dto'
import { GetAdminOrdersQuery } from '~/application/queries/get-admin-orders/get-admin-orders.query'
import { GetAdminOrdersQueryDto } from '~/presentation/dtos/get-admin-orders.dto'
import { GetOrderToShipperDto } from '~/presentation/dtos/order.dto'
import { ArrivedWarehouseDto } from '~/presentation/dtos/warehouse.dto'
import { GetOrderToShipperQuery } from '~/application/queries/get-order-to-shipper/get-order-to-shipper.query'
import { GetOrderDeliveryHistoryQuery } from '~/application/queries/get-order-delivery-history/get-order-delivery-history.query'
import { DeliverySuccessCommand } from '~/application/commands/delivery-success/delivery-success.command'
import { DeliveryFailCommand } from '~/application/commands/delivery-fail/delivery-fail.command'
import { RequestReturnOrderItemCommand } from '~/application/commands/request-return-order-item/request-return-order-item.command'
import { RequestReturnOrderItemDto } from '~/presentation/dtos/order-item-return.dto'

@Controller('v1/orders')
export class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAdminOrders(
    @Query() query: GetAdminOrdersQueryDto,
  ) {
    return this.queryBus.execute(
      new GetAdminOrdersQuery(
        query.page,
        query.limit,
        query.status,
        query.returnStatus,
        query.search,
      ),
    )
  }
  
  @Get('users/:userId')
  async getUserOrders(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: GetUserOrdersQueryDto,
  ) {
    return this.queryBus.execute(
      new GetUserOrdersQuery(userId, query.status, query.returnStatus, query.cursor, query.limit),
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
        query.returnStatus,
        query.search,
      ),
    )
  }

  @Post(':id/arrived-warehouse')
  async arrivedWarehouse(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() body: ArrivedWarehouseDto,
  ) {
    await this.commandBus.execute(
      new ArrivedWarehouseCommand(orderId, body.name, body.address),
    )

    return { message: 'Đã cập nhật trạng thái đơn hàng đến kho' }
  }

  @Get(':id/shipper')
  async getOrderToShipper(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Headers('x-user-id') shipperId: string,
    @Body() body: GetOrderToShipperDto,
  ) {
    const result = await this.queryBus.execute(
      new GetOrderToShipperQuery(orderId, shipperId, body.name, body.phoneNumber),
    )

    return { message: 'Đã cập nhật thông tin shipper', data: result }
  }

  @Get(':id/delivery-history')
  async getOrderDeliveryHistory(
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    const result = await this.queryBus.execute(
      new GetOrderDeliveryHistoryQuery(orderId),
    )

    return { message: 'Lấy lịch sử giao hàng thành công', data: result.data }
  }

  @Post(':id/delivery-success')
  async deliverySuccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('shopId') shopId: string,
  ) {
    await this.commandBus.execute(new DeliverySuccessCommand(id, shopId))
    return { message: 'Đơn hàng đã được đánh dấu giao thành công' }
  }

  @Post(':id/delivery-fail')
  async deliveryFail(
    @Param('id', ParseUUIDPipe) id: string
  ) {
    await this.commandBus.execute(new DeliveryFailCommand(id))
    return { message: 'Đơn hàng đã được đánh dấu giao thất bại' }
  }

  @Patch('items/:itemId/return-request')
  async requestReturnOrderItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: RequestReturnOrderItemDto,
  ) {
    return this.commandBus.execute(
      new RequestReturnOrderItemCommand(itemId, userId, body.returnReason),
    )
  }
}
