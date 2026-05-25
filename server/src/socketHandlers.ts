/**
 * Socket.io event handlers for real-time whiteboard collaboration.
 */

import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  ChatMessage,
  SessionUser,
} from './types';
import { sessionManager } from './sessionManager';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/** Palette of cursor colors assigned to users. */
const CURSOR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
  '#6366F1', '#14B8A6', '#E11D48', '#84CC16',
];

let colorIndex = 0;

function getNextColor(): string {
  const color = CURSOR_COLORS[colorIndex % CURSOR_COLORS.length];
  colorIndex++;
  return color;
}

/**
 * Register all socket event handlers on a connected socket.
 */
export function registerSocketHandlers(
  io: TypedServer,
  socket: TypedSocket
): void {
  const userId = socket.data.userId;
  const userName = socket.data.userName;
  const userColor = getNextColor();
  socket.data.color = userColor;

  /* -------------------------------------------------------------- */
  /*  Session Management                                             */
  /* -------------------------------------------------------------- */

  socket.on('create-session', ({ sessionName }) => {
    const sessionId = uuidv4().slice(0, 8);
    sessionManager.createSession(sessionId, sessionName, userId);

    const user: SessionUser = {
      userId,
      userName,
      color: userColor,
      socketId: socket.id,
    };
    sessionManager.addUser(sessionId, user);

    socket.data.sessionId = sessionId;
    socket.join(sessionId);

    socket.emit('session-created', { sessionId, sessionName });
    socket.emit('session-state', {
      lines: [],
      chatMessages: [],
      users: [user],
    });
  });

  socket.on('join-session', ({ sessionId }) => {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    const user: SessionUser = {
      userId,
      userName,
      color: userColor,
      socketId: socket.id,
    };
    sessionManager.addUser(sessionId, user);

    socket.data.sessionId = sessionId;
    socket.join(sessionId);

    // Send existing state to the joining user
    socket.emit('session-state', {
      lines: session.lines,
      chatMessages: session.chatMessages,
      users: sessionManager.getUsers(sessionId),
    });

    // Notify others in the room
    socket.to(sessionId).emit('user-joined', user);
  });

  socket.on('leave-session', () => {
    handleLeaveSession(io, socket);
  });

  /* -------------------------------------------------------------- */
  /*  Drawing Events                                                  */
  /* -------------------------------------------------------------- */

  socket.on('draw-line', (line) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) return;

    sessionManager.addLine(sessionId, line);
    socket.to(sessionId).emit('draw-line', line);
  });

  socket.on('draw-update', (data) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) return;

    sessionManager.updateLinePoints(sessionId, data.lineId, data.points);
    socket.to(sessionId).emit('draw-update', data);
  });

  socket.on('draw-end', (data) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) return;

    sessionManager.updateLinePoints(sessionId, data.lineId, data.points);
    socket.to(sessionId).emit('draw-end', data);
  });

  /* -------------------------------------------------------------- */
  /*  Undo / Redo                                                     */
  /* -------------------------------------------------------------- */

  socket.on('undo', ({ lineId }) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) return;

    sessionManager.removeLine(sessionId, lineId);
    socket.to(sessionId).emit('undo', { userId, lineId });
  });

  socket.on('redo', ({ line }) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) return;

    sessionManager.addLine(sessionId, line);
    socket.to(sessionId).emit('redo', { userId, line });
  });

  socket.on('clear-canvas', () => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) return;

    sessionManager.clearLines(sessionId);
    socket.to(sessionId).emit('clear-canvas');
  });

  /* -------------------------------------------------------------- */
  /*  Cursor Tracking                                                 */
  /* -------------------------------------------------------------- */

  socket.on('cursor-move', (cursor) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) return;

    socket.to(sessionId).emit('cursor-move', {
      ...cursor,
      userId,
      userName,
      color: userColor,
    });
  });

  /* -------------------------------------------------------------- */
  /*  Chat                                                            */
  /* -------------------------------------------------------------- */

  socket.on('chat-message', ({ text }) => {
    const sessionId = socket.data.sessionId;
    if (!sessionId) return;

    const message: ChatMessage = {
      id: uuidv4(),
      userId,
      userName,
      text,
      timestamp: Date.now(),
    };

    sessionManager.addChatMessage(sessionId, message);
    io.to(sessionId).emit('chat-message', message);
  });

  /* -------------------------------------------------------------- */
  /*  Disconnect                                                      */
  /* -------------------------------------------------------------- */

  socket.on('disconnect', () => {
    handleLeaveSession(io, socket);
    console.log(`User disconnected: ${userName} (${socket.id})`);
  });
}

/**
 * Handle a user leaving their current session.
 */
function handleLeaveSession(io: TypedServer, socket: TypedSocket): void {
  const sessionId = socket.data.sessionId;
  if (!sessionId) return;

  const { user } = sessionManager.removeUser(sessionId, socket.id);
  if (user) {
    socket.to(sessionId).emit('user-left', user.userId);
  }

  socket.leave(sessionId);
  socket.data.sessionId = undefined;
}
