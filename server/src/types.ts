/**
 * Shared TypeScript interfaces for the collaborative whiteboard.
 * Used by both socket handlers and session manager.
 */

/* ------------------------------------------------------------------ */
/*  Drawing Types                                                      */
/* ------------------------------------------------------------------ */

export type Tool = 'pen' | 'eraser';

export interface DrawLine {
  id: string;
  tool: Tool;
  points: number[];
  stroke: string;
  strokeWidth: number;
  userId: string;
  userName: string;
}

/* ------------------------------------------------------------------ */
/*  Cursor / Presence                                                  */
/* ------------------------------------------------------------------ */

export interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Chat                                                               */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  Session                                                            */
/* ------------------------------------------------------------------ */

export interface SessionUser {
  userId: string;
  userName: string;
  color: string;
  socketId: string;
}

export interface Session {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  lines: DrawLine[];
  chatMessages: ChatMessage[];
  users: Map<string, SessionUser>;
}

/* ------------------------------------------------------------------ */
/*  Socket.io Typed Events                                             */
/* ------------------------------------------------------------------ */

export interface ServerToClientEvents {
  'session-state': (data: {
    lines: DrawLine[];
    chatMessages: ChatMessage[];
    users: SessionUser[];
  }) => void;
  'user-joined': (user: SessionUser) => void;
  'user-left': (userId: string) => void;
  'draw-line': (line: DrawLine) => void;
  'draw-update': (data: { lineId: string; points: number[] }) => void;
  'draw-end': (data: { lineId: string; points: number[] }) => void;
  'undo': (data: { userId: string; lineId: string }) => void;
  'redo': (data: { userId: string; line: DrawLine }) => void;
  'clear-canvas': () => void;
  'cursor-move': (cursor: CursorPosition) => void;
  'chat-message': (message: ChatMessage) => void;
  'session-created': (data: { sessionId: string; sessionName: string }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'create-session': (data: { sessionName: string }) => void;
  'join-session': (data: { sessionId: string }) => void;
  'leave-session': () => void;
  'draw-line': (line: DrawLine) => void;
  'draw-update': (data: { lineId: string; points: number[] }) => void;
  'draw-end': (data: { lineId: string; points: number[] }) => void;
  'undo': (data: { lineId: string }) => void;
  'redo': (data: { line: DrawLine }) => void;
  'clear-canvas': () => void;
  'cursor-move': (cursor: Omit<CursorPosition, 'userId' | 'userName'>) => void;
  'chat-message': (data: { text: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userName: string;
  sessionId?: string;
  color: string;
}
