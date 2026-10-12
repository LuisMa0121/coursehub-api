import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateLoanDto {
  @IsInt({ message: 'El id del libro debe ser un número entero' })
  @Min(1, { message: 'El id del libro debe ser mayor a 0' })
  bookId: number;

  @IsOptional()
  @IsInt({ message: 'El id del usuario debe ser un número entero' })
  @Min(1, { message: 'El id del usuario debe ser mayor a 0' })
  userId?: number;
}
