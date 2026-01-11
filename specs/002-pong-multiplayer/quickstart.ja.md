# クイックスタート: ft_transcendence開発

**機能**: 002-pong-multiplayer
**日付**: 2026-01-08（更新）

このガイドでは、開発者がゼロからアプリケーションを実行するまでを説明します。

---

## 前提条件

- **Deno** 1.40以上: `curl -fsSL https://deno.land/install.sh | sh`
- **Docker** と Docker Compose
- **42 APIアプリケーション**: https://profile.intra.42.fr/oauth/applications で登録

---

## 1. クローンとセットアップ

```bash
git clone <repository-url>
cd ft_transcendence
```

## 2. 環境設定

`.env`ファイルを作成:

```bash
# 42 OAuth（https://profile.intra.42.fr/oauth/applications から取得）
FT_CLIENT_ID=your_42_client_id
FT_CLIENT_SECRET=your_42_client_secret
FT_REDIRECT_URI=https://pong.taiida.com/api/auth/callback

# セッション
SESSION_SECRET=generate_a_32_char_random_string

# 環境
DENO_ENV=development
```

セッションシークレットの生成:
```bash
openssl rand -hex 32
```

## 3. データベースセットアップ

データベースは初回実行時に自動初期化されます。手動セットアップの場合:

```bash
mkdir -p data
deno task db:migrate
```

## 4. 開発サーバーの実行

```bash
# ホットリロード付きFresh開発サーバーを起動
deno task dev
```

アクセス先: https://pong.taiida.com（Cloudflare DNS経由で127.0.0.1に解決）

## 5. Docker実行（本番環境相当）

```bash
# すべてのサービスをビルドして起動
docker compose up --build

# またはバックグラウンドで
docker compose up -d
```

起動するサービス:
- **fresh**: アプリケーション（ポート8000）
- **traefik**: リバースプロキシ（ポート80、443）
- **prometheus**: メトリクス（ポート9090）
- **grafana**: ダッシュボード（ポート3000）

---

## プロジェクト構造概要

```
ft_transcendence/
├── routes/              # Freshルート（ページ + API）
│   ├── api/             # REST + WebSocketエンドポイント
│   ├── game/            # ゲームページ
│   └── profile/         # ユーザープロフィールページ
├── islands/             # インタラクティブコンポーネント（ハイドレート）
├── components/          # サーバーレンダリングコンポーネント
├── shared/              # 共有型 + Zodスキーマ
├── lib/                 # サーバーユーティリティ（db、auth、ws）
├── static/              # 静的アセット
├── tests/               # テストファイル
└── infra/               # Docker、Traefik、Prometheus、Grafana設定
```

---

## 一般的なタスク

### テストの実行

```bash
# すべてのテスト
deno task test

# 特定のテストファイル
deno test tests/unit/physics.test.ts

# カバレッジ付き
deno task test:coverage
```

### リント & フォーマット

```bash
# リントチェック
deno task lint

# コードフォーマット
deno task fmt

# 型チェック
deno task check
```

### データベース操作

```bash
# SQLite CLIを開く
sqlite3 data/pong.db

# マイグレーションを実行
deno task db:migrate

# データベースをリセット（⚠️ データを削除）
rm data/pong.db && deno task db:migrate
```

---

## 開発ワークフロー

### 1. フィーチャーブランチを作成

```bash
git checkout -b feature/my-feature
```

### 2. 変更を加える

- ルートは`routes/`に
- インタラクティブIslandsは`islands/`に
- サーバーユーティリティは`lib/`に
- 共有型は`shared/types/`に
- Zodスキーマは`shared/schemas/`に

### 3. ローカルでテスト

```bash
deno task dev
# Chromeでhttps://pong.taiida.comを開く
```

### 4. コミット前にチェックを実行

```bash
deno task check && deno task lint && deno task test
```

### 5. 規約に従ってコミット

```bash
git commit -m "feat(game): add paddle collision detection"
```

コミットタイプ: `feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`
スコープ: `game`、`auth`、`user`、`chat`、`infra`、`shared`

---

## デバッグ

### ログの表示

```bash
# Dockerログ
docker compose logs -f fresh

# 開発サーバーログはターミナルに表示
```

### メトリクスの確認

http://localhost:9090（Prometheus）または http://localhost:3000（Grafana）にアクセス

デフォルトGrafana資格情報: admin / admin

### データベースの検査

```bash
sqlite3 data/pong.db "SELECT * FROM users LIMIT 5;"
```

### WebSocketテスト

ブラウザDevToolsのNetworkタブ → WSフィルタを使用、または:

```bash
# websocatを使用
websocat wss://pong.taiida.com/api/ws -H "Cookie: session=YOUR_SESSION"
```

---

## トラブルシューティング

### "Module not found"エラー

```bash
deno cache --reload main.ts
```

### SQLite "database is locked"

1つのプロセスのみがデータベースにアクセスしていることを確認、またはWALモードを確認:

```sql
PRAGMA journal_mode;  -- 'wal'を返すべき
```

### OAuthコールバックが失敗

1. `FT_REDIRECT_URI`が.envと42アプリ設定で完全に一致することを確認
2. `FT_CLIENT_ID`と`FT_CLIENT_SECRET`が正しいことを確認
3. https://pong.taiida.comが127.0.0.1に解決することを確認

### Dockerネットワーキングの問題

```bash
docker compose down -v
docker compose up --build
```

---

## 参考リンク

- [Freshドキュメント](https://fresh.deno.dev/docs)
- [Denoマニュアル](https://docs.deno.com)
- [shadcn/uiコンポーネント](https://ui.shadcn.com/docs/components)
- [42 APIドキュメント](https://api.intra.42.fr/apidoc)
- [Prometheusクエリ言語](https://prometheus.io/docs/prometheus/latest/querying/basics/)
