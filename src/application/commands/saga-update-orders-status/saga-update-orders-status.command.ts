export class SagaUpdateOrdersStatusCommand {
  constructor(
    public readonly sagaId: string,
    public readonly orderIds: string[],
    public readonly status: string,
  ) {}
}
