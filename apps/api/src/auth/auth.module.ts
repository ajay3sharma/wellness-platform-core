import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ApiConfigModule } from "../config/api-config.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AccessTokenGuard } from "./auth.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [ApiConfigModule, PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenGuard],
  exports: [AuthService, AccessTokenGuard]
})
export class AuthModule {}
