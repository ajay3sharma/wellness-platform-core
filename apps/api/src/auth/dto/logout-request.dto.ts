import { IsString, MinLength } from "class-validator";

export class LogoutRequestDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
