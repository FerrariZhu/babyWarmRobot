import { IsArray, IsInt, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItemDto {
  @IsString()
  id!: string;

  @IsInt()
  order!: number;

  @IsInt()
  @Min(0)
  @Max(6)
  dayIndex!: number;
}

export class ReorderLessonsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
