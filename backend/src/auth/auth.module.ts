import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SessionController } from './session.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';

import { FortyTwoStrategy } from './strategies/forty-two.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: false }),
  ],
  controllers: [AuthController, SessionController],
  providers: [
    AuthService,
    FortyTwoStrategy,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
