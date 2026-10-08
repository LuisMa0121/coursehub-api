import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { PositiveIdPipe } from './pipes/positive-id.pipe.js';
import { Student } from './entities/student.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  controllers: [StudentsController],
  exports: [StudentsService],
  providers: [StudentsService, PositiveIdPipe],
})
export class StudentsModule {}
