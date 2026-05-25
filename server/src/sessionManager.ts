/**
 * In-memory session manager for whiteboard sessions.
 * Handles creation, joining, leaving, and state management.
 */

import { Session, SessionUser, DrawLine, ChatMessage } from './types';

class SessionManager {
  private sessions: Map<string, Session> = new Map();

  /**
   * Create a new whiteboard session.
   */
  createSession(id: string, name: string, createdBy: string): Session {
    const session: Session = {
      id,
      name,
      createdBy,
      createdAt: Date.now(),
      lines: [],
      chatMessages: [],
      users: new Map(),
    };
    this.sessions.set(id, session);
    return session;
  }

  /**
   * Retrieve a session by ID.
   */
  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  /**
   * Add a user to a session.
   */
  addUser(sessionId: string, user: SessionUser): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.users.set(user.socketId, user);
    return true;
  }

  /**
   * Remove a user from a session by socket ID.
   * Returns the removed user (if found) and whether the session is now empty.
   */
  removeUser(
    sessionId: string,
    socketId: string
  ): { user: SessionUser | undefined; isEmpty: boolean } {
    const session = this.sessions.get(sessionId);
    if (!session) return { user: undefined, isEmpty: true };

    const user = session.users.get(socketId);
    session.users.delete(socketId);

    const isEmpty = session.users.size === 0;

    // Auto-cleanup empty sessions after 5 minutes
    if (isEmpty) {
      setTimeout(() => {
        const s = this.sessions.get(sessionId);
        if (s && s.users.size === 0) {
          this.sessions.delete(sessionId);
        }
      }, 5 * 60 * 1000);
    }

    return { user, isEmpty };
  }

  /**
   * Add a drawing line to a session.
   */
  addLine(sessionId: string, line: DrawLine): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lines.push(line);
    }
  }

  /**
   * Update a line's points (during active drawing).
   */
  updateLinePoints(
    sessionId: string,
    lineId: string,
    points: number[]
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const line = session.lines.find((l) => l.id === lineId);
    if (line) {
      line.points = points;
    }
  }

  /**
   * Remove a line (for undo).
   */
  removeLine(sessionId: string, lineId: string): DrawLine | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    const idx = session.lines.findIndex((l) => l.id === lineId);
    if (idx !== -1) {
      return session.lines.splice(idx, 1)[0];
    }
    return undefined;
  }

  /**
   * Clear all lines in a session.
   */
  clearLines(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lines = [];
    }
  }

  /**
   * Add a chat message to a session.
   */
  addChatMessage(sessionId: string, message: ChatMessage): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.chatMessages.push(message);
      // Keep last 200 messages to prevent memory bloat
      if (session.chatMessages.length > 200) {
        session.chatMessages = session.chatMessages.slice(-200);
      }
    }
  }

  /**
   * Get all connected users in a session as an array.
   */
  getUsers(sessionId: string): SessionUser[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    return Array.from(session.users.values());
  }

  /**
   * Find which session a socket belongs to.
   */
  findSessionBySocket(socketId: string): string | undefined {
    for (const [sessionId, session] of this.sessions) {
      if (session.users.has(socketId)) {
        return sessionId;
      }
    }
    return undefined;
  }
}

export const sessionManager = new SessionManager();
