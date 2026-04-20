import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";
import type { ResetRecommendationNeed } from "@platform/types";

const recommendationNeeds: ResetRecommendationNeed[] = ["calm", "focus", "sleep", "recovery"];

export class ResetRecommendationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(240)
  intent!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  availableMinutes!: number;

  @IsOptional()
  @IsIn(recommendationNeeds)
  need?: ResetRecommendationNeed | null;
}
