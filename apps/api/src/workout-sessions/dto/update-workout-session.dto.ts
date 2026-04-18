import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested
} from "class-validator";

export class WorkoutSessionExerciseUpdateDto {
  @IsString()
  @MinLength(1)
  id!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateWorkoutSessionDto {
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutSessionExerciseUpdateDto)
  exercises?: WorkoutSessionExerciseUpdateDto[];
}
