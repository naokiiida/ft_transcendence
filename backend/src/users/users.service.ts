import { Injectable } from '@nestjs/common';
import type { User } from '../model/user.model';

/*
メモリに保存してるので、あとでDBに変更する予定

ID

*/

@Injectable()
export class UsersService {
  //DIとは、サービス自体をnewするもので、これはサービス内でnewしているのでDIではない
  private usersByEmail = new Map<string, User>();
  private usersByDisplayName = new Map<string, User>();
  private usersPasswordsByDisplayName = new Map<string, string>();

  findByEmail(email: string) {
    return this.usersByEmail.get(email);
  }

  findByDisplayName(displayName: string) {
    return this.usersByDisplayName.get(displayName);
  }

  findPasswordHashByDisplayName(displayName: string) {
    return this.usersPasswordsByDisplayName.get(displayName);
  }

  create(user: User) {
    this.usersByEmail.set(user.email, user);
    this.usersByDisplayName.set(user.display_name, user);
    this.usersPasswordsByDisplayName.set(user.display_name, user.password_hash);
    return user;
  }
}
