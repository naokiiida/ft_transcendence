import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  searchUsersQuerySchema,
  type SearchUsersQuery,
  type User,
} from '../model/user.model';
import { UsersService } from './users.service';

//usersを使う予定。まだ未実装
@ApiTags('users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users/search?display_name=foo&limit=10
  @Get('search')
  searchUsers(
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(searchUsersQuerySchema)) query: SearchUsersQuery,
  ) {
    return this.usersService.searchByDisplayName(
      query.display_name,
      query.limit,
      user.uuid,
    );
  }
}
