import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';

@Module({
  controllers: [CoursesController],
  exports: [CoursesService],
  providers: [CoursesService],
})
export class CoursesModule {}
