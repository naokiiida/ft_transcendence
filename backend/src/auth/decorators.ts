import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

// ── @Public() ─────────────────────────────────────────────
// Guard をスキップしてルートを公開にするデコレータ
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ── @OptionalAuth() ──────────────────────────────────────
// 認証を試みるが、未認証でも通す（request.user は undefined になる）
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);

// ── @CurrentUser() ────────────────────────────────────────
// Guard が req.user にセットしたユーザーを抽出するパラメータデコレータ
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
