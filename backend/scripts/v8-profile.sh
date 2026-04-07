#!/usr/bin/env bash
# V8 CPUプロファイル生成スクリプト
#
# 使い方:
#   ./scripts/v8-profile.sh [duration_seconds]
#
# Node.jsの --prof フラグを使ってV8プロファイルを生成し、
# 読みやすいテキスト形式に変換する。
#
# 結果:
#   - isolate-*.log (V8生データ)
#   - profile-processed.txt (人間が読める形式)

set -euo pipefail

DURATION="${1:-30}"
OUTPUT_DIR="./profiles"

echo "=== V8 CPUプロファイル生成 ==="
echo "  計測時間: ${DURATION}秒"
echo ""

mkdir -p "$OUTPUT_DIR"
cd "$OUTPUT_DIR"

echo "[1/4] --prof フラグ付きでサーバー起動..."
node --prof ../dist/main.js &
PID=$!

echo "  PID: $PID"
echo "  http://localhost:3001 でアクセス可能"
echo "  ゲームをプレイしてCPU負荷をかけてください"
echo ""
echo "  ${DURATION}秒後に自動停止します..."

sleep "$DURATION"

echo ""
echo "[2/4] サーバー停止中..."
kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true

echo "[3/4] プロファイルデータ処理中..."
# 最新の isolate log を探す
LOG_FILE=$(ls -t isolate-*.log 2>/dev/null | head -1)

if [ -z "$LOG_FILE" ]; then
  echo "エラー: プロファイルログが見つかりません"
  exit 1
fi

node --prof-process "$LOG_FILE" > profile-processed.txt

echo "[4/4] 完了!"
echo ""
echo "  生データ:     ${OUTPUT_DIR}/${LOG_FILE}"
echo "  処理済み:     ${OUTPUT_DIR}/profile-processed.txt"
echo ""
echo "  処理済みファイルを確認してください:"
echo "    cat ${OUTPUT_DIR}/profile-processed.txt | head -100"
echo ""
echo "  ヒント: 'Bottom up (heavy) profile' セクションが最も有用です"
