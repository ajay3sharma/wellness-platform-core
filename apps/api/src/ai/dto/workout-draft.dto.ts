import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from "class-validator";
import type { WorkoutDifficulty } from "@platform/types";

const workoutDifficulties: WorkoutDifficulty[] = ["beginner", "intermediate", "advanced"];

export class WorkoutDraftDto {
  @IsString()
  @MinLength(8)
  @MaxLength(1500)
  prompt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes?: number | null;

  @IsOptional()
  @IsIn(workoutDifficulties)
  difficulty?: WorkoutDifficulty | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusTags?: string[];
}
