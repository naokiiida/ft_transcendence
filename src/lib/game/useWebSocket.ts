/**
 * WebSocket hook for real-time game connection
 *
 * Manages WebSocket connection lifecycle, message handling, and reconnection.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  GameState,
  Ball,
  Paddle,
  ClientMessage,
  ServerMessageType,
} from "./types";

// ============ Types ============

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface GameConnection {
  status: ConnectionStatus;
  gameId: string | null;
  playerIndex: 0 | 1 | null;
  gameState: GameState | null;
  latency: number;
  error: string | null;
}

export interface UseWebSocketReturn {
  connection: GameConnection;
  connect: () => void;
  disconnect: () => void;
  joinGame: (gameId: string) => void;
  leaveGame: () => void;
  setReady: () => void;
  sendInput: (direction: "up" | "down" | "stop") => void;
}

// ============ Server Message Payloads ============

interface ConnectedPayload {
  userId: number;
  login: string;
}

interface JoinedPayload {
  gameId: string;
  playerIndex: 0 | 1;
  gameState: GameState;
}

interface PlayerJoinedPayload {
  playerIndex: 0 | 1;
  player: {
    id: number;
    login: string;
    displayName: string;
    paddle: Paddle;
    score: number;
    ready: boolean;
  };
}

interface PlayerLeftPayload {
  playerIndex: 0 | 1;
}

interface PlayerReadyPayload {
  playerIndex: 0 | 1;
  ready: boolean;
}

interface CountdownPayload {
  seconds: number;
}

interface StateUpdatePayload {
  ball: Ball;
  paddles: [Paddle, Paddle];
  timestamp: number;
}

interface ScorePayload {
  player1Score: number;
  player2Score: number;
  lastScorer: 0 | 1;
}

interface GameOverPayload {
  winnerId: number;
  winnerLogin: string;
  finalScore: [number, number];
}

interface ErrorPayload {
  code: string;
  message: string;
}

interface PongPayload {
  clientTimestamp: number;
  serverTimestamp: number;
}

interface ServerMessage {
  type: ServerMessageType;
  payload: unknown;
}

// ============ Hook ============

export function useWebSocket(): UseWebSocketReturn {
  const [connection, setConnection] = useState<GameConnection>({
    status: "disconnected",
    gameId: null,
    playerIndex: null,
    gameState: null,
    latency: 0,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up WebSocket connection
  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Send message to server
  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Start ping interval for latency measurement
  const startPing = useCallback(() => {
    pingIntervalRef.current = setInterval(() => {
      send({ type: "ping", timestamp: Date.now() });
    }, 2000);
  }, [send]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case "connected": {
          const payload = message.payload as ConnectedPayload;
          console.log(`WebSocket connected as ${payload.login}`);
          startPing();
          break;
        }

        case "joined": {
          const payload = message.payload as JoinedPayload;
          setConnection(prev => ({
            ...prev,
            gameId: payload.gameId,
            playerIndex: payload.playerIndex,
            gameState: payload.gameState,
          }));
          break;
        }

        case "left": {
          setConnection(prev => ({
            ...prev,
            gameId: null,
            playerIndex: null,
            gameState: null,
          }));
          break;
        }

        case "player_joined": {
          const payload = message.payload as PlayerJoinedPayload;
          setConnection(prev => {
            if (!prev.gameState) return prev;
            const newPlayers = [...prev.gameState.players] as [typeof prev.gameState.players[0], typeof prev.gameState.players[1]];
            newPlayers[payload.playerIndex] = payload.player;
            return {
              ...prev,
              gameState: {
                ...prev.gameState,
                players: newPlayers,
              },
            };
          });
          break;
        }

        case "player_left": {
          const payload = message.payload as PlayerLeftPayload;
          setConnection(prev => {
            if (!prev.gameState) return prev;
            const newPlayers = [...prev.gameState.players] as [typeof prev.gameState.players[0], typeof prev.gameState.players[1]];
            newPlayers[payload.playerIndex] = null;
            return {
              ...prev,
              gameState: {
                ...prev.gameState,
                players: newPlayers,
                status: "waiting",
              },
            };
          });
          break;
        }

        case "player_ready": {
          const payload = message.payload as PlayerReadyPayload;
          setConnection(prev => {
            if (!prev.gameState) return prev;
            const player = prev.gameState.players[payload.playerIndex];
            if (!player) return prev;
            const newPlayers = [...prev.gameState.players] as [typeof prev.gameState.players[0], typeof prev.gameState.players[1]];
            newPlayers[payload.playerIndex] = { ...player, ready: payload.ready };
            return {
              ...prev,
              gameState: {
                ...prev.gameState,
                players: newPlayers,
              },
            };
          });
          break;
        }

        case "countdown": {
          const payload = message.payload as CountdownPayload;
          setConnection(prev => {
            if (!prev.gameState) return prev;
            return {
              ...prev,
              gameState: {
                ...prev.gameState,
                status: payload.seconds > 0 ? "countdown" : "playing",
                countdown: payload.seconds,
              },
            };
          });
          break;
        }

        case "state_update": {
          const payload = message.payload as StateUpdatePayload;
          setConnection(prev => {
            if (!prev.gameState) return prev;
            const [p1, p2] = prev.gameState.players;
            if (!p1 || !p2) return prev;
            return {
              ...prev,
              gameState: {
                ...prev.gameState,
                ball: payload.ball,
                players: [
                  { ...p1, paddle: payload.paddles[0] },
                  { ...p2, paddle: payload.paddles[1] },
                ],
                updatedAt: payload.timestamp,
              },
            };
          });
          break;
        }

        case "score": {
          const payload = message.payload as ScorePayload;
          setConnection(prev => {
            if (!prev.gameState) return prev;
            const [p1, p2] = prev.gameState.players;
            if (!p1 || !p2) return prev;
            return {
              ...prev,
              gameState: {
                ...prev.gameState,
                players: [
                  { ...p1, score: payload.player1Score },
                  { ...p2, score: payload.player2Score },
                ],
              },
            };
          });
          break;
        }

        case "game_over": {
          const payload = message.payload as GameOverPayload;
          setConnection(prev => {
            if (!prev.gameState) return prev;
            return {
              ...prev,
              gameState: {
                ...prev.gameState,
                status: "finished",
                winner: payload.winnerId,
              },
            };
          });
          break;
        }

        case "error": {
          const payload = message.payload as ErrorPayload;
          console.error(`WebSocket error: ${payload.code} - ${payload.message}`);
          setConnection(prev => ({
            ...prev,
            error: payload.message,
          }));
          break;
        }

        case "pong": {
          const payload = message.payload as PongPayload;
          const latency = Date.now() - payload.clientTimestamp;
          setConnection(prev => ({
            ...prev,
            latency,
          }));
          break;
        }
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }, [startPing]);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    cleanup();

    setConnection(prev => ({
      ...prev,
      status: "connecting",
      error: null,
    }));

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnection(prev => ({
        ...prev,
        status: "connected",
        error: null,
      }));
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {
      console.error("WebSocket error");
      setConnection(prev => ({
        ...prev,
        status: "error",
        error: "Connection error",
      }));
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      cleanup();
      setConnection(prev => ({
        ...prev,
        status: "disconnected",
        gameId: null,
        playerIndex: null,
        gameState: null,
      }));
    };

    wsRef.current = ws;
  }, [cleanup, handleMessage]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    cleanup();
    setConnection({
      status: "disconnected",
      gameId: null,
      playerIndex: null,
      gameState: null,
      latency: 0,
      error: null,
    });
  }, [cleanup]);

  // Join a game room
  const joinGame = useCallback((gameId: string) => {
    send({ type: "join", gameId });
  }, [send]);

  // Leave current game
  const leaveGame = useCallback(() => {
    send({ type: "leave" });
  }, [send]);

  // Toggle ready state
  const setReady = useCallback(() => {
    send({ type: "ready" });
  }, [send]);

  // Send paddle input
  const sendInput = useCallback((direction: "up" | "down" | "stop") => {
    send({ type: "input", direction });
  }, [send]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    connection,
    connect,
    disconnect,
    joinGame,
    leaveGame,
    setReady,
    sendInput,
  };
}
