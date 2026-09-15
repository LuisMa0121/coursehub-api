import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto.js';

// Ausente significa "conservar"; null debe seguir siendo inválido.
export class UpdateStudentDto extends PartialType(CreateStudentDto, {
  skipNullProperties: false,
}) {}
