-- 認証方法と認証情報の整合性をトリガーでチェック
-- SQLiteはALTER TABLE ADD CONSTRAINTをサポートしないため、トリガーで整合性を保証

CREATE TRIGGER IF NOT EXISTS check_auth_consistency_insert
BEFORE INSERT ON users
BEGIN
  SELECT CASE
    WHEN NEW.method = 'email' AND NEW.password_hash IS NULL THEN
      RAISE(ABORT, 'email method requires password_hash')
    WHEN NEW.method = 'intra' AND NEW.intra_id IS NULL THEN
      RAISE(ABORT, 'intra method requires intra_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS check_auth_consistency_update
BEFORE UPDATE ON users
BEGIN
  SELECT CASE
    WHEN NEW.method = 'email' AND NEW.password_hash IS NULL THEN
      RAISE(ABORT, 'email method requires password_hash')
    WHEN NEW.method = 'intra' AND NEW.intra_id IS NULL THEN
      RAISE(ABORT, 'intra method requires intra_id')
  END;
END;
