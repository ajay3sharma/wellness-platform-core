import { IsString } from "class-validator";

export class CheckoutSessionLaunchQueryDto {
  @IsString()
  token!: string;
}
