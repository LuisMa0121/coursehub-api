import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../users/enums/role.enum.js';
import { User } from '../users/entities/user.entity.js';
import { CoursesQueryDto } from './dto/courses-query.dto.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { Course } from './entities/course.entity.js';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async findAll(query: CoursesQueryDto | string = new CoursesQueryDto()) {
    const q =
      typeof query === 'string'
        ? Object.assign(new CoursesQueryDto(), { level: query })
        : (query ?? new CoursesQueryDto());
    const { level, page = 1, limit = 10, sortBy = 'id', order = 'ASC' } = q;
    const [items, total] = await this.coursesRepository.findAndCount({
      where: level ? { level } : {},
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async findOne(id: string): Promise<Course> {
    const numericId = Number(id);
    const course = isNaN(numericId)
      ? null
      : await this.coursesRepository.findOneBy({ id: numericId });
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  create(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.coursesRepository.create(createCourseDto);
    return this.coursesRepository.save(course);
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    currentUser?: User | null,
  ): Promise<Course> {
    const course = await this.findOne(id);

    // Regla de propiedad: un docente no modifica el curso de otro docente
    if (currentUser && currentUser.role === Role.TEACHER) {
      if (course.teacherId && course.teacherId !== currentUser.id) {
        throw new ForbiddenException(
          `Acceso denegado: un docente no puede modificar el curso perteneciente a otro docente (docente propietario ID ${course.teacherId})`,
        );
      }
    }

    Object.assign(course, updateCourseDto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string): Promise<Course> {
    const course = await this.findOne(id);
    await this.coursesRepository.remove(course);
    return { ...course, id: Number(id) };
  }
}
