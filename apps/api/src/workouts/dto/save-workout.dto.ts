import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import type { WorkoutDifficulty } from "@platform/types";

const workoutDifficulties: WorkoutDifficulty[] = ["beginner", "intermediate", "advanced"];

export class SaveWorkoutExerciseDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instruction?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  repTarget?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeTargetSeconds?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  distanceTargetMeters?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number | null;

  @IsInt()
  @Min(1)
  sequence!: number;
}

export class SaveWorkoutDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsIn(workoutDifficulties)
  difficulty!: WorkoutDifficulty;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string | null;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaveWorkoutExerciseDto)
  exercises!: SaveWorkoutExerciseDto[];
}
