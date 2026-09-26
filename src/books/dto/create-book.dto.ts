import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'title debe ser un texto' })
  @IsNotEmpty({ message: 'title no puede estar vacío' })
  title: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'author debe ser un texto' })
  @IsNotEmpty({ message: 'author no puede estar vacío' })
  author: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'isbn debe ser un texto' })
  @Matches(/^\d{10}(\d{3})?$/, {
    message: 'isbn debe tener 10 o 13 dígitos numéricos',
  })
  isbn: string;

  @IsInt({ message: 'year debe ser un número entero' })
  @Min(1000, { message: 'year debe ser un año válido (mínimo 1000)' })
  @Max(new Date().getFullYear(), {
    message: `year no puede ser mayor al año actual`,
  })
  year: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'genre debe ser un texto' })
  @IsNotEmpty({ message: 'genre no puede estar vacío' })
  genre: string;

  @IsInt({ message: 'availableCopies debe ser un número entero' })
  @Min(0, { message: 'availableCopies no puede ser negativo' })
  availableCopies: number;
}
