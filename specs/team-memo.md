# 役割分担（案）

```
module                      type    points  担当候補  status
──────────────────────────────────────────────────────────
Web (Next.js)               Major   2       全員      確定
User Management             Major   2       mkaihori  確定
42 OAuth                    Minor   1       mkaihori  確定
Web-based game (Pong)       Major   2       oohba     確定
Remote Players              Major   2       masho     確定
DevOps (Prometheus+Grafana) Major   2       niida     確定
Analytics Dashboard         Major   2       niida     確定
Game Customization          Minor   1       oohba     確定
Design System               Minor   1       masho     確定
User interaction (Chat)     Major   2       未定      検討中
Game statistics             Minor   1       niida     確定
Data export/import          Minor   1       niida     確定
Spectator mode              Minor   1       未定      検討中
Tournament system           Minor   1       未定      検討中
ORM (Drizzle)               Minor   1       全員      確定
```

表の確定のみ: 18 (Major 6, Minor 6)
表の確定+検討: 22 (Major 7, Minor 8)
https://docs.google.com/spreadsheets/d/1xJMBCPTS0YcCT38UFUdIvJhMEQKqYM_SnMdQJu1xN8Y/edit?usp=sharing

# スケジュール（案）

開発スケジュール（逆算）

| 週     | 期間       | 目標                                            |
| ------ | ---------- | ----------------------------------------------- |
| Week 1 | 1/12〜1/18 | 環境構築、基礎実装開始 (local pong, auth)       |
| Week 2 | 1/19〜1/25 | コア機能実装（Remote WebSocket Game, 管理画面） |
| Week 3 | 1/26〜2/1  | 機能完成（User interaction, Monitoring）        |
| Week 4 | 2/2〜2/8   | 統合テスト、バグ修正                            |
| Week 5 | 2/9〜2/14  | 完成、最終調整                                  |
| Review | 2/16〜2/22 | 最大 3 回の提出チャンス                         |
