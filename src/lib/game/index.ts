/**
 * Game module exports
 */

export * from "./types";
export * from "./engine";
export { websocketHandlers, findOrCreateQuickMatch, getGameRoomsInfo, type WebSocketData } from "./server";
// Client-side exports (only import in browser context)
export { useWebSocket, type UseWebSocketReturn, type GameConnection, type ConnectionStatus } from "./useWebSocket";
