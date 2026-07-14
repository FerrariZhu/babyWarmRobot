import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateLessonDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayIndex!: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  block?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  ageGroup?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  isDraft?: boolean;
}
