import { IsIn, IsOptional } from "class-validator";

const markets = ["india", "global"] as const;

export class StoreMarketQueryDto {
  @IsOptional()
  @IsIn(markets)
  market?: "india" | "global";
}
