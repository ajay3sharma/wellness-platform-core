import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class SaveMusicTrackDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string | null;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  artistName!: string;

  @IsInt()
  @Min(1)
  durationSeconds!: number;

  @IsString()
  @MinLength(8)
  @MaxLength(2048)
  audioUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  artworkUrl?: string | null;
}
