import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateStudentDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'name debe ser un texto' })
  @IsNotEmpty({ message: 'name no puede estar vacío' })
  name: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email debe ser un correo válido' })
  email: string;

  @IsInt({ message: 'age debe ser un número entero' })
  @Min(0, { message: 'age no puede ser negativo' })
  age: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'career debe ser un texto' })
  @IsNotEmpty({ message: 'career no puede estar vacío' })
  career: string;

  @IsInt({ message: 'semester debe ser un número entero' })
  @Min(1, { message: 'semester debe estar entre 1 y 10' })
  @Max(10, { message: 'semester debe estar entre 1 y 10' })
  semester: number;

  @IsBoolean({ message: 'isActive debe ser true o false, sin comillas' })
  isActive: boolean;
}
