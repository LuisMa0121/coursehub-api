import { IsBoolean } from 'class-validator';

export class UpdateStudentStatusDto {
  @IsBoolean({ message: 'isActive debe ser true o false, sin comillas' })
  isActive: boolean;
}
