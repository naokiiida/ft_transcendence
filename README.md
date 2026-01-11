# ft_transcendence

リアルタイム対戦Pongゲーム + トーナメントシステム

## 必要な環境

- Node.js 22+
- Docker

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

# 4. 依存関係をインストール
npm install

# 5. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 42 OAuth アプリの登録

1. https://profile.intra.42.fr/oauth/applications にアクセス
2. 「Register a new app」をクリック
3. 以下を入力:
   - **Redirect URI**: `https://pong.taiida.com/api/auth/callback`
4. 生成された `Client ID` と `Secret` を `.env` にコピー

## よく使うコマンド

```bash
# 開発
npm run dev        # 開発サーバー起動 (ホットリロード)
npm run lint       # ESLint チェック

# テスト
npm test           # テスト実行
npm run test:watch # ウォッチモードでテスト

# ビルド
npm run build      # 本番ビルド
npm run start      # 本番サーバー起動
```

## Docker で起動

```bash
# 全サービス起動 (Next.js + Prometheus + Grafana)
docker compose up --build

# バックグラウンドで起動
docker compose up -d

# ログ確認
docker compose logs -f app

# 停止
docker compose down
```

| サービス | URL | 説明 |
|----------|-----|------|
| Next.js | http://localhost:3000 | メインアプリ |
| Prometheus | http://localhost:9090 | メトリクス |
| Grafana | http://localhost:3001 | ダッシュボード (admin/admin) |

## VS Code / Cursor で開発

### Devcontainer を使う場合

1. VS Code で `ft_transcendence` フォルダを開く
2. コマンドパレット → 「Dev Containers: Reopen in Container」
3. 自動的に Node.js 環境が構築される

### ローカルで開発する場合

推奨拡張機能:
- `dbaeumer.vscode-eslint`
- `bradlc.vscode-tailwindcss`
- `esbenp.prettier-vscode`

## プロジェクト構成

```
ft_transcendence/
├── app/              # Next.js App Router ページ
│   ├── layout.tsx    # ルートレイアウト
│   ├── page.tsx      # トップページ
│   ├── globals.css   # グローバルスタイル
│   └── api/          # API Routes (今後作成)
├── components/       # React コンポーネント
├── lib/              # ユーティリティ & データベース
│   ├── db.ts         # SQLite 接続 (今後作成)
│   └── auth.ts       # 認証ヘルパー (今後作成)
├── public/           # 静的ファイル (favicon など)
├── tests/            # テストファイル (今後作成)
├── infra/            # Prometheus/Grafana 設定
├── specs/            # 仕様書 (詳細設計)
├── package.json      # 依存関係 & スクリプト
├── next.config.ts    # Next.js 設定
└── tailwind.config.ts # Tailwind CSS 設定
```

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| ランタイム | Node.js 22 |
| フレームワーク | Next.js 15 (App Router) |
| UI | React 19 + DaisyUI + Tailwind CSS |
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

### `npm run dev` でエラーが出る

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### ポートが使用中

```bash
# 使用中のプロセスを確認
lsof -i :3000

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
2. **コミット前**: `npm run lint` を実行
3. **型安全**: `any` 禁止、Zod でバリデーション
4. **セキュリティ**: SQL は必ずパラメータ化クエリを使用
