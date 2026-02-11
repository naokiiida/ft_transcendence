import { Module } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';

@Module({
  providers: [FriendshipsService],
  controllers: [FriendshipsController],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}
