import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type RegisterRequest = {
  email: string;
  password: string;
  display_name: string;
};

// api/auth/registerが呼ばれるとAuthServiceのregisterメソッドを呼び出す
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //bodyで受け取ったjsonをRegisterRequest型としてregisterメソッドに渡す
  @Post('register')
  register(@Body() body: RegisterRequest) {
    //受け取ったデータは関与せずサービスに渡すだけ。
    return this.authService.register(body);
  }
}
