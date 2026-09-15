import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { FilterStudentsDto } from './dto/filter-students.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto.js';
import { PositiveIdPipe } from './pipes/positive-id.pipe.js';
import { StudentsService } from './students.service.js';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  findAll(@Query() filters: FilterStudentsDto) {
    return this.studentsService.findAll(filters);
  }

  @Get(':id')
  // @Param() entrega { id: '1' }; el Pipe devuelve el número validado.
  findOne(@Param(PositiveIdPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param(PositiveIdPipe) id: number,
    @Body() dto: UpdateStudentStatusDto,
  ) {
    return this.studentsService.updateStatus(id, dto);
  }

  @Patch(':id')
  update(@Param(PositiveIdPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param(PositiveIdPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
