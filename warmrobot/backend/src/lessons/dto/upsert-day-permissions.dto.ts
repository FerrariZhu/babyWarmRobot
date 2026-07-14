import { IsArray, IsBoolean, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DayPermissionItemDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayIndex!: number;

  @IsBoolean()
  canCreate!: boolean;

  @IsBoolean()
  canEdit!: boolean;

  @IsBoolean()
  canDeleteOthers!: boolean;
}

export class UpsertDayPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayPermissionItemDto)
  permissions!: DayPermissionItemDto[];
}
