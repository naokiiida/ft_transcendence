// テスト環境用のダミー環境変数
// 42 OAuth Strategy が clientID を必須とするため、ダミー値を設定
process.env.FT_CLIENT_ID = process.env.FT_CLIENT_ID || 'test-client-id';
process.env.FT_CLIENT_SECRET = process.env.FT_CLIENT_SECRET || 'test-client-secret';
