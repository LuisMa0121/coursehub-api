import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CoursesQueryDto {
  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(50, { message: 'limit no puede ser mayor a 50' })
  limit = 10;

  @IsOptional()
  @IsIn(['id', 'title', 'level'], {
    message: 'sortBy debe ser uno de: id, title, level',
  })
  sortBy: 'id' | 'title' | 'level' = 'id';

  @IsOptional()
  @Transform(({ value }) => String(value).toUpperCase())
  @IsIn(['ASC', 'DESC'], {
    message: 'order debe ser ASC o DESC',
  })
  order: 'ASC' | 'DESC' = 'ASC';
}
