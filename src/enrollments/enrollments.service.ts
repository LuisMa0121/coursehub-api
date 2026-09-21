import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StudentsService } from '../students/students.service.js';
import { CoursesService } from '../courses/courses.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { FilterEnrollmentsDto } from './dto/filter-enrollments.dto.js';
type Enrollment = { id: number; studentId: number; courseId: number };
@Injectable()
export class EnrollmentsService {
  private readonly enrollments: Enrollment[] = [];
  private nextId = 1;
  constructor(
    private readonly students: StudentsService,
    private readonly courses: CoursesService,
  ) {}
  create(dto: CreateEnrollmentDto): Enrollment {
    const student = this.students.findOne(dto.studentId);
    this.courses.findOne(String(dto.courseId));
    if (!student.isActive)
      throw new ConflictException(
        'No se puede matricular a un estudiante inactivo',
      );
    if (
      this.enrollments.some(
        (item) =>
          item.studentId === dto.studentId && item.courseId === dto.courseId,
      )
    ) {
      throw new ConflictException(
        'El estudiante ya está matriculado en ese curso',
      );
    }
    const enrollment: Enrollment = {
      id: this.nextId++,
      studentId: dto.studentId,
      courseId: dto.courseId,
    };
    this.enrollments.push(enrollment);
    return enrollment;
  }
  findAll(filters: FilterEnrollmentsDto = {}): Enrollment[] {
    return this.enrollments.filter(
      (item) =>
        (filters.studentId === undefined ||
          item.studentId === filters.studentId) &&
        (filters.courseId === undefined || item.courseId === filters.courseId),
    );
  }
  findByStudent(studentId: number): Enrollment[] {
    this.students.findOne(studentId);
    return this.findAll({ studentId });
  }
  findByCourse(courseId: number): Enrollment[] {
    this.courses.findOne(String(courseId));
    return this.findAll({ courseId });
  }
  remove(id: number): Enrollment {
    const index = this.enrollments.findIndex((item) => item.id === id);
    if (index === -1)
      throw new NotFoundException('No existe la matrícula con id ' + id);
    return this.enrollments.splice(index, 1)[0];
  }
}
