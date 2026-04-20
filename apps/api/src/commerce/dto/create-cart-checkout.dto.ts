import { IsIn } from "class-validator";

const markets = ["india", "global"] as const;
const surfaces = ["web", "mobile"] as const;

export class CreateCartCheckoutDto {
  @IsIn(markets)
  market!: "india" | "global";

  @IsIn(surfaces)
  surface!: "web" | "mobile";
}
