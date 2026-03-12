import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Headers,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

@Controller('v1/scanners')
export class ScannerController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  
  

}
