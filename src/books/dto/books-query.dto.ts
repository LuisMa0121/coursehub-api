import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BooksQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(50, { message: 'limit no puede ser mayor a 50' })
  limit?: number;

  @IsOptional()
  @IsIn(['id', 'title', 'author', 'year', 'availableCopies'], {
    message: 'sortBy debe ser uno de: id, title, author, year, availableCopies',
  })
  sortBy: 'id' | 'title' | 'author' | 'year' | 'availableCopies' = 'id';

  @IsOptional()
  @Transform(({ value }) => (value ? String(value).toUpperCase() : 'ASC'))
  @IsIn(['ASC', 'DESC'], {
    message: 'order debe ser ASC o DESC',
  })
  order: 'ASC' | 'DESC' = 'ASC';
}
