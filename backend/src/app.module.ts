import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ObservabilityModule } from './observability/observability.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ObservabilityModule, AuthModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
