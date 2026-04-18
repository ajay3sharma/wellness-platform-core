import { IsString, MinLength } from "class-validator";

export class StartWorkoutSessionDto {
  @IsString()
  @MinLength(1)
  workoutId!: string;
}
