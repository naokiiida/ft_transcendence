# 実装計画: ft_transcendence - マルチプレイヤーPongプラットフォーム

**ブランチ**: `002-pong-multiplayer` | **日付**: 2026-01-08 | **仕様**: [spec.md](./spec.md)
**入力**: `/specs/002-pong-multiplayer/spec.md`からの機能仕様

## サマリー

**Deno Fresh**（SSR + Islandsアーキテクチャ）で構築されたフルスタックPongマルチプレイヤープラットフォーム。コア成果物: リアルタイムWebSocketゲームプレイ、42 OAuth + メール認証、トーナメントブラケット、説明可能なAI対戦相手、Prometheus/Grafanaオブザーバビリティ。42プロジェクト評価で**19モジュールポイント**（必須14）を目標。

## 技術コンテキスト

**言語/バージョン**: TypeScript（Deno 1.40以上ネイティブ）
**主要依存関係**: Fresh 1.6以上、Preact 10.0以上、DaisyUI + Tailwind、Zod
**ストレージ**: WALモードのSQLite（`data/pong.db`）
**テスト**: `deno test`（組み込み）
**ターゲットプラットフォーム**: Dockerコンテナ（linux/amd64）、`pong.taiida.com`でHTTPS経由アクセス
**プロジェクトタイプ**: Web（Freshモノリス - フロントエンド/バックエンド統合）
**パフォーマンス目標**: ゲーム状態更新30以上/秒、LAN遅延100ms未満、同時ゲーム100以上
**制約**: 単一の`docker compose up`起動、マイクロサービスなし、SQLiteのみ
**スケール/スコープ**: 同時ゲーム50、ユーザー約100、42評価準備

## 憲法チェック

*ゲート: フェーズ0リサーチ前に合格必須。フェーズ1設計後に再チェック。*

| 原則 | ゲート基準 | ステータス |
|-----------|---------------|--------|
| I. Fresh優先モノリシック | 単一コードベース、マイクロサービスなし、インタラクティビティにIslands | ✅ 合格 |
| II. 型安全優先 | `strict: true`、`any`なし、すべての入力にZodバリデーション | ✅ 合格 |
| III. デフォルトでセキュア | `db.prepare()`のみ、bcrypt、CSRFトークン、HTTPS | ✅ 合格 |
| IV. リアルタイムゲームアーキテクチャ | サーバー権威物理、WebSocketプロトコル、30ティック/秒 | ✅ 合格 |
| V. 観測可能な運用 | `/metrics`、`/health`、JSONログ、Grafanaダッシュボード | ✅ 合格 |
| VI. シンプルさとYAGNI | 時期尚早な抽象化なし、最小限の依存関係 | ✅ 合格 |

**設計前ゲート**: 合格 - フェーズ0へ進行

**設計後ゲート**（2026-01-08）: 合格 - すべての原則を維持
- ✅ Islandsアーキテクチャ付き単一Freshコードベース
- ✅ `shared/schemas/`にZodスキーマ定義
- ✅ research.md例で`db.prepare()`パターン
- ✅ 30ティック/秒のサーバー権威ゲームループ
- ✅ `/metrics`と`/health`エンドポイント計画済み
- ✅ 最小限の依存関係（Deno stdlib + Fresh + Zod）

## プロジェクト構造

### ドキュメント（この機能）

```text
specs/002-pong-multiplayer/
├── plan.md              # このファイル
├── research.md          # フェーズ0出力
├── data-model.md        # フェーズ1出力
├── quickstart.md        # フェーズ1出力
├── contracts/           # フェーズ1出力（OpenAPI仕様）
└── tasks.md             # フェーズ2出力（/speckit.tasks）
```

### ソースコード（リポジトリルート）

```text
# Freshモノリス構造（憲法§Iに従う）
ft_transcendence/
├── deno.json              # Deno設定 + タスク
├── tailwind.config.ts     # Tailwind + DaisyUI
├── docker-compose.yml     # コンテナオーケストレーション
├── Dockerfile             # マルチステージビルド
├── fresh.gen.ts           # Freshマニフェスト（自動生成）
├── main.ts                # エントリーポイント
├── data/
│   └── pong.db            # SQLiteデータベース（WALモード）
├── routes/
│   ├── _app.tsx           # アプリラッパー
│   ├── _middleware.ts     # 認証 + CSRFミドルウェア
│   ├── index.tsx          # ホームページ
│   ├── login.tsx          # メール/パスワード + 42 OAuth
│   ├── register.tsx       # メール登録
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts       # POST /api/auth/login
│   │   │   ├── logout.ts      # POST /api/auth/logout
│   │   │   ├── register.ts    # POST /api/auth/register
│   │   │   └── oauth/
│   │   │       └── 42/        # 42 OAuthコールバック
│   │   ├── users/
│   │   │   ├── [id].ts        # GET/PATCHユーザープロフィール
│   │   │   └── me.ts          # GET現在のユーザー
│   │   ├── friends/           # フレンドリクエストエンドポイント
│   │   ├── games/             # ゲーム履歴エンドポイント
│   │   ├── tournaments/       # トーナメントCRUD
│   │   ├── matchmaking.ts     # POST /api/matchmaking
│   │   └── ws.ts              # WebSocketアップグレード
│   ├── game/
│   │   ├── [id].tsx           # ゲームルームページ
│   │   └── ai.tsx             # AI対戦相手ページ
│   ├── profile/
│   │   ├── [id].tsx           # ユーザープロフィールビュー
│   │   └── edit.tsx           # プロフィール編集ページ
│   ├── tournament/
│   │   ├── index.tsx          # トーナメントリスト
│   │   ├── create.tsx         # トーナメント作成
│   │   └── [id].tsx           # トーナメントブラケットビュー
│   ├── metrics.ts             # Prometheus /metrics
│   └── health.ts              # ヘルスチェック /health
├── islands/
│   ├── PongCanvas.tsx         # ゲームレンダリング（Canvas 2D）
│   ├── ChatBox.tsx            # リアルタイムチャット
│   ├── OnlineStatus.tsx       # フレンドプレゼンスインジケーター
│   ├── MatchmakingQueue.tsx   # タイマー付きキューUI
│   ├── TournamentBracket.tsx  # インタラクティブブラケット
│   └── AIExplainer.tsx        # AI判断可視化
├── components/
│   ├── ui/                    # DaisyUIラッパー
│   ├── layout/                # ページレイアウト
│   └── forms/                 # フォームコンポーネント
├── shared/
│   ├── types/
│   │   ├── user.ts            # User、Session型
│   │   ├── game.ts            # GameState、PlayerInput型
│   │   ├── tournament.ts      # Tournament、Match型
│   │   └── ws.ts              # WebSocketメッセージ型
│   ├── schemas/
│   │   ├── auth.ts            # Login、Registerスキーマ（Zod）
│   │   ├── user.ts            # プロフィール更新スキーマ
│   │   ├── game.ts            # ゲームアクションスキーマ
│   │   └── tournament.ts      # トーナメントスキーマ
│   └── game/
│       ├── physics.ts         # ボール/パドル物理
│       ├── constants.ts       # ゲームサイズ、速度
│       └── ai.ts              # AI判断ロジック
├── lib/
│   ├── db.ts                  # SQLite（db.prepare()のみ）
│   ├── auth.ts                # セッション管理
│   ├── ws.ts                  # WebSocketハンドラー
│   ├── matchmaking.ts         # キュー管理
│   ├── metrics.ts             # Prometheusメトリクス
│   └── oauth42.ts             # 42 OAuthクライアント
├── static/
│   └── styles.css             # コンパイル済みTailwind
├── tests/
│   ├── unit/
│   │   ├── physics.test.ts
│   │   ├── ai.test.ts
│   │   └── auth.test.ts
│   ├── integration/
│   │   ├── game.test.ts
│   │   └── tournament.test.ts
│   └── e2e/
│       └── gameplay.test.ts
└── infra/
    ├── traefik/
    │   └── traefik.yml        # Traefik設定
    ├── prometheus/
    │   └── prometheus.yml     # スクレイプ設定
    └── grafana/
        ├── provisioning/      # ダッシュボードプロビジョニング
        └── dashboards/        # 事前構築ダッシュボード
```

**構造決定**: 憲法§IごとのIslandsアーキテクチャ付きFreshモノリス。ルートがSSRページとAPIエンドポイントを処理。インタラクティブコンポーネント（ゲームキャンバス、チャット、ブラケット）は選択的ハイドレーションを持つIslands。共有型/スキーマが型安全なクライアント-サーバー通信を可能にする。

## 複雑性追跡

> 違反なし - 設計は憲法原則に従う。

| 違反 | 必要な理由 | シンプルな代替を拒否した理由 |
|-----------|------------|-------------------------------------|
| *(なし)* | — | — |
