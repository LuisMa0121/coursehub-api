import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { FilterStudentsDto } from './dto/filter-students.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto.js';
type Student = {
  id: number;
  name: string;
  email: string;
  age: number;
  career: string;
  semester: number;
  isActive: boolean;
}


@Injectable()
export class StudentsService {
  private readonly students: Student[] = [];
  private nextId = 1;

  create(dto: CreateStudentDto): Student {
    this.ensureUniqueEmail(dto.email);
    const student: Student = { ...dto, id: this.nextId++ };
    this.students.push(student);
    return student;
  }

  findAll(filters: FilterStudentsDto): Student[] {
    return this.students.filter(
      (student) =>
        (filters.career === undefined ||
          student.career.toLowerCase() === filters.career.toLowerCase()) &&
        (filters.semester === undefined ||
          student.semester === filters.semester) &&
        (filters.isActive === undefined ||
          student.isActive === filters.isActive),
    );
  }

  findOne(id: number): Student {
    const student = this.students.find((item) => item.id === id);
    if (!student)
      throw new NotFoundException(`No existe el estudiante con id ${id}`);
    return student;
  }

  update(id: number, dto: UpdateStudentDto): Student {
    const student = this.findOne(id);
    if (dto.email !== undefined) this.ensureUniqueEmail(dto.email, id);
    Object.assign(student, dto);
    return student;
  }

  updateStatus(id: number, dto: UpdateStudentStatusDto): Student {
    const student = this.findOne(id);
    student.isActive = dto.isActive;
    return student;
  }

  remove(id: number): Student {
    const student = this.findOne(id);
    if (!student.isActive) {
      throw new ConflictException(
        'No se puede eliminar un estudiante inactivo; actívalo primero',
      );
    }
    this.students.splice(this.students.indexOf(student), 1);
    return student;
  }

  private ensureUniqueEmail(email: string, excludingId?: number): void {
    if (
      this.students.some(
        (student) => student.email === email && student.id !== excludingId,
      )
    ) {
      throw new ConflictException(
        'Ya existe un estudiante con ese correo electrónico',
      );
    }
  }
}
