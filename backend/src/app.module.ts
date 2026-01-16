import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsGateway } from './ws.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, WsGateway],
})
export class AppModule {}
