import type { GameState } from "./state";

type Paddle = GameState["left"];

type RenderOptions = {
  leftName?: string;
  rightName?: string;
};

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, options: RenderOptions = {}) {
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, state.width, state.height); // 背景塗りつぶし

  // 中央の点線
  ctx.fillStyle = "#1f1f1f";
  const dashHeight = 14;
  for (let y = 12; y < state.height; y += dashHeight * 2) {
    ctx.fillRect(state.width / 2 - 2, y, 4, dashHeight);
  }

  // パドルの描画
  ctx.fillStyle = "#eaeaea";
  drawPaddle(ctx, state.left);
  drawPaddle(ctx, state.right);

  // ボールの描画
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fill();

  // スコア表示
  ctx.fillStyle = "#9ca3af";
  ctx.font = "24px 'DotGothic16', monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    `${state.score.left} : ${state.score.right}`,
    state.width / 2,
    36,
  );

  const leftName = options.leftName ?? "Left player";
  const rightName = options.rightName ?? "Right player";

  // ゲームオーバー表示
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#fef3c7";
    ctx.font = "32px 'DotGothic16', monospace";
    ctx.fillText("GAME OVER", state.width / 2, state.height / 2 - 10);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "18px 'DotGothic16', monospace";
    const label = formatWinnerLabel(state.winner, leftName, rightName);
    ctx.fillText(label, state.width / 2, state.height / 2 + 24);
  }
}

// パドルの描画。
function drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle) {
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
}

function formatWinnerLabel(winner: GameState["winner"], leftName: string, rightName: string) {
  if (!winner) return "Winner: -";

  if (winner === "manual_end") {
    return "Game Aborted";
  }

  const winnerName = winner === "left" ? leftName : rightName;
  return `Winner: ${winnerName}`;
}
