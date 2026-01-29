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
  private usersById = new Map<string, User>();
  private usersPasswords = new Map<string, string>();

  findByEmail(email: string) {
    return this.usersByEmail.get(email);
  }

  findById(id: string) {
    return this.usersById.get(id);
  }

  findPasswordHashById(id: string) {
    return this.usersPasswords.get(id);
  }

  create(user: User) {
    this.usersByEmail.set(user.email, user);
    this.usersById.set(user.id, user);
    this.usersPasswords.set(user.id, user.password_hash);
    return user;
  }
}
