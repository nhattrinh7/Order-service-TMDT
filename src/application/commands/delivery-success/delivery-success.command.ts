export class DeliverySuccessCommand {
  constructor(
    public readonly orderId: string,
    public readonly shopId: string,
  ) {}
}
