export class RequestReturnOrderItemCommand {
  constructor(
    public readonly orderItemId: string,
    public readonly userId: string,
    public readonly returnReason: string,
  ) {}
}
