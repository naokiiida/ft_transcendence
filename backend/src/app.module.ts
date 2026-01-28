import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [],
  providers: [WsGateway],
})
export class AppModule {}
