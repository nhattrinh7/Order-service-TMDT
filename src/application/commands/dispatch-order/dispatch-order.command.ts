export class DispatchOrderCommand {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {}
}
