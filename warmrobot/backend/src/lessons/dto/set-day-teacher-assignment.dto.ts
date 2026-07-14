import { IsUUID } from 'class-validator';

export class SetDayTeacherAssignmentDto {
  @IsUUID()
  baseTeacherId!: string;
}
