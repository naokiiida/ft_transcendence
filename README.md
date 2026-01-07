# ft_transcendence

リアルタイム対戦Pongゲーム + トーナメントシステム

## 必要な環境

- deno
- docker

## クイックスタート

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd ft_transcendence

# 2. 環境変数を設定
cp .env.example .env

# 3. .env を編集して 42 OAuth 情報を入力
#    - FT_CLIENT_ID: 42 OAuth アプリの Client ID
#    - FT_CLIENT_SECRET: 42 OAuth アプリの Secret
#    - SESSION_SECRET: 下記コマンドで生成
openssl rand -hex 32

# 4. Git hooks を設定 & 依存関係をインストール
deno task setup

# 5. 開発サーバーを起動
deno task dev
```

ブラウザで http://localhost:5173 を開く

## 42 OAuth アプリの登録

1. https://profile.intra.42.fr/oauth/applications にアクセス
2. 「Register a new app」をクリック
3. 以下を入力:
   - **Redirect URI**: `https://pong.taiida.com/api/auth/callback`
4. 生成された `Client ID` と `Secret` を `.env` にコピー

## よく使うコマンド

```bash
# 開発
deno task dev          # 開発サーバー起動 (ホットリロード)
deno task check        # フォーマット + Lint + 型チェック

# テスト
deno task test         # テスト実行
deno task test:watch   # ウォッチモードでテスト

# ビルド
deno task build        # 本番ビルド
deno task start        # 本番サーバー起動

# データベース
deno task db:migrate   # マイグレーション実行

# フォーマット
deno task fmt          # コード整形
deno task lint         # Lint チェック
```

## Docker で起動

```bash
# 全サービス起動 (Fresh + Prometheus + Grafana)
docker compose up --build

# バックグラウンドで起動
docker compose up -d

# ログ確認
docker compose logs -f fresh

# 停止
docker compose down
```

| サービス | URL | 説明 |
|----------|-----|------|
| Fresh | http://localhost:8000 | メインアプリ |
| Prometheus | http://localhost:9090 | メトリクス |
| Grafana | http://localhost:3000 | ダッシュボード (admin/admin) |

## VS Code / Cursor で開発

### Devcontainer を使う場合

1. VS Code で `ft_transcendence` フォルダを開く
2. コマンドパレット → 「Dev Containers: Reopen in Container」
3. 自動的に Deno 環境が構築される

### ローカルで開発する場合

推奨拡張機能:
- `denoland.vscode-deno` (必須)
- `bradlc.vscode-tailwindcss`

## プロジェクト構成

```
ft_transcendence/
├── routes/           # ページ & API ルート
│   ├── _app.tsx      # アプリ全体のレイアウト
│   ├── index.tsx     # トップページ
│   └── api/          # API エンドポイント
├── islands/          # クライアントサイド JS (インタラクティブ)
├── components/       # 再利用可能な UI コンポーネント
├── assets/           # CSS (Tailwind + DaisyUI)
├── static/           # 静的ファイル (favicon など)
├── lib/              # サーバーサイドロジック (今後作成)
│   ├── db.ts         # SQLite 接続
│   └── auth.ts       # 認証ヘルパー
├── shared/           # クライアント/サーバー共有コード (今後作成)
│   ├── types/        # TypeScript 型定義
│   └── schemas/      # Zod バリデーションスキーマ
├── tests/            # テストファイル (今後作成)
├── infra/            # Prometheus/Grafana 設定
├── specs/            # 仕様書 (詳細設計)
├── deno.json         # Deno 設定 & タスク定義
├── main.ts           # エントリーポイント
└── vite.config.ts    # Vite 設定
```

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| ランタイム | Deno 2.x |
| フレームワーク | Fresh 2.x (SSR + Islands) |
| UI | Preact + DaisyUI + Tailwind CSS v4 |
| データベース | SQLite (WAL モード) |
| バリデーション | Zod |
| リアルタイム通信 | WebSocket |
| 認証 | 42 OAuth + Email/Password |
| 監視 | Prometheus + Grafana |

## 仕様書

詳細な設計ドキュメントは `specs/002-pong-multiplayer/` にあります:

- `spec.md` - 機能仕様
- `plan.md` - 技術設計
- `data-model.md` - データベーススキーマ
- `tasks.md` - 実装タスク
- `contracts/openapi.yaml` - REST API 仕様
- `contracts/websocket-protocol.md` - WebSocket プロトコル

## トラブルシューティング

### `deno task dev` でエラーが出る

```bash
# キャッシュをクリアして再インストール
rm -rf node_modules deno.lock
deno install
deno task dev
```

### ポートが使用中

```bash
# 使用中のプロセスを確認
lsof -i :5173
lsof -i :8000

# プロセスを終了
kill -9 <PID>
```

### Docker でビルドが失敗する

```bash
# キャッシュなしでリビルド
docker compose build --no-cache
```

## チーム開発ルール

1. **ブランチ**: `feature/xxx` で作業し、PR でマージ
2. **コミット前**: `deno task check` を実行
3. **型安全**: `any` 禁止、Zod でバリデーション
4. **セキュリティ**: SQL は必ずパラメータ化クエリを使用
