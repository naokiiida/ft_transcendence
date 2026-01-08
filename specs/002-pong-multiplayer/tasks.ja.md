# タスク: ft_transcendence - マルチプレイヤーPongプラットフォーム

**入力**: `/specs/002-pong-multiplayer/`からの設計ドキュメント
**前提条件**: plan.md、spec.md、research.md、data-model.md、contracts/

**テスト**: 明示的にリクエストされていない - テストタスクは省略（必要に応じて`/speckit.tasks`でTDDフラグ付きで追加）

**構成**: 独立した実装とテストを可能にするためにユーザーストーリーごとにグループ化。

## フォーマット: `[ID] [P?] [Story] 説明`

- **[P]**: 並行実行可能（異なるファイル、依存関係なし）
- **[Story]**: どのユーザーストーリーか（US1-US7はspec.mdのP1-P4ストーリーに対応）

---

## フェーズ1: セットアップ（共有インフラ）

**目的**: plan.md構造に従ったプロジェクト初期化

- [ ] T001 リポジトリルートで`deno run -A -r https://fresh.deno.dev`によりFreshプロジェクトを作成
- [ ] T002 [P] deno.jsonを設定: strictなTypeScript、タスク（dev、build、lint、test、setup）、インポートマップ
- [ ] T003 [P] research.mdに従いDaisyUIプラグイン付きでtailwind.config.tsを設定
- [ ] T004 [P] FT_CLIENT_ID、FT_CLIENT_SECRET、FT_REDIRECT_URI、SESSION_SECRETを含む.env.exampleを作成
- [ ] T005 plan.mdに従いディレクトリ構造を作成: routes/、islands/、components/、shared/、lib/、static/、infra/
- [ ] T006 [P] `deno task lint && deno task check`を含む.hooks/pre-commitを作成しdeno.jsonで設定

---

## フェーズ2: 基盤（ブロッキング前提条件）

**目的**: ユーザーストーリー開始前に完了しなければならないコアインフラ

**⚠️ 重要**: このフェーズが完了するまでユーザーストーリー作業は開始不可

### データベース & 型

- [ ] T007 research.md（jsr:@db/sqlite@0.13）に従いSQLite WALモード初期化でlib/db.tsを作成
- [ ] T008 data-model.mdからのすべてのテーブルでlib/migrations/001_initial_schema.sqlを作成
- [ ] T009 マイグレーションバージョン追跡でlib/migrations/runner.tsを作成
- [ ] T010 [P] data-model.mdに従いUser、Session、Friendship型でshared/types/user.tsを作成
- [ ] T011 [P] data-model.mdに従いGame、GameState、GameType型でshared/types/game.tsを作成
- [ ] T012 [P] Tournament、TournamentMatch、TournamentParticipant型でshared/types/tournament.tsを作成
- [ ] T013 [P] contracts/websocket.mdに従いすべてのWebSocketメッセージ型でshared/types/ws.tsを作成
- [ ] T014 [P] contracts/api.yamlに従いZodスキーマ: RegisterRequest、LoginRequestでshared/schemas/auth.tsを作成
- [ ] T015 [P] contracts/api.yamlに従いUpdateProfileRequestスキーマでshared/schemas/user.tsを作成
- [ ] T016 [P] contracts/websocket.mdに従いGameInput、ChatMessageスキーマでshared/schemas/game.tsを作成
- [ ] T017 [P] contracts/api.yamlに従いCreateTournamentRequestスキーマでshared/schemas/tournament.tsを作成

### コアインフラ

- [ ] T018 相関ID付きJSON構造化ロギングでlib/logger.tsを作成
- [ ] T019 research.md（ts_prometheus）に従いPrometheusメトリクスでlib/metrics.tsを作成
- [ ] T020 CSRFトークン生成/検証フレームワークでroutes/_middleware.tsを作成
- [ ] T021 Tailwindスタイルとdaisyuiテーマプロバイダーでroutes/_app.tsxを作成
- [ ] T022 [P] ナビゲーション構造でcomponents/layout/Header.tsxを作成
- [ ] T023 [P] 著作権でcomponents/layout/Footer.tsxを作成
- [ ] T024 [P] 認証対応ナビゲーションリンクでcomponents/layout/Nav.tsxを作成
- [ ] T025 [P] DaisyUIラッパーとしてcomponents/ui/Button.tsxを作成
- [ ] T026 [P] DaisyUIラッパーとしてcomponents/ui/Card.tsxを作成
- [ ] T027 [P] DaisyUIラッパーとしてcomponents/ui/Modal.tsxを作成
- [ ] T028 [P] DaisyUIラッパーとしてcomponents/ui/Badge.tsxを作成

### システムエンドポイント

- [ ] T029 contracts/api.yamlに従い{ status: "ok", timestamp }を返すroutes/health.tsを作成
- [ ] T030 text/plain形式でPrometheusメトリクスを公開するroutes/metrics.tsを作成

**チェックポイント**: 基盤準備完了 - ユーザーストーリー実装開始可能

---

## フェーズ3: ユーザーストーリー2 - 認証（優先度: P1） 🎯 MVPブロッキング

**目標**: ユーザーはメール/パスワードまたは42 OAuth経由で認証しセッションを受け取れる

**独立テスト**: (a) メール/パスワードで登録、ログイン、プロフィール確認；(b) 「42でログイン」クリック、OAuth完了、プロフィール確認

**US1の前の理由**: 認証はマッチメイキングとゲーム作成に必要

### コア認証インフラ

- [ ] T031 [US2] bcrypt（コストファクター12）を使用してhashPassword()、verifyPassword()でlib/password.tsを作成
- [ ] T032 [US2] db.prepare()を使用してcreateSession()、getSession()、deleteSession()でlib/session.tsを作成
- [ ] T033 [US2] research.mdに従いgetAuthorizationUrl()、exchangeCodeForToken()、fetchUserProfile()でlib/oauth42.tsを作成

### メール/パスワード認証

- [ ] T034 [P] [US2] メール、パスワード、display_nameフォーム + クライアントバリデーションでroutes/register.tsxを作成
- [ ] T035 [P] [US2] メール/パスワードフォーム + 「42でログイン」ボタンでroutes/login.tsxを作成
- [ ] T036 [US2] Zodでバリデーション、メール一意性確認、パスワードハッシュ化、ユーザー作成、セッション作成でroutes/api/auth/register.tsを作成
- [ ] T037 [US2] バリデーション、パスワード検証、レート制限（5試行/15分）、セッション作成でroutes/api/auth/login.tsを作成

### 42 OAuth認証

- [ ] T038 [US2] state生成、42認可URLへリダイレクトでroutes/api/auth/oauth/42/index.tsを作成
- [ ] T039 [US2] state検証、コード交換、ユーザーマージ/作成、セッション作成でroutes/api/auth/oauth/42/callback.tsを作成
- [ ] T040 [US2] コールバックにアカウントマージロジックを実装: メールが一致する場合OAuthを既存ユーザーにリンク

### 共通認証

- [ ] T041 [US2] セッション無効化、Cookie削除でroutes/api/auth/logout.tsを作成
- [ ] T042 [US2] Cookieからセッションを抽出しctx.state.userを設定するようroutes/_middleware.tsを更新
- [ ] T043 [US2] contracts/api.yamlに従い現在のユーザープロフィールを返すroutes/api/users/me.tsを作成
- [ ] T044 [US2] 認証対応コンテンツ（ログインユーザー向けクイックマッチボタン）でroutes/index.tsx（ホームページ）を作成

**チェックポイント**: ユーザーはメール/パスワードまたは42 OAuth経由で登録/ログインしプロフィールデータを見れる

---

## フェーズ4: ユーザーストーリー1 - オンラインクイックマッチ（優先度: P1） 🎯 MVP

**目標**: 2人のユーザーがインターネット上で完全なPongゲームをプレイできる

**独立テスト**: 2つのブラウザ → クイックマッチ → マッチング → 11ポイントまでプレイ → 統計記録

### ゲーム物理 & 定数

- [ ] T045 [P] [US1] contracts/websocket.mdに従いCANVAS_WIDTH=800、CANVAS_HEIGHT=600、PADDLE_SPEED=400、BALL_INITIAL_SPEED=300、TICK_RATE=30、WINNING_SCORE=11でshared/game/constants.tsを作成
- [ ] T046 [P] [US1] updateBall()、updatePaddle()、checkCollision()関数でshared/game/physics.tsを作成

### サーバーサイドゲームロジック

- [ ] T047 [US1] research.mdに従いWebSocket接続マネージャー、ルーム参加/離脱/ブロードキャストでlib/ws.tsを作成
- [ ] T048 [US1] FIFOキュー（最大100）、ペアマッチング、ゲーム作成でlib/matchmaking.tsを作成
- [ ] T049 [US1] research.mdに従い30ティック/秒サーバーループ、物理更新、状態ブロードキャストでlib/game-loop.tsを作成
- [ ] T050 [US1] createGame()、updateGameState()、endGame()、handleDisconnect()（10秒タイムアウト、棄権）でlib/game.tsを作成
- [ ] T051 [US1] contracts/websocket.mdに従いDeno.upgradeWebSocket()、メッセージルーティングでroutes/api/ws.tsを作成

### ゲーム永続化

- [ ] T052 [US1] lib/db.tsにゲームCRUD関数を追加: createGame()、updateGame()、getGame()、getGamesByUser()
- [ ] T053 [US1] spec.mdに従いK=32式でcalculateElo()でlib/elo.tsを作成
- [ ] T054 [US1] lib/game.tsにゲーム完了ハンドラーを追加: DBへ永続化、ユーザーwins/losses/elo更新

### マッチメイキングAPI

- [ ] T055 [US1] contracts/api.yamlに従いキューに追加、位置を返すroutes/api/matchmaking/join.tsを作成
- [ ] T056 [US1] キューから削除でroutes/api/matchmaking/leave.tsを作成
- [ ] T057 [US1] contracts/websocket.mdに従いペアリング時のmatchmaking_found WebSocketメッセージを追加

### クライアントサイドゲームUI

- [ ] T058 [P] [US1] Canvas 2Dレンダリング、ボール/パドル描画でislands/PongCanvas.tsxを作成
- [ ] T059 [US1] research.mdに従い100msバッファ、lerpでクライアントサイド補間をPongCanvas.tsxに追加
- [ ] T060 [US1] PongCanvas.tsxにパドル入力処理を追加: W/Sキー、クライアント予測、サーバー調整
- [ ] T061 [P] [US1] キュー位置、待ち時間、キャンセルボタンでislands/MatchmakingQueue.tsxを作成
- [ ] T062 [P] [US1] player1対player2スコア表示でcomponents/game/ScoreDisplay.tsxを作成
- [ ] T063 [P] [US1] カウントダウン、一時停止、終了状態表示でcomponents/game/GameStatus.tsxを作成

### ゲームページ

- [ ] T064 [US1] マッチメイキングをトリガーする「クイックマッチ」ボタンでroutes/game/index.tsx（ロビー）を作成
- [ ] T065 [US1] PongCanvas、ScoreDisplay、GameStatusを統合してroutes/game/[id].tsxを作成
- [ ] T066 [US1] contracts/api.yamlに従いGETゲーム詳細でroutes/api/games/[id].tsを作成

### WebSocket再接続

- [ ] T067 [US1] research.mdに従い指数バックオフによる再接続をPongCanvas.tsxに追加
- [ ] T068 [US1] contracts/websocket.mdに従いgame_paused/game_resumedメッセージ処理を追加

**チェックポイント**: 2人のユーザーが完全なマルチプレイヤーPongゲームを完了できる

---

## フェーズ5: ユーザーストーリー3 - プロフィール & フレンド（優先度: P2）

**目標**: ユーザーはプロフィールをカスタマイズ、フレンドを追加、オンラインステータスとマッチ履歴を見れる

**独立テスト**: 名前編集 → アバターアップロード → フレンドリクエスト送信 → 承認 → オンラインインジケーター表示

### プロフィール管理

- [ ] T069 [US3] contracts/api.yamlに従いGET（公開プロフィール）、PATCH（自分のプロフィール）でroutes/api/users/[id].tsを作成
- [ ] T070 [US3] マルチパートアップロード処理（2MB以下、PNG/JPG/GIF）でroutes/api/users/[id]/avatar.tsを作成
- [ ] T071 [US3] UUIDファイル名でstatic/avatars/にアバターを保存、avatar_urlを返す
- [ ] T072 [P] [US3] display_nameフォーム、アバターアップロードでroutes/profile/edit.tsxを作成
- [ ] T073 [P] [US3] ユーザープロフィール表示（公開ビュー）でroutes/profile/[id].tsxを作成
- [ ] T074 [US3] ドラッグ&ドロップ、プレビュー、サイズバリデーションでislands/AvatarUpload.tsxを作成

### フレンドシステム

- [ ] T075 [US3] lib/db.tsにフレンドシップCRUDを追加: createFriendRequest()、acceptFriend()、declineFriend()、removeFriend()、getFriends()
- [ ] T076 [US3] contracts/api.yamlに従いGET（オンラインステータス付きフレンドリスト）でroutes/api/friends/index.tsを作成
- [ ] T077 [US3] contracts/api.yamlに従いGET（保留中）、POST（リクエスト送信）でroutes/api/friends/requests.tsを作成
- [ ] T078 [US3] PATCH（承認/拒否）でroutes/api/friends/requests/[id].tsを作成
- [ ] T079 [US3] DELETE（フレンド削除）でroutes/api/friends/[id].tsを作成

### オンラインプレゼンス

- [ ] T080 [US3] setOnline()、setOffline()、isOnline()、getOnlineFriends()でlib/presence.tsを作成
- [ ] T081 [US3] ping/pongハートビート（30秒間隔）でプレゼンスを追跡するようlib/ws.tsを更新
- [ ] T082 [US3] 緑/灰色ドットインジケーターでislands/OnlineStatus.tsxを作成
- [ ] T083 [US3] contracts/websocket.mdに従いfriend_online/friend_offline WebSocketメッセージをlib/ws.tsに追加
- [ ] T084 [US3] contracts/websocket.mdに従いfriend_request WebSocket通知を追加

### マッチ履歴 & 統計

- [ ] T085 [US3] contracts/api.yamlに従いページネーション（limit、offset）でroutes/api/users/[id]/games.tsを作成
- [ ] T086 [US3] 日付、対戦相手、結果付きゲームリスト表示でcomponents/MatchHistory.tsxを作成
- [ ] T087 [US3] routes/profile/[id].tsxにマッチ履歴セクションを追加

**チェックポイント**: プロフィール、フレンド、統計を含む完全なユーザー管理

---

## フェーズ6: ユーザーストーリー4 - AI対戦相手（優先度: P2）

**目標**: ユーザーは説明可能な意思決定を持つAIに対して練習できる

**独立テスト**: AI対戦 → ハード選択 → AIがボールを予測 → 「AI説明」クリック → 理由表示

### AIロジック

- [ ] T088 [P] [US4] predictBallPosition()、calculateTargetY()、shouldMiss(difficulty)でshared/game/ai.tsを作成
- [ ] T089 [US4] spec.mdに従い難易度別ミス率を実装: イージー40%、ミディアム20%、ハード5%以下
- [ ] T090 [US4] contracts/websocket.mdに従いAI説明生成を追加: predicted_ball_y、target_paddle_y、confidence、reason

### AIゲーム統合

- [ ] T091 [US4] game_type='ai'ゲーム用のAIパドル制御をlib/game-loop.tsに追加
- [ ] T092 [US4] contracts/api.yamlに従い難易度選択でAIゲームを開始するPOSTでroutes/api/games/ai.tsを作成
- [ ] T093 [US4] contracts/websocket.mdに従いAIExplanationを返すai_explain WebSocketメッセージハンドラーを追加

### AIゲームUI

- [ ] T094 [P] [US4] 難易度セレクター（イージー/ミディアム/ハード）でroutes/game/ai.tsxを作成
- [ ] T095 [US4] 予測ボールパス、ターゲット位置、信頼度バー表示でislands/AIExplainer.tsxを作成
- [ ] T096 [US4] ai_explainリクエストをトリガーする「AI説明」ボタンをゲームUIに追加

**チェックポイント**: AI対戦相手がすべての難易度と説明可能性で動作

---

## フェーズ7: ユーザーストーリー5 - トーナメントシステム（優先度: P3）

**目標**: ユーザーはブラケット進行でトーナメントを作成/参加できる

**独立テスト**: 4人トーナメント作成 → 全員参加 → 開始 → マッチプレイ → 勝者表示

### トーナメントバックエンド

- [ ] T097 [US5] lib/db.tsにトーナメントCRUDを追加: createTournament()、joinTournament()、startTournament()、getTournament()
- [ ] T098 [US5] lib/db.tsにトーナメントマッチCRUDを追加: createMatches()、updateMatchWinner()、getNextMatch()
- [ ] T099 [US5] research.mdに従い4/8人のみ（シードなし）のgenerateBracket()でlib/tournament.tsを作成
- [ ] T100 [US5] spec.mdに従い3本勝負ロジックを追加: プレイヤーごとのgames_won追跡、先に2勝で進出
- [ ] T101 [US5] 勝者進出を追加: ブラケット更新、次ラウンドマッチ設定、トーナメント完了確認

### トーナメントAPI

- [ ] T102 [US5] contracts/api.yamlに従いGET（リスト）、POST（作成）でroutes/api/tournaments/index.tsを作成
- [ ] T103 [US5] GET（詳細 + ブラケット）でroutes/api/tournaments/[id].tsを作成
- [ ] T104 [US5] オープントーナメントに参加するPOSTでroutes/api/tournaments/[id]/join.tsを作成
- [ ] T105 [US5] 開始前に離脱するPOSTでroutes/api/tournaments/[id]/leave.tsを作成
- [ ] T106 [US5] POST（作成者のみ、4または8人必要）でroutes/api/tournaments/[id]/start.tsを作成

### トーナメントUI

- [ ] T107 [P] [US5] open/in_progress/completedトーナメントリストでroutes/tournament/index.tsxを作成
- [ ] T108 [P] [US5] 名前、max_players（4/8/16）フォームでroutes/tournament/create.tsxを作成
- [ ] T109 [US5] 参加者、ブラケット、マッチステータス表示でroutes/tournament/[id].tsxを作成
- [ ] T110 [US5] ラウンド、マッチ、勝者を可視化するislands/TournamentBracket.tsxを作成

### トーナメントWebSocket

- [ ] T111 [US5] contracts/websocket.mdに従いtournament_match_readyメッセージをlib/ws.tsに追加
- [ ] T112 [US5] マッチ準備完了時に参加者に通知
- [ ] T113 [US5] spec.mdに従い5分参加タイムアウト（棄権）を実装

**チェックポイント**: ブラケット付き完全なトーナメントシステム

---

## フェーズ8: ユーザーストーリー6 - ゲームチャット（優先度: P3）

**目標**: プレイヤーはマッチ中にチャットできる

**独立テスト**: メッセージ送信 → 対戦相手が見る → `<script>`送信 → テキストとしてレンダリング（XSS安全）

### チャット実装

- [ ] T114 [US6] lib/ws.tsにchat_messageハンドラーを追加: Zodでバリデーション、ゲームメンバーシップ確認
- [ ] T115 [US6] チャットハンドラーにXSSエスケープを追加: <、>、&、"、'文字をエスケープ
- [ ] T116 [US6] contracts/websocket.mdに従いレート制限を追加: 10秒あたり5メッセージ、超過時chat_rate_limitedを返す
- [ ] T117 [US6] メッセージリスト（スクロール可能）、入力フィールド、送信ボタンでislands/ChatBox.tsxを作成
- [ ] T118 [US6] routes/game/[id].tsxにChatBoxを折りたたみ可能パネルとして統合

**チェックポイント**: チャットがレート制限とXSS保護で動作

---

## フェーズ9: ユーザーストーリー7 - システムメトリクス（優先度: P4）

**目標**: 分析ダッシュボード付きPrometheus/Grafana監視

**独立テスト**: ゲームプレイ → /metricsチェック → Grafanaに統計表示

### アプリケーションメトリクス

- [ ] T119 [US7] lib/metrics.tsにゲームメトリクスを追加: games_active_total、games_completed_total、game_duration_seconds
- [ ] T120 [US7] 接続メトリクスを追加: websocket_connections_total、matchmaking_queue_size
- [ ] T121 [US7] HTTPメトリクスを追加: method/path/statusラベル付きhttp_request_duration_seconds

### インフラ設定

- [ ] T122 [P] [US7] Freshアプリ用スクレイプ設定（/metrics）でinfra/prometheus/prometheus.ymlを作成
- [ ] T123 [P] [US7] infra/grafana/provisioning/datasources/prometheus.ymlを作成
- [ ] T124 [US7] 自動プロビジョニングでinfra/grafana/provisioning/dashboards/dashboards.ymlを作成

### ダッシュボード

- [ ] T125 [US7] CPU、メモリ、接続パネルでinfra/grafana/dashboards/system-health.jsonを作成
- [ ] T126 [US7] ゲーム/日、平均時間、アクティブユーザーでinfra/grafana/dashboards/game-analytics.jsonを作成

**チェックポイント**: Prometheus + Grafanaによる完全なオブザーバビリティ

---

## フェーズ10: ポリッシュ & 横断的関心事

**目的**: Dockerデプロイメント、セキュリティ強化、最終バリデーション

### Dockerデプロイメント

- [ ] T127 research.mdに従いマルチステージビルドでDockerfileを作成
- [ ] T128 plan.mdに従いfresh、traefik、prometheus、grafanaサービスでdocker-compose.ymlを作成
- [ ] T129 HTTPS設定、Let's Encrypt、ルーティングルールでinfra/traefik/traefik.ymlを作成
- [ ] T130 `docker compose up --build`ですべてのサービスが起動しアプリがアクセス可能なことを確認

### セキュリティ強化

- [ ] T131 [P] すべてのルートを監査: すべてのPOST/PATCH/DELETEエンドポイントでCSRFトークン検証
- [ ] T132 [P] lib/db.tsを監査: すべてのクエリがdb.prepare()を使用、文字列補間なし
- [ ] T133 [P] パスワード処理を監査: bcryptコストファクター12以上、平文保存なし
- [ ] T134 routes/_middleware.tsにAPIレート制限ミドルウェアを追加（一般100リクエスト/分）
- [ ] T135 [P] セッションCookieを確認: HttpOnly、Secure、SameSite=Strict

### コード品質

- [ ] T136 [P] `deno check`を実行しすべての型エラーを修正
- [ ] T137 [P] `deno lint`を実行しすべてのリント問題を修正
- [ ] T138 [P] `deno fmt`を実行しコードベース全体をフォーマット

### 最終バリデーション

- [ ] T139 quickstart.mdバリデーションを実行: clone → setup → docker compose up → ゲームプレイ
- [ ] T140 7つのユーザーストーリーすべてが独立して動作することをテスト（手動確認）
- [ ] T141 42評価基準を確認: すべてのモジュールがデモ可能、セキュリティチェック合格
- [ ] T142 マルチマシンマルチプレイヤーをテスト（異なるネットワーク/IP）

---

## 依存関係 & 実行順序

### フェーズ依存関係

```
フェーズ1（セットアップ）────────► フェーズ2（基盤）────────► ユーザーストーリー
                                    │
                                    ▼
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
                フェーズ3        フェーズ4        フェーズ9
                （US2認証）      （US1ゲーム）    （US7メトリクス）
                    │               │
                    │               ├──────────────┬──────────────┐
                    ▼               ▼              ▼              ▼
                フェーズ5        フェーズ6       フェーズ7       フェーズ8
                （US3プロフィール）（US4 AI）    （US5トーナメント）（US6チャット）
                                    │              │              │
                    └───────────────┴──────────────┴──────────────┘
                                    │
                                    ▼
                            フェーズ10（ポリッシュ）
```

### ユーザーストーリー依存関係

| ストーリー | 依存 | 並行可能 |
|-------|------------|-------------------|
| US2（認証） | 基盤のみ | US7（メトリクス） |
| US1（ゲーム） | US2（マッチメイキングにログイン必要） | - |
| US3（プロフィール） | US2 | US4、US5、US6、US7 |
| US4（AI） | US1（ゲームエンジン） | US3、US5、US6、US7 |
| US5（トーナメント） | US1（ゲームエンジン） | US3、US4、US6、US7 |
| US6（チャット） | US1（WebSocket） | US3、US4、US5、US7 |
| US7（メトリクス） | 基盤のみ | US2、US3、US4、US5、US6 |

### 各フェーズ内

- [P]マークのタスクは並行実行可能
- 型/スキーマはサービスより先
- サービスはAPIルートより先
- APIルートはページより先
- ページはIslandsより先

---

## 並行実行例

### フェーズ2 - 基盤（並行ストリーム）

```bash
# ストリーム1: データベース
T007: lib/db.ts
T008: lib/migrations/001_initial_schema.sql
T009: lib/migrations/runner.ts

# ストリーム2: すべての型（並行）
T010、T011、T012、T013: shared/types/*.ts

# ストリーム3: すべてのスキーマ（並行）
T014、T015、T016、T017: shared/schemas/*.ts

# ストリーム4: すべてのUIコンポーネント（並行）
T022-T028: components/**/*.tsx
```

### フェーズ4 - US1ゲーム（T047-T051後）

```bash
# 並行UI開発
T058: islands/PongCanvas.tsx
T061: islands/MatchmakingQueue.tsx
T062: components/game/ScoreDisplay.tsx
T063: components/game/GameStatus.tsx
```

---

## 実装戦略

### MVPファースト（US2 + US1のみ）

1. フェーズ1完了: セットアップ（約6タスク）
2. フェーズ2完了: 基盤（約24タスク）
3. フェーズ3完了: US2認証（約14タスク）
4. フェーズ4完了: US1ゲーム（約24タスク）
5. **停止して検証**: 2人のユーザーがログインし完全なPongゲームをプレイできる
6. MVPをデプロイ/デモ

**MVPタスク数**: 約68タスク

### インクリメンタルデリバリー

| インクリメント | ストーリー | 42ポイント | 累積 |
|-----------|---------|-----------|------------|
| MVP | US2 + US1 | 8pt（Webゲーム、リモート、WebSocket、ユーザー管理） | 8pt |
| +プロフィール/フレンド | US3 | 2pt（ユーザー管理強化） | 10pt |
| +AI | US4 | 2pt（AI対戦相手） | 12pt |
| +トーナメント | US5 | 1pt（トーナメントシステム） | 13pt |
| +チャット | US6 | 0pt（あれば良い） | 13pt |
| +メトリクス | US7 | 4pt（Prometheus + 分析） | 17pt |
| フレームワーク + SSR | 自動 | 3pt（Freshが提供） | **20pt** |

**注**: 42プロジェクトは最低14ポイント必要；19+ポイントを目標

### 並行チーム戦略（開発者2人）

フェーズ2後:
- **開発者A**: US2（認証）→ US1（ゲーム）→ US4（AI）→ US5（トーナメント）
- **開発者B**: US7（メトリクス）→ US3（プロフィール）→ US6（チャット）→ ポリッシュ

---

## サマリー

| メトリック | 数 |
|--------|-------|
| **総タスク数** | **142** |
| フェーズ1: セットアップ | 6 |
| フェーズ2: 基盤 | 24 |
| フェーズ3: US2（認証） | 14 |
| フェーズ4: US1（ゲーム） | 24 |
| フェーズ5: US3（プロフィール） | 19 |
| フェーズ6: US4（AI） | 9 |
| フェーズ7: US5（トーナメント） | 17 |
| フェーズ8: US6（チャット） | 5 |
| フェーズ9: US7（メトリクス） | 8 |
| フェーズ10: ポリッシュ | 16 |
| **並行可能 [P]** | **41** |

---

## 注記

- [P]タスクは並行実行可能（異なるファイル、ブロッキング依存関係なし）
- [USx]ラベルはトレーサビリティのためにspec.mdユーザーストーリーに対応
- すべてのSQLは憲法に従いdb.prepare()を使用しなければならない（文字列補間なし）
- すべての入力はZodスキーマでバリデーションしなければならない（クライアント + サーバー）
- ストーリーを独立して検証するために任意のチェックポイントで停止可能
- MVP = US2 + US1 = 認証 + クイックマッチ（約68タスク）
- 各ユーザーストーリーは依存関係が満たされた後に独立してテスト可能
