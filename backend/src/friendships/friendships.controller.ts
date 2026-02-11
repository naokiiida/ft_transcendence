import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators';
import { FriendshipsService } from './friendships.service';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
  type SendFriendRequestBody,
  type RespondFriendRequestBody,
} from '../model/friendship.model';
import type { User } from '../model/user.model';

@ApiTags('friendships')
@Controller('api/friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  // POST /api/friendships — フレンドリクエスト送信
  @Post()
  sendRequest(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(sendFriendRequestSchema)) body: SendFriendRequestBody,
  ) {
    return this.friendshipsService.sendRequest(user.uuid, body.addressee_id);
  }

  // PATCH /api/friendships/:id — リクエストへの応答（accept/decline）
  @Patch(':id')
  respondToRequest(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(respondFriendRequestSchema)) body: RespondFriendRequestBody,
  ) {
    return this.friendshipsService.respondToRequest(id, user.uuid, body.response);
  }

  // GET /api/friendships — フレンド一覧
  @Get()
  getFriends(@CurrentUser() user: User) {
    return this.friendshipsService.getFriends(user.uuid);
  }

  // GET /api/friendships/pending — 受信した保留中リクエスト
  @Get('pending')
  getPendingRequests(@CurrentUser() user: User) {
    return this.friendshipsService.getPendingRequests(user.uuid);
  }

  // DELETE /api/friendships/:id — フレンド解除
  @Delete(':id')
  removeFriend(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.friendshipsService.removeFriend(id, user.uuid);
  }
}
