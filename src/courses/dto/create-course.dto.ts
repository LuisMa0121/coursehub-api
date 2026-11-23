import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['beginner', 'intermediate', 'advanced'])
  level: string;

  @IsOptional()
  @IsInt()
  teacherId?: number;
}
