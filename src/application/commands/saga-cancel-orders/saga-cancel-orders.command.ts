export class SagaCancelOrdersCommand {
  constructor(
    public readonly sagaId: string,
    public readonly orderIds: string[],
    public readonly status: string,
  ) {}
}
