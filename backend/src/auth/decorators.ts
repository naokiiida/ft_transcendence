import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// ── @Public() ─────────────────────────────────────────────
// Guard をスキップしてルートを公開にするデコレータ
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ── @CurrentUser() ────────────────────────────────────────
// Guard が req.user にセットしたユーザーを抽出するパラメータデコレータ
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);

// ── @RequireUser() ────────────────────────────────────────
// API キー認証では user が null になる。
// このデコレータが付いたルートはセッション認証（user 必須）を要求する。
export const REQUIRE_USER_KEY = 'requireUser';
export const RequireUser = () => SetMetadata(REQUIRE_USER_KEY, true);
