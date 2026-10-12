import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreateLoanDto } from './dto/create-loan.dto.js';
import { LoansService } from './loans.service.js';

@Controller()
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @UseGuards(JwtAuthGuard)
  @Post('loans')
  create(
    @Body() dto: CreateLoanDto,
    @Request() req: { user?: { id: number } },
  ) {
    return this.loansService.create(dto, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('loans')
  findAll() {
    return this.loansService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('loans/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('loans/:id/return')
  returnLoan(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.returnLoan(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('loans/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.remove(id);
  }

  @Get('books/:id/loans')
  findByBook(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findByBook(id);
  }
}
