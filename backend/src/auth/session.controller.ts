import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Res,
  NotFoundException,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser, OptionalAuth } from './decorators';
import { UsersService } from '../users/users.service';
import { gameResultSchema, type GameResult, type User } from '../model/user.model';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

@ApiTags('session')
@RequireUser()
@Controller('api')
export class SessionController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @OptionalAuth()
  me(@CurrentUser() user: User | undefined) {
    if (!user) {
      return { guest: true };
    }
    return this.authService.toPublicUser(user);
  }

  @Delete('me')
  deleteMe(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.usersService.deleteByUuid(user.uuid);
    this.authService.removeSessionsByUuid(user.uuid);
    res.cookie('ft_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return { ok: true };
  }

  @Post('me/test-score')
  @UsePipes(new ZodValidationPipe(gameResultSchema))
  testScore(@CurrentUser() user: User, @Body() body: GameResult) {
    const updated = this.usersService.recordGameResult(user.uuid, body);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.authService.toPublicUser(updated);
  }
}
