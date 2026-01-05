/**
 * Game Page - Pong game with Canvas rendering
 *
 * Per Constitution I: Canvas 2D for game rendering, WebSocket for real-time state.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthContext";
import { useWebSocket } from "@/lib/game/useWebSocket";
import { GAME_CONFIG, type GameState, type Ball, type Paddle } from "@/lib/game/types";

// ============ Canvas Renderer ============

function renderGame(
  ctx: CanvasRenderingContext2D,
  gameState: GameState | null,
  playerIndex: 0 | 1 | null
) {
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = GAME_CONFIG;

  // Clear canvas with dark background
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw center line
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!gameState) {
    // Draw "Waiting..." text
    ctx.fillStyle = "#666";
    ctx.font = "24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Connecting...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    return;
  }

  const [p1, p2] = gameState.players;

  // Draw paddles
  ctx.fillStyle = "#fff";
  if (p1) {
    drawPaddle(ctx, p1.paddle);
  }
  if (p2) {
    drawPaddle(ctx, p2.paddle);
  }

  // Draw ball (only during gameplay or countdown)
  if (gameState.status === "playing" || gameState.status === "countdown") {
    drawBall(ctx, gameState.ball);
  }

  // Draw scores
  ctx.fillStyle = "#fff";
  ctx.font = "48px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    p1?.score.toString() ?? "0",
    CANVAS_WIDTH / 4,
    60
  );
  ctx.fillText(
    p2?.score.toString() ?? "0",
    (CANVAS_WIDTH * 3) / 4,
    60
  );

  // Draw status overlay
  if (gameState.status === "waiting") {
    drawOverlay(ctx, "Waiting for opponent...", CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (gameState.status === "countdown") {
    drawOverlay(ctx, gameState.countdown.toString(), CANVAS_WIDTH, CANVAS_HEIGHT, 72);
  } else if (gameState.status === "finished") {
    const winner = gameState.players.find(p => p?.id === gameState.winner);
    const winnerText = winner ? `${winner.displayName} wins!` : "Game Over";
    drawOverlay(ctx, winnerText, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Draw player indicator
  if (playerIndex !== null && p1 && p2) {
    ctx.fillStyle = "#888";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`You: ${playerIndex === 0 ? "Left" : "Right"}`, 10, CANVAS_HEIGHT - 10);
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle) {
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  fontSize = 36
) {
  // Semi-transparent background
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, height / 2 - 50, width, 100);

  // Text
  ctx.fillStyle = "#fff";
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2 + fontSize / 3);
}

// ============ Game Component ============

export function GamePage() {
  const { gameId: urlGameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const {
    connection,
    connect,
    disconnect,
    joinGame,
    leaveGame,
    setReady,
    sendInput,
  } = useWebSocket();

  const [error, setError] = useState<string | null>(null);
  const hasConnectedRef = useRef(false);
  const hasJoinedRef = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Connect to WebSocket when authenticated (only once)
  useEffect(() => {
    if (isAuthenticated && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connect();
    }

    // Cleanup on unmount only
    return () => {
      if (hasConnectedRef.current) {
        disconnect();
        hasConnectedRef.current = false;
        hasJoinedRef.current = false;
      }
    };
  }, [isAuthenticated, connect, disconnect]);

  // Join game when connected and have gameId (only once)
  useEffect(() => {
    if (connection.status === "connected" && urlGameId && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      joinGame(urlGameId);
    }
  }, [connection.status, urlGameId, joinGame]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          sendInput("up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          sendInput("down");
          break;
        case " ": // Space to toggle ready
          e.preventDefault();
          if (connection.gameState?.status === "waiting") {
            setReady();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          sendInput("stop");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sendInput, setReady, connection.gameState?.status]);

  // Render game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      renderGame(ctx, connection.gameState, connection.playerIndex);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [connection.gameState, connection.playerIndex]);

  // Handle connection error
  useEffect(() => {
    if (connection.error) {
      setError(connection.error);
    }
  }, [connection.error]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const gameState = connection.gameState;
  const [p1, p2] = gameState?.players ?? [null, null];
  const currentPlayer = connection.playerIndex !== null ? gameState?.players[connection.playerIndex] : null;
  const opponent = connection.playerIndex !== null ? gameState?.players[connection.playerIndex === 0 ? 1 : 0] : null;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Link to="/">
          <Button variant="ghost">← Back</Button>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Latency: {connection.latency}ms
          </span>
          <span className={`text-sm ${
            connection.status === "connected" ? "text-green-500" :
            connection.status === "connecting" ? "text-yellow-500" : "text-red-500"
          }`}>
            ● {connection.status}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="py-3">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Game Canvas */}
      <Card className="mb-4">
        <CardContent className="p-0 flex justify-center bg-black">
          <canvas
            ref={canvasRef}
            width={GAME_CONFIG.CANVAS_WIDTH}
            height={GAME_CONFIG.CANVAS_HEIGHT}
            className="max-w-full h-auto"
          />
        </CardContent>
      </Card>

      {/* Player Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className={connection.playerIndex === 0 ? "ring-2 ring-primary" : ""}>
          <CardHeader className="py-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {p1 ? (
                <>
                  <span>{p1.displayName}</span>
                  {p1.ready && <span className="text-green-500 text-sm">Ready</span>}
                </>
              ) : (
                <span className="text-muted-foreground">Waiting...</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className={connection.playerIndex === 1 ? "ring-2 ring-primary" : ""}>
          <CardHeader className="py-3">
            <CardTitle className="text-lg flex items-center gap-2 justify-end">
              {p2 ? (
                <>
                  {p2.ready && <span className="text-green-500 text-sm">Ready</span>}
                  <span>{p2.displayName}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Waiting...</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p><kbd className="px-2 py-1 bg-muted rounded">W</kbd> / <kbd className="px-2 py-1 bg-muted rounded">↑</kbd> Move Up</p>
              <p><kbd className="px-2 py-1 bg-muted rounded">S</kbd> / <kbd className="px-2 py-1 bg-muted rounded">↓</kbd> Move Down</p>
            </div>

            <div className="flex gap-2">
              {gameState?.status === "waiting" && (
                <Button
                  onClick={setReady}
                  variant={currentPlayer?.ready ? "outline" : "default"}
                >
                  {currentPlayer?.ready ? "Cancel Ready" : "Ready"}
                </Button>
              )}

              {gameState?.status === "finished" && (
                <Button onClick={() => navigate("/")}>
                  Return to Lobby
                </Button>
              )}

              <Button variant="destructive" onClick={leaveGame}>
                Leave Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
