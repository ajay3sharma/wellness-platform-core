import { IsString, MinLength } from "class-validator";

export class AssignCoachDto {
  @IsString()
  @MinLength(1)
  coachId!: string;
}
