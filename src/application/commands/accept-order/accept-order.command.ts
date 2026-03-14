export class AcceptOrderCommand {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {}
}
