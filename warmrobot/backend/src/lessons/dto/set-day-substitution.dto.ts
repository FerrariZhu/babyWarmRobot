import { IsOptional, IsUUID } from 'class-validator';

export class SetDaySubstitutionDto {
  @IsOptional()
  @IsUUID()
  substituteTeacherId?: string | null;
}
