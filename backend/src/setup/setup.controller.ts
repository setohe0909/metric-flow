import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { BootstrapDto } from './dto/bootstrap.dto';
import { SetupService } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  status() {
    return this.setupService.status();
  }

  @Post('bootstrap')
  @HttpCode(HttpStatus.CREATED)
  bootstrap(@Body() dto: BootstrapDto) {
    return this.setupService.bootstrap(dto);
  }
}
