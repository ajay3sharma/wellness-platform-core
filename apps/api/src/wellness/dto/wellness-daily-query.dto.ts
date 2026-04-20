import { IsString, MinLength } from "class-validator";

export class WellnessDailyQueryDto {
  @IsString()
  @MinLength(1)
  timeZone!: string;
}
