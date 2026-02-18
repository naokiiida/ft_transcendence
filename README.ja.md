# ft_transcendence — Biarritz

*This project has been created as part of the 42 curriculum by niida, mkaihori, oohba*

## Description

ft\_transcendence は、リアルタイム対戦 Pong ゲームを中心としたマルチユーザー対応 Web アプリケーションです。Next.js + NestJS で構築し、ローカル対戦・AI 対戦・オンラインマッチメイキングに対応しています。

認証・ユーザー管理・フレンド機能・ゲーム内チャット・レーティングシステム・ゲーム統計・Prometheus + Grafana による運用監視・分析ダッシュボードまでを一体で提供します。

### 主要機能

- リアルタイム対戦 Pong（ローカル / AI / オンライン）
- マッチメイキングキューとオンライン対戦（WebSocket）
- AI 対戦（4段階の難易度）
- ユーザー認証（Email/Password + 42 OAuth）
- ユーザープロフィール・アバター・レーティング
- フレンドシステム（申請・承認・一覧）
- ゲーム内チャット
- ゲームカスタマイズ
- リーダーボード
- 試合履歴・統計
- Prometheus + Grafana による監視
- 分析ダッシュボード
- デザインシステム（Storybook）

---

## Instructions

### 前提条件

- Docker および Docker Compose
- Git
- (ローカル開発の場合) Node.js 22+, npm

### 環境変数の設定

```bash
cp .env.example .env
```

`.env.example` を参照し、以下を設定してください:

| 変数 | 説明 | 例 |
|------|------|-----|
| `NEXT_PUBLIC_API_URL` | バックエンド API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:3001/api/ws` |
| `PORT` | バックエンドポート | `3001` |
| `SESSION_SECRET` | セッション秘密鍵 | `openssl rand -hex 32` で生成 |
| `FT_CLIENT_ID` | 42 OAuth クライアント ID | (42 intra で取得) |
| `FT_CLIENT_SECRET` | 42 OAuth クライアントシークレット | (42 intra で取得) |
| `FT_REDIRECT_URI` | 42 OAuth コールバック URL | `https://your-domain/api/auth/callback` |

### 起動方法（Docker）

```bash
# 全プロファイル起動（Traefik + Cloudflare Tunnel + Storybook 付き）
make up
# または
docker compose --profile production --profile docs up --build
```

### 起動方法（ローカル開発）

```bash
make npm
```

### アクセス

| サービス | URL |
|----------|-----|
| フロントエンド | http://localhost:3000 |
| バックエンド API | http://localhost:3001 |
| API リファレンス | http://localhost:3001/api/reference |
| Grafana | http://localhost:3002 |
| Prometheus | http://localhost:9090 |
| Storybook | http://localhost:6006 |

### 停止

```bash
make down
```

---

## Resources

- [NestJS Authentication](https://docs.nestjs.com/security/authentication#enable-authentication-globally)
- [総務省 AI 白書 (AI の定義)](https://www.soumu.go.jp/johotsusintokei/whitepaper/ja/r01/html/nd113210.html)
- [Multer in Node.js](https://betterstack.com/community/guides/scaling-nodejs/multer-in-nodejs/)
- [Scalar NestJS API Reference](https://scalar.com/products/api-references/integrations/nestjs)
- [Grafana Dashboard JSON Model](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/view-dashboard-json-model/)
- [ft\_transcendence ガイド (Zenn)](https://zenn.dev/mfunyu/books/ft_transcendence)
- [Pong ゲーム参考実装](https://gist.github.com/straker/81b59eecf70da93af396f963596dfdc5)

### AI の活用

本プロジェクトでは、以下の場面で AI（Claude Code 等）を活用しました:

- **コードレビュー**: PR レビュー時の品質チェック・改善提案
- **仕様書作成**: 設計ドキュメント・API 仕様の作成補助
- **実装方法の提案**: 技術的な課題に対するアプローチの比較検討

---

## Team Information

| メンバー | ロール | 担当範囲 |
|----------|--------|----------|
| **niida** | Product Owner, Project Manager, Developer | プロダクトビジョンの定義、プロジェクト管理、User Management・DevOps・監視・チャット・統計・Public API の実装 |
| **oohba** | Technical Lead, Developer | 技術アーキテクチャの設計、AI 対戦・リモート対戦・ゲームカスタマイズの実装 |
| **mkaihori** | Developer | Pong ゲーム（ローカル対戦）・42 OAuth 認証の実装 |

---

## Project Management

- **コミュニケーション**: Discord でリアルタイムな情報共有・議論
- **タスク管理**: GitHub Issues でタスクの起票・アサイン・進捗管理
- **コードレビュー**: Pull Request ベースでのレビュープロセス
- **ミーティング**: 定期的な進捗確認と方針決定

---

## Technical Stack

| カテゴリ | 技術 | 選定理由 |
|----------|------|----------|
| **フロントエンド** | Next.js 15 (App Router), React 19, TypeScript | ファイルベースルーティングと SSR/CSR の柔軟な切替による開発効率の向上 |
| **スタイリング** | Tailwind CSS, shadcn/ui (Radix UI) | ユーティリティファーストの CSS でアクセシブルかつ一貫性のある UI を高速構築 |
| **バックエンド** | NestJS 11, TypeScript, Express | モジュール構造・DI・デコレータベースの設計で保守性の高い API サーバーを構築 |
| **リアルタイム通信** | WebSocket (NestJS WebSocket Gateway) | Pong の対戦同期やチャットなどリアルタイム要件への対応 |
| **データベース** | SQLite + Drizzle ORM | 軽量な運用（ファイルベース DB）と型安全なスキーマ管理の両立 |
| **認証** | Email/Password (パスワードハッシュ + セッション), 42 OAuth | 基本認証の堅牢性と 42 エコシステムとの連携 |
| **バリデーション** | Zod | フロントエンド・バックエンド共通のスキーマ定義で型安全なバリデーション |
| **監視** | Prometheus + Grafana | メトリクス収集と可視化によるシステムの可観測性確保 |
| **リバースプロキシ** | Traefik | ルーティングと HTTPS 終端の自動化 |
| **コンテナ** | Docker, Docker Compose | 再現性のある開発・本番環境の構築 |
| **テスト** | Jest, Vitest, Playwright | ユニット・統合・E2E テストによる品質担保 |
| **ドキュメント** | Storybook, Scalar (API Reference) | コンポーネントカタログと対話的 API ドキュメント |

---

## Database Schema

4 テーブルで構成。SQLite + Drizzle ORM による型安全なスキーマ管理。

### users

| カラム | 型 | 説明 |
|--------|-----|------|
| `uuid` | TEXT (PK) | ユーザー識別子 (UUID) |
| `email` | TEXT (UNIQUE) | メールアドレス |
| `password_hash` | TEXT (NULL可) | パスワードハッシュ (OAuth ユーザーは NULL) |
| `display_name` | TEXT (UNIQUE) | 表示名 |
| `avatar_url` | TEXT (NULL可) | アバター画像 URL |
| `intra_id` | TEXT (UNIQUE) | 42 Intra ID |
| `intra_username` | TEXT (UNIQUE) | 42 Intra ユーザー名 |
| `wins` | INTEGER | 勝利数 (default: 0) |
| `losses` | INTEGER | 敗北数 (default: 0) |
| `user_score` | INTEGER | レーティング (default: 1000, 勝利 +25 / 敗北 -25) |
| `method` | TEXT | 認証方式 ('email' \| 'intra') |
| `created_at` | TEXT | 作成日時 |
| `last_seen` | TEXT | 最終アクティブ日時 |

### sessions

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | TEXT (PK) | セッション ID (UUID) |
| `user_id` | TEXT (FK → users) | ユーザー ID (CASCADE DELETE) |
| `expires_at` | TEXT | 有効期限 |
| `created_at` | TEXT | 作成日時 |

### games

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | TEXT (PK) | ゲーム ID (UUID) |
| `player1_id` | TEXT (FK → users) | プレイヤー 1 |
| `player2_id` | TEXT (FK → users, NULL可) | プレイヤー 2 (オンライン対戦) |
| `winner_id` | TEXT (FK → users, NULL可) | 勝者 |
| `player1_score` | INTEGER | プレイヤー 1 スコア |
| `player2_score` | INTEGER | プレイヤー 2 スコア |
| `game_type` | TEXT | 'local' \| 'online' \| 'ai' |
| `ai_difficulty` | TEXT | 'easy' \| 'medium' \| 'hard' \| 'EuropeanHard' |
| `status` | TEXT | 'waiting' \| 'playing' \| 'completed' \| 'forfeit' |
| `score_delta` | INTEGER | レーティング変動 (±25) |
| `started_at` | TEXT | 開始日時 |
| `ended_at` | TEXT | 終了日時 |
| `created_at` | TEXT | 作成日時 |

### friendships

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | TEXT (PK) | フレンドシップ ID (UUID) |
| `requester_id` | TEXT (FK → users) | リクエスト送信者 (CASCADE DELETE) |
| `addressee_id` | TEXT (FK → users) | リクエスト受信者 (CASCADE DELETE) |
| `status` | TEXT | 'pending' \| 'accepted' \| 'declined' |
| `created_at` | TEXT | 作成日時 |
| `updated_at` | TEXT | 更新日時 |

### リレーションシップ

```text
users 1─∞ sessions    (ユーザー → セッション)
users 1─∞ games       (player1_id, player2_id, winner_id)
users 1─∞ friendships (requester_id, addressee_id)
```

---

## Features List

| 機能 | 説明 | 担当 |
|------|------|------|
| **Pong ローカル対戦** | 同一画面での 2 人対戦モード | mkaihori |
| **Pong AI 対戦** | 4段階難易度 (Easy / Medium / Hard / EuropeanHard) の AI 対戦 | oohba |
| **Pong オンライン対戦** | マッチメイキングキューによるリアルタイムリモート対戦 | oohba |
| **ゲームカスタマイズ** | ゲーム設定のカスタマイズ | oohba |
| **ゲーム内チャット** | 対戦中のテキストメッセージ送受信 | niida |
| **ユーザー登録/ログイン** | Email/Password 認証 (パスワードハッシュ + セッション管理) | niida |
| **42 OAuth** | 42 Intra アカウントによるログイン | mkaihori |
| **ユーザープロフィール** | 表示名・アバター・戦績の表示と編集 | niida |
| **フレンドシステム** | フレンド申請・承認・一覧・削除 | niida |
| **ユーザー検索** | 表示名によるユーザー検索 | niida |
| **リーダーボード** | レーティングによるランキング表示 | niida |
| **試合履歴・統計** | 過去の対戦記録と勝率・レーティング推移 | niida |
| **Prometheus メトリクス** | リクエスト数・レイテンシ・WebSocket 接続数等の収集 | niida |
| **Grafana ダッシュボード** | バックエンド・アプリケーション分析の可視化 | niida |
| **分析ダッシュボード** | ユーザー行動・試合結果のデータ可視化 | niida |
| **Public API** | Scalar による対話的 API リファレンス | niida |
| **デザインシステム** | shadcn/ui ベースの再利用可能 UI コンポーネント + Storybook | masho |
| **Privacy Policy / Terms** | 利用規約とプライバシーポリシーページ | 全員 |

---

## Modules

**合計ポイント: Major 9 × 2pt + Minor 5 × 1pt = 23pt**

### Major Modules (2pt each)

| Module | 担当 | 選定理由 | 実装方法 |
|--------|------|----------|----------|
| **Web (Next.js + NestJS)** | 全員 | フロント/バックのフレームワーク採用で要件を満たし、開発体験と保守性を確保する | Next.js 15 (App Router) + NestJS 11。Docker Compose で統合。Traefik による本番リバースプロキシ |
| **User Management** | niida | 必須のマルチユーザー要件を満たすための認証・プロフィール・友達機能の基盤 | パスワードハッシュ + セッション DB 管理による認証。Zod バリデーション。フレンドシップテーブルによるリレーション管理 |
| **Web-based game (Pong)** | mkaihori | プロジェクトの中核であるリアルタイム対戦ゲームを提供する | Canvas ベースのゲームレンダリング。ティックベースのゲームエンジン (サーバー権威モデル) |
| **AI Opponent** | oohba | 挑戦的な AI 対戦を実現し、人間的な振る舞いをシミュレートする。AI の定義は総務省白書の定義に従う | 4段階の難易度設定。パドル追跡アルゴリズムによる予測と反応速度の調整 |
| **Remote Players** | oohba | 別端末間の対戦を成立させ、遅延や再接続などの実運用課題に対応する | WebSocket Gateway によるリアルタイム同期。マッチメイキングキューシステム。入力シーケンス番号による順序保証 |
| **DevOps (Prometheus+Grafana)** | niida | 監視と可観測性を確保し、品質と運用性を担保する | prom-client でメトリクス収集。Prometheus + Grafana を Docker Compose で統合。プロビジョニング済みダッシュボード |
| **Analytics Dashboard** | niida | ユーザー行動/試合結果の可視化により評価時の説明責任と改善指標を提供する | Grafana ダッシュボードでアプリケーション分析とバックエンド概要を可視化 |
| **User interaction (Chat)** | niida | ユーザー間交流を強化し、リアルタイム性の価値を高める | WebSocket 経由のゲーム内チャット。`chat_message` / `chat_received` メッセージタイプで送受信 |
| **Public API** | niida | API ドキュメントの自動生成で開発効率と外部連携を促進する | NestJS Swagger + Scalar による対話的 API リファレンス (`/api/reference`) |

### Minor Modules (1pt each)

| Module | 担当 | 選定理由 | 実装方法 |
|--------|------|----------|----------|
| **42 OAuth** | mkaihori | 42 エコシステムとの連携で利便性とセキュリティを高める | 42 Intra OAuth 2.0 フロー。`intra_id` / `intra_username` による紐づけ |
| **Game Customization** | oohba | ゲーム体験の幅を広げ、差別化要素を作る | ゲーム設定パラメータのカスタマイズ |
| **Design System** | masho | UI 一貫性と開発効率を高めるため、再利用可能コンポーネントを整備する | shadcn/ui (Radix UI) ベース。Storybook でコンポーネントカタログを管理 |
| **Game statistics** | niida | 勝敗や履歴の表示でユーザー体験を強化し、評価項目にも対応する | 試合履歴 API (`/api/games/history/:userId`)。勝敗ベースのレーティング (±25) |
| **ORM (Drizzle)** | 全員 | データアクセスを型安全にし、スキーマ管理と保守性を向上させる | Drizzle ORM + better-sqlite3。型安全なクエリビルダーとスキーマ定義 |

---

## 役割分担

| Module | Type | Points | 担当 | 状態 |
| :---- | :---- | :---- | :---- | :---- |
| Web (Next.js) | Major | 2 | 全員 | 完了 |
| User Management | Major | 2 | niida | 完了 |
| 42 OAuth | Minor | 1 | mkaihori | 未完了 |
| Web-based game (Pong) | Major | 2 | mkaihori | 完了 |
| AI Opponent | Major | 2 | oohba | 完了 |
| Remote Players | Major | 2 | oohba | 完了 |
| DevOps (Prometheus+Grafana) | Major | 2 | niida | 完了 |
| Analytics Dashboard | Major | 2 | niida | 完了 |
| Game Customization | Minor | 1 | oohba | 完了 |
| Design System | Minor | 1 | masho | 完了 |
| User interaction (Chat) | Major | 2 | niida | 完了 |
| Game statistics | Minor | 1 | niida | 完了 |
| Public API | Major | 2 | niida | 完了 |
| ORM (Drizzle) | Minor | 1 | 全員 | 完了 |

---

## Individual Contributions

### niida (Product Owner / Project Manager / Developer)

- **担当モジュール**: User Management, DevOps, Analytics Dashboard, User interaction (Chat), Game statistics, Public API
- **主な貢献**:
  - Email/Password 認証システムの実装（パスワードハッシュ + セッション管理）
  - ユーザープロフィール機能（表示名・アバターアップロード）とフレンドシステムの設計・実装
  - Prometheus + Grafana による監視基盤の構築とプロビジョニング済みダッシュボードの作成
  - WebSocket を活用したゲーム内チャット機能の実装
  - 試合履歴 API とレーティングシステム (勝利 +25 / 敗北 -25) の設計・実装
  - NestJS Swagger + Scalar による API ドキュメントの自動生成
  - Docker Compose によるインフラ構成の管理
  - プロジェクト全体の進行管理とプロダクトバックログの整理
- **課題と克服**:
  - Prometheus メトリクスと Grafana ダッシュボードの連携で、データソースのプロビジョニング設定に試行錯誤が必要だった。公式ドキュメントと JSON モデルの理解を深めて解決
  - WebSocket 経由のチャットとゲーム状態の同時管理で、メッセージタイプの設計を工夫して統合
  - セッション管理とセキュリティ要件（HTTP-only Cookie、CSRF 対策）の両立に注力

### oohba (Technical Lead / Developer)

- **担当モジュール**: AI Opponent, Remote Players, Game Customization
- **主な貢献**:
  - 4段階の AI 対戦アルゴリズムの実装
  - WebSocket Gateway を使ったリアルタイムゲーム同期とマッチメイキングシステム
  - ゲームカスタマイズ機能の実装
  - 技術アーキテクチャの設計と重要なコード変更のレビュー
- **課題と克服**:
  - オンライン対戦でのレイテンシ対策として入力シーケンス番号による順序保証を導入
  - AI の難易度バランス調整で、プレイテストを重ねてパラメータを最適化

### mkaihori (Developer)

- **担当モジュール**: Web-based game (Pong), 42 OAuth
- **主な貢献**:
  - Pong ゲームエンジンの設計と Canvas ベースのレンダリング実装
  - サーバー権威モデルによるティックベースのゲームロジック
  - ローカル対戦モードの実装
  - 42 Intra OAuth 2.0 認証フローの実装
- **課題と克服**:
  - ゲームループの設計でフレームレート依存の問題に対応し、ティックベースの固定更新間隔で安定した動作を実現

---

## スケジュール

| 週 | 期間 | 目標 |
| :---- | :---- | :---- |
| Week 1 | 1/12〜1/18 | 環境構築、基礎実装開始 (local pong, auth) |
| Week 2 | 1/19〜1/25 | コア機能実装（Remote WebSocket Game, 管理画面） |
| Week 3 | 1/26〜2/1 | 機能完成（User interaction, Monitoring） |
| Week 4 | 2/2〜2/8 | 統合テスト、バグ修正 |
| Week 5 | 2/9〜2/14 | 完成、最終調整 |
| Review | 2/16〜2/22 | 最大 3 回の提出チャンス |
