import { Type } from "class-transformer";
import { IsIn, IsInt, IsString, Min } from "class-validator";

const markets = ["india", "global"] as const;

export class UpsertCartItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsIn(markets)
  market!: "india" | "global";
}
