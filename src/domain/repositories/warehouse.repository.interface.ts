export const WAREHOUSE_REPOSITORY = 'WAREHOUSE_REPOSITORY'

export interface IWarehouseRepository {
  findByScannerId(scannerId: string): Promise<any>
  findByScannerIdOrName(scannerId: string, name: string): Promise<any>

  create(data: { scannerId: string; name: string; address: string }): Promise<any>
}
