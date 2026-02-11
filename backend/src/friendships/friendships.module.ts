import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';

@Module({
  imports: [AuthModule],
  providers: [FriendshipsService],
  controllers: [FriendshipsController],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}
