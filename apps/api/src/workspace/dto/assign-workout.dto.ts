import { IsOptional, IsString, MinLength } from "class-validator";

export class AssignWorkoutDto {
  @IsString()
  @MinLength(1)
  workoutId!: string;

  @IsOptional()
  @IsString()
  note?: string | null;
}
