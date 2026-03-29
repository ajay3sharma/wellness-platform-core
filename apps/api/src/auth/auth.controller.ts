import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AuthSession, CurrentUser } from "@platform/types";
import { CurrentUserDecorator } from "../common/current-user.decorator";
import { AccessTokenGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/login-request.dto";
import { LogoutRequestDto } from "./dto/logout-request.dto";
import { RefreshSessionRequestDto } from "./dto/refresh-session.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginRequestDto): Promise<AuthSession> {
    return this.authService.login(body);
  }

  @Post("refresh")
  refresh(@Body() body: RefreshSessionRequestDto): Promise<AuthSession> {
    return this.authService.refresh(body);
  }

  @Post("logout")
  async logout(@Body() body: LogoutRequestDto): Promise<{ success: true }> {
    await this.authService.logout(body);
    return { success: true };
  }

  @UseGuards(AccessTokenGuard)
  @Get("me")
  me(@CurrentUserDecorator() user: CurrentUser) {
    return user;
  }
}
