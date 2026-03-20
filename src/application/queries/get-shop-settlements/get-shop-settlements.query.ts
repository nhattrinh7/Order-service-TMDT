export type SettlementStatus = 'PENDING' | 'COMPLETED'

export class GetShopSettlementsQuery {
  constructor(
    public readonly shopId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly status: SettlementStatus,
    public readonly startDate: string,
    public readonly endDate: string,
  ) {}
}
