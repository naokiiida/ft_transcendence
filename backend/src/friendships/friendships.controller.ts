import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { readCookie } from '../auth/cookie.utils';
import { FriendshipsService } from './friendships.service';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
  type SendFriendRequestBody,
  type RespondFriendRequestBody,
} from '../model/friendship.model';

const SESSION_COOKIE = 'ft_session';

@ApiTags('friendships')
@Controller('api/friendships')
export class FriendshipsController {
  constructor(
    private readonly friendshipsService: FriendshipsService,
    private readonly authService: AuthService,
  ) {}

  // POST /api/friendships — フレンドリクエスト送信
  @Post()
  @UsePipes(new ZodValidationPipe(sendFriendRequestSchema))
  sendRequest(
    @Req() req: Request,
    @Body() body: SendFriendRequestBody,
  ) {
    const user = this.requireAuth(req);
    return this.friendshipsService.sendRequest(user.uuid, body.addressee_id);
  }

  // PATCH /api/friendships/:id — リクエストへの応答（accept/decline）
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(respondFriendRequestSchema))
  respondToRequest(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: RespondFriendRequestBody,
  ) {
    const user = this.requireAuth(req);
    return this.friendshipsService.respondToRequest(id, user.uuid, body.response);
  }

  // GET /api/friendships — フレンド一覧
  @Get()
  getFriends(@Req() req: Request) {
    const user = this.requireAuth(req);
    return this.friendshipsService.getFriends(user.uuid);
  }

  // GET /api/friendships/pending — 受信した保留中リクエスト
  @Get('pending')
  getPendingRequests(@Req() req: Request) {
    const user = this.requireAuth(req);
    return this.friendshipsService.getPendingRequests(user.uuid);
  }

  // DELETE /api/friendships/:id — フレンド解除
  @Delete(':id')
  removeFriend(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const user = this.requireAuth(req);
    return this.friendshipsService.removeFriend(id, user.uuid);
  }

  private requireAuth(req: Request) {
    const sessionId = readCookie(req.headers.cookie ?? '', SESSION_COOKIE);
    if (!sessionId) {
      throw new UnauthorizedException('Not authenticated');
    }
    const user = this.authService.findUserBySession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }
    return user;
  }
}
