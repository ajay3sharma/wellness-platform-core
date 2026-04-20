import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class SaveDailyQuoteDto {
  @IsString()
  @Matches(datePattern)
  entryDate!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  quoteText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  author?: string | null;
}
