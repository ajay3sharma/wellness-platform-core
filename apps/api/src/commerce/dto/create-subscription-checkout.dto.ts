import { IsIn, IsString } from "class-validator";

const markets = ["india", "global"] as const;
const surfaces = ["web", "mobile"] as const;

export class CreateSubscriptionCheckoutDto {
  @IsString()
  subscriptionPlanId!: string;

  @IsIn(markets)
  market!: "india" | "global";

  @IsIn(surfaces)
  surface!: "web" | "mobile";
}
