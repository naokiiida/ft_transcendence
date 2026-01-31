import { Injectable } from '@nestjs/common';
import type { User } from '../model/user.model';

/*
メモリに保存してるので、あとでDBに変更する予定

*/

@Injectable()
export class UsersService {
  private usersByEmail = new Map<string, User>();
  private usersByDisplayName = new Map<string, User>();
  private usersByUuid = new Map<string, User>();
  private usersPasswordsByUuid = new Map<string, string>();

  findByEmail(email: string) {
    return this.usersByEmail.get(email);
  }

  findByDisplayName(displayName: string) {
    return this.usersByDisplayName.get(displayName);
  }

  findByUuid(uuid: string) {
    return this.usersByUuid.get(uuid);
  }

  findPasswordHashByUuid(uuid: string) {
    return this.usersPasswordsByUuid.get(uuid);
  }

  create(user: User) {
    this.usersByEmail.set(user.email, user);
    this.usersByDisplayName.set(user.display_name, user);
    if (user.uuid) {
      this.usersByUuid.set(user.uuid, user);
      this.usersPasswordsByUuid.set(user.uuid, user.password_hash);
    }
    return user;
  }
}
