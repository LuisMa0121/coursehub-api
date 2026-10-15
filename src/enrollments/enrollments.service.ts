import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoursesService } from '../courses/courses.service.js';
import { StudentsService } from '../students/students.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { EnrollmentsQueryDto } from './dto/enrollments-query.dto.js';
import { Enrollment } from './entities/enrollment.entity.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    private readonly students: StudentsService,
    private readonly courses: CoursesService,
  ) {}

  async create(dto: CreateEnrollmentDto): Promise<Enrollment> {
    // 1. El estudiante existe
    const student = await this.students.findOne(dto.studentId);
    // 2. El curso existe
    const course = await this.courses.findOne(String(dto.courseId));
    // 3. El estudiante está activo
    if (!student.isActive)
      throw new BadRequestException(
        'No se puede matricular a un estudiante inactivo',
      );
    // 4. No existe ya una matrícula para la misma pareja
    const existing = await this.enrollmentsRepository.findOne({
      where: { student: { id: dto.studentId }, course: { id: dto.courseId } },
    });
    if (existing)
      throw new ConflictException(
        'El estudiante ya está matriculado en ese curso',
      );

    const enrollment = this.enrollmentsRepository.create({ student, course });
    return this.enrollmentsRepository.save(enrollment);
  }

  async findAll(query: EnrollmentsQueryDto = new EnrollmentsQueryDto()) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.course', 'course');

    if (query.search) {
      qb.andWhere(
        '(LOWER(student.name) LIKE LOWER(:search) OR LOWER(course.title) LIKE LOWER(:search))',
        { search: `%${query.search.trim()}%` },
      );
    }

    if (query.studentId !== undefined) {
      qb.andWhere('student.id = :studentId', { studentId: query.studentId });
    }

    if (query.courseId !== undefined) {
      qb.andWhere('course.id = :courseId', { courseId: query.courseId });
    }

    if (query.activeOnly === 'true') {
      qb.andWhere('student.isActive = :active', { active: true });
    }

    qb.orderBy('enrollment.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

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

  async findByStudent(studentId: number): Promise<Enrollment[]> {
    await this.students.findOne(studentId);
    return this.enrollmentsRepository.find({
      where: { student: { id: studentId } },
      relations: { student: true, course: true },
    });
  }

  async findByCourse(courseId: number): Promise<Enrollment[]> {
    await this.courses.findOne(String(courseId));
    return this.enrollmentsRepository.find({
      where: { course: { id: courseId } },
      relations: { student: true, course: true },
    });
  }

  async remove(id: number): Promise<Enrollment> {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id },
      relations: { student: true, course: true },
    });
    if (!enrollment)
      throw new NotFoundException('No existe la matrícula con id ' + id);
    await this.enrollmentsRepository.remove(enrollment);
    return { ...enrollment, id };
  }
}
