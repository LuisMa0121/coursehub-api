import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { FilterStudentsDto } from './dto/filter-students.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto.js';
import { Student } from './entities/student.entity.js';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
  ) {}

  async create(dto: CreateStudentDto): Promise<Student> {
    await this.ensureUniqueEmail(dto.email);
    const student = this.studentsRepository.create(dto);
    return this.studentsRepository.save(student);
  }

  findAll(filters: FilterStudentsDto): Promise<Student[]> {
    const where: FindOptionsWhere<Student> = {};
    if (filters.career !== undefined)
      where.career = filters.career.toLowerCase();
    if (filters.semester !== undefined) where.semester = filters.semester;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    return this.studentsRepository.findBy(where);
  }

  async findOne(id: number): Promise<Student> {
    const student = await this.studentsRepository.findOneBy({ id });
    if (!student)
      throw new NotFoundException(`No existe el estudiante con id ${id}`);
    return student;
  }

  async update(id: number, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    if (dto.email !== undefined) await this.ensureUniqueEmail(dto.email, id);
    Object.assign(student, dto);
    return this.studentsRepository.save(student);
  }

  async updateStatus(
    id: number,
    dto: UpdateStudentStatusDto,
  ): Promise<Student> {
    const student = await this.findOne(id);
    student.isActive = dto.isActive;
    return this.studentsRepository.save(student);
  }

  async remove(id: number): Promise<Student> {
    const student = await this.findOne(id);
    if (!student.isActive) {
      throw new BadRequestException(
        'No se puede eliminar un estudiante inactivo; actívalo primero',
      );
    }
    await this.studentsRepository.remove(student);
    return { ...student, id };
  }

  private async ensureUniqueEmail(
    email: string,
    excludingId?: number,
  ): Promise<void> {
    const existing = await this.studentsRepository.findOneBy({ email });
    if (existing && existing.id !== excludingId) {
      throw new ConflictException(
        'Ya existe un estudiante con ese correo electrónico',
      );
    }
  }
}
