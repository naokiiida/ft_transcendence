import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  BadRequestException,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { AuthService } from './auth.service';
import { CurrentUser, OptionalAuth, Public, RequireUser } from './decorators';
import { UsersService } from '../users/users.service';
import {
  gameResultSchema,
  updateProfileSchema,
  type GameResult,
  type UpdateProfileInput,
  type User,
} from '../model/user.model';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

const AVATAR_DIR = path.join(process.cwd(), 'data', 'avatars');
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
    const avatarPath = path.join(AVATAR_DIR, `${user.uuid}.webp`);
    fs.promises.unlink(avatarPath).catch(() => {}); // ENOENT無視
    res.cookie('ft_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return { ok: true };
  }

  @Patch('me/profile')
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  updateProfile(
    @CurrentUser() user: User,
    @Body() body: UpdateProfileInput,
  ) {
    const updated = this.usersService.updateProfile(user.uuid, body);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.authService.toPublicUser(updated);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only image files (jpg, png, gif, webp) are allowed') as unknown as null, false);
      }
    },
  }))
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!fs.existsSync(AVATAR_DIR)) {
      fs.mkdirSync(AVATAR_DIR, { recursive: true });
    }
    const destPath = path.join(AVATAR_DIR, `${user.uuid}.webp`);
    try {
      await sharp(file.buffer)
        .resize(256, 256, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(destPath);
    } catch {
      throw new BadRequestException('Invalid image file');
    }
    const avatarUrl = `/api/avatars/${user.uuid}.webp`;
    const updated = this.usersService.updateProfile(user.uuid, { avatar_url: avatarUrl });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.authService.toPublicUser(updated);
  }

  @Get('avatars/:filename')
  @Public()
  getAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!/^[a-f0-9-]+\.webp$/.test(filename)) {
      throw new NotFoundException('Avatar not found');
    }
    const filePath = path.join(AVATAR_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Avatar not found');
    }
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filePath);
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
