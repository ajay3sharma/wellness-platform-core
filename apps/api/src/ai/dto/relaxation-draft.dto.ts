import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class RelaxationDraftDto {
  @IsString()
  @MinLength(8)
  @MaxLength(1500)
  prompt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedDurationMinutes?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusTags?: string[];
}
