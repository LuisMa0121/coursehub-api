import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const queryId = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

const queryNumber = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

export class EnrollmentsQueryDto {
  @IsOptional()
  @IsString({ message: 'search debe ser un texto' })
  search?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryId)
  @IsInt({ message: 'studentId debe ser un número entero' })
  @Min(1, { message: 'studentId debe ser mayor a 0' })
  @Max(Number.MAX_SAFE_INTEGER, { message: 'studentId excede el valor máximo seguro' })
  studentId?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryId)
  @IsInt({ message: 'courseId debe ser un número entero' })
  @Min(1, { message: 'courseId debe ser mayor a 0' })
  @Max(Number.MAX_SAFE_INTEGER, { message: 'courseId excede el valor máximo seguro' })
  courseId?: number;

  @IsOptional()
  @IsBooleanString({ message: 'activeOnly debe ser un booleano en texto (true o false)' })
  activeOnly?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryNumber)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page = 1;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryNumber)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(50, { message: 'limit no puede ser mayor a 50' })
  limit = 10;
}
