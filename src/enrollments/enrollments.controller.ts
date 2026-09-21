import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { FilterEnrollmentsDto } from './dto/filter-enrollments.dto.js';
import { PositiveIdPipe } from '../students/pipes/positive-id.pipe.js';
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}
  @Post('enrollments')
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollments.create(dto);
  }
  @Get('enrollments')
  findAll(@Query() filters: FilterEnrollmentsDto) {
    return this.enrollments.findAll(filters);
  }
  @Get('students/:studentId/enrollments')
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.enrollments.findByStudent(studentId);
  }
  @Get('courses/:courseId/enrollments')
  findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.enrollments.findByCourse(courseId);
  }
  @Delete('enrollments/:id')
  remove(@Param(PositiveIdPipe) id: number) {
    return this.enrollments.remove(id);
  }
}
