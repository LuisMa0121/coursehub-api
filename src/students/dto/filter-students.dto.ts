import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class FilterStudentsDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'career debe ser un texto' })
  @IsNotEmpty({ message: 'career no puede estar vacío' })
  career?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  )
  @IsInt({ message: 'semester debe ser un número entero' })
  @Min(1, { message: 'semester debe estar entre 1 y 10' })
  @Max(10, { message: 'semester debe estar entre 1 y 10' })
  semester?: number;

  @ValidateIf((_object, value) => value !== undefined)
  // Boolean('false') sería true. Se convierten únicamente estos dos textos.
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'isActive debe ser true o false' })
  isActive?: boolean;
}
