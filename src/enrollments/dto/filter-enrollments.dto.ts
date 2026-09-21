import { Transform } from 'class-transformer';
import { IsInt, Min, Max, ValidateIf } from 'class-validator';
const queryId = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
export class FilterEnrollmentsDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryId)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  studentId?: number;
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(queryId)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  courseId?: number;
}
