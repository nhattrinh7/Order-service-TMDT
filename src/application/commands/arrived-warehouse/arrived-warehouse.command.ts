import { ICommand } from '@nestjs/cqrs'

export class ArrivedWarehouseCommand implements ICommand {
  constructor(
    public readonly orderId: string,
    public readonly name: string,
    public readonly address: string,
  ) {}
}
