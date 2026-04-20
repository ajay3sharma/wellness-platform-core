import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";

const markets = ["india", "global"] as const;

export class PriceInputDto {
  @IsIn(markets)
  market!: "india" | "global";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
