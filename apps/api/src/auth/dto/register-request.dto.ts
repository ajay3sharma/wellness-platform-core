import { IsEmail, IsIn, IsString, MinLength } from "class-validator";
import type { Role } from "@platform/types";

const allowedRoles: Role[] = ["user", "coach", "admin"];

export class RegisterRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsIn(allowedRoles)
  role!: Role;
}
