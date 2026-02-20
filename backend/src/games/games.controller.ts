import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  matchHistoryQuerySchema,
  type MatchHistoryQuery,
} from '../model/game.model';

@ApiTags('games')
@ApiCookieAuth('ft_session')
@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  // GET /api/games/history/:userId — ユーザーの対戦履歴
  // NOTE: :id ワイルドカードより先に定義する（ルート優先順位）
  @Get('history/:userId')
  getMatchHistory(
    @Param('userId') userId: string,
    @Query(new ZodValidationPipe(matchHistoryQuerySchema)) query: MatchHistoryQuery,
  ) {
    return this.gamesService.getMatchHistory(userId, query.limit, query.offset);
  }

  // GET /api/games/:id — ゲーム詳細
  @Get(':id')
  getGame(@Param('id') id: string) {
    const game = this.gamesService.findById(id);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }
}
