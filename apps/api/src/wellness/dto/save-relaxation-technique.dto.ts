import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";

export class SaveRelaxationStepDto {
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  title!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(1500)
  instruction!: string;

  @IsInt()
  @Min(1)
  durationSeconds!: number;

  @IsInt()
  @Min(1)
  sequence!: number;
}

export class SaveRelaxationTechniqueDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string | null;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsInt()
  @Min(1)
  estimatedDurationMinutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaveRelaxationStepDto)
  steps!: SaveRelaxationStepDto[];
}
