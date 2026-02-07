import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GamesService } from './games.service';
import type {
  CreateGameInput,
  StartGameInput,
  FinishGameInput,
  GameStatus,
} from '../model/game.model';

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  create(@Body() input: CreateGameInput) {
    return this.gamesService.create(input);
  }

  @Get('waiting')
  findWaiting() {
    return this.gamesService.findWaitingGames();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gamesService.findByIdOrThrow(id);
  }

  @Get()
  findByPlayer(
    @Query('player_id') playerId?: string,
    @Query('status') status?: GameStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!playerId) {
      return [];
    }
    return this.gamesService.findByPlayerId(playerId, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Patch(':id/start')
  start(@Param('id') id: string, @Body() input: StartGameInput) {
    return this.gamesService.start(id, input);
  }

  @Patch(':id/finish')
  finish(@Param('id') id: string, @Body() input: FinishGameInput) {
    return this.gamesService.finish(id, input);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string) {
    return this.gamesService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    return { deleted: !!this.gamesService.deleteById(id) };
  }
}
