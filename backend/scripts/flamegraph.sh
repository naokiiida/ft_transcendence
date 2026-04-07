#!/usr/bin/env bash
# フレームグラフ生成スクリプト
#
# 使い方:
#   ./scripts/flamegraph.sh [duration_seconds]
#
# 依存: 0x (npm install -g 0x) または npx で自動実行
#
# 結果: ./flamegraph/ ディレクトリにHTMLフレームグラフが生成される

set -euo pipefail

DURATION="${1:-30}"
OUTPUT_DIR="./flamegraph"

echo "=== NestJS Backend フレームグラフ生成 ==="
echo "  計測時間: ${DURATION}秒"
echo "  出力先:   ${OUTPUT_DIR}/"
echo ""

mkdir -p "$OUTPUT_DIR"

# 方法1: 0x を使用 (推奨 - インタラクティブなフレームグラフ)
if command -v npx &>/dev/null; then
  echo "[1/3] 0x でプロファイリング開始..."
  echo "      ${DURATION}秒後に自動停止します"
  echo "      ゲームをプレイしてCPU負荷をかけてください"
  echo ""

  # バックグラウンドで 0x + NestJS を起動
  npx 0x -o "$OUTPUT_DIR" -D "$DURATION" -- node dist/main.js &
  PID=$!

  echo "  PID: $PID"
  echo "  http://localhost:3001 でアクセス可能"
  echo ""

  # 完了を待つ
  wait $PID || true

  echo ""
  echo "[2/3] フレームグラフ生成完了!"
  echo "  出力先: ${OUTPUT_DIR}/"
  ls -la "$OUTPUT_DIR"/*.html 2>/dev/null || echo "  (HTMLファイルが見つかりません)"

  echo ""
  echo "[3/3] ブラウザで開いてください:"
  echo "  open ${OUTPUT_DIR}/*.html"
  exit 0
fi

echo "エラー: npx が見つかりません。Node.jsをインストールしてください。"
exit 1
