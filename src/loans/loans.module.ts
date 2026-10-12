import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Book } from '../books/book.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Loan } from './entities/loan.entity.js';
import { LoansController } from './loans.controller.js';
import { LoansService } from './loans.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan, Book, User]),
    AuthModule,
    PassportModule,
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
