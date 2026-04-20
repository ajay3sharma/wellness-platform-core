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

export class WorkoutRecommendationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(240)
  goal!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  availableMinutes!: number;

  @IsIn(workoutDifficulties)
  preferredDifficulty!: WorkoutDifficulty;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusTags?: string[];
}
