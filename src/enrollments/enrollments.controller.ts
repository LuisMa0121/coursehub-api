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
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { EnrollmentsQueryDto } from './dto/enrollments-query.dto.js';
import { EnrollmentsService } from './enrollments.service.js';
import { PositiveIdPipe } from '../students/pipes/positive-id.pipe.js';

@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post('enrollments')
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollments.create(dto);
  }

  @Get('enrollments')
  findAll(@Query() query: EnrollmentsQueryDto) {
    return this.enrollments.findAll(query);
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
