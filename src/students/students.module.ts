import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';
import { PositiveIdPipe } from './pipes/positive-id.pipe.js';

@Module({
  controllers: [StudentsController],
  exports: [StudentsService],
  providers: [StudentsService, PositiveIdPipe],
})
export class StudentsModule {}
