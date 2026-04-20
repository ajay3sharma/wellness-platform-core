import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

export class SaveDailyPanchangDto {
  @IsString()
  @Matches(datePattern)
  entryDate!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  headline!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  tithi!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nakshatra!: string;

  @IsString()
  @Matches(timePattern)
  sunriseTime!: string;

  @IsString()
  @Matches(timePattern)
  sunsetTime!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  focusText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
