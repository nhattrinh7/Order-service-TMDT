import { Injectable } from '@nestjs/common'
import { IWarehouseRepository } from '~/domain/repositories/warehouse.repository.interface'
import { PrismaService } from '~/infrastructure/database/prisma/prisma.service'

@Injectable()
export class WarehouseRepository implements IWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByScannerId(scannerId: string) {
    return this.prisma.transitWarehouse.findUnique({
      where: { scannerId },
      select: {
        id: true,
        name: true,
        address: true,
      },
    })
  }

  async findByScannerIdOrName(scannerId: string, name: string) {
    return this.prisma.transitWarehouse.findFirst({
      where: {
        OR: [{ scannerId }, { name }],
      },
      select: {
        id: true,
        scannerId: true,
        name: true,
        address: true,
      },
    })
  }

  async create(data: { scannerId: string; name: string; address: string }) {
    return this.prisma.transitWarehouse.create({
      data,
      select: {
        id: true,
        name: true,
        address: true,
      },
    })
  }
}
