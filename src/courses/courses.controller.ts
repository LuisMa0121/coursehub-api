import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { User } from '../users/entities/user.entity.js';
import { UpdateCourseUseCase } from './application/update-course.use-case.js';
import { CoursesService } from './courses.service.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly updateCourse: UpdateCourseUseCase,
  ) {}

  @Get()
  findAll(@Query() query: CoursesQueryDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  /**
   * Capa HTTP: valida y traduce la solicitud a un comando.
   * La regla de negocio y la propiedad viven en UpdateCourseUseCase.
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: { user?: User },
  ) {
    return this.updateCourse.execute({
      courseId: id,
      changes: updateCourseDto,
      actor: req?.user ? { id: req.user.id, role: req.user.role } : null,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
