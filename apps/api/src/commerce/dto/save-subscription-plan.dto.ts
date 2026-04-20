import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  ValidateNested
} from "class-validator";
import { PriceInputDto } from "./price-input.dto";

const userPlans = ["free", "plus", "pro"] as const;
const intervals = ["month", "year"] as const;

export class SaveSubscriptionPlanDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsIn(userPlans)
  userPlan!: "free" | "plus" | "pro";

  @IsIn(intervals)
  billingInterval!: "month" | "year";

  @IsArray()
  @IsString({ each: true })
  features!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PriceInputDto)
  prices!: PriceInputDto[];
}
