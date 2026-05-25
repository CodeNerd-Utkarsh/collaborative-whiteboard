import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Konva from 'konva';
import { useSocket } from '../context/SocketContext';
import { useWhiteboard } from '../context/WhiteboardContext';
import { useAuth } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Navbar from './Navbar';
import Toolbar from './Toolbar';
import WhiteboardCanvas from './WhiteboardCanvas';
import ChatPanel from './ChatPanel';
import type { DrawLine, SessionUser, ChatMessage } from '../context/SocketContext';

interface RecentSession {
  id: string;
  name: string;
  joinedAt: number;
}

const WhiteboardPage: React.FC = () => {
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const {
    setLines, setSessionId, setSessionName,
    setUsers, setChatMessages, setTool, clearHistory,
  } = useWhiteboard();

  const stageRef = useRef<Konva.Stage | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [, setRecentSessions] = useLocalStorage<RecentSession[]>('wb-recent-sessions', []);

  const handleNewMessage = useCallback(() => {
    if (!chatOpen) setUnreadCount((prev) => prev + 1);
  }, [chatOpen]);

  const toggleChat = useCallback(() => {
    setChatOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  // Join or create session on mount
  useEffect(() => {
    if (!socket || !connected || joined) return;

    const isNew = urlSessionId === 'new';
    const sessionName = searchParams.get('name') || 'Untitled Board';

    const handleSessionCreated = (data: { sessionId: string; sessionName: string }) => {
      setSessionId(data.sessionId);
      setSessionName(data.sessionName);
      setJoined(true);
      navigate(`/board/${data.sessionId}`, { replace: true });

      setRecentSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== data.sessionId);
        return [{ id: data.sessionId, name: data.sessionName, joinedAt: Date.now() }, ...filtered].slice(0, 10);
      });
    };

    const handleSessionState = (data: {
      lines: DrawLine[];
      chatMessages: ChatMessage[];
      users: SessionUser[];
    }) => {
      setLines(data.lines);
      setChatMessages(data.chatMessages);
      setUsers(data.users);
      clearHistory();
      if (!isNew) setJoined(true);
    };

    const handleError = (data: { message: string }) => {
      alert(`Error: ${data.message}`);
      navigate('/');
    };

    const handleUserJoined = (u: SessionUser) => {
      setUsers((prev) => [...prev.filter((x) => x.userId !== u.userId), u]);
    };

    const handleUserLeft = (userId: string) => {
      setUsers((prev) => prev.filter((x) => x.userId !== userId));
    };

    socket.on('session-created', handleSessionCreated);
    socket.on('session-state', handleSessionState);
    socket.on('error', handleError);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    if (isNew) {
      socket.emit('create-session', { sessionName });
    } else if (urlSessionId) {
      setSessionId(urlSessionId);
      setSessionName('');
      socket.emit('join-session', { sessionId: urlSessionId });

      setRecentSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== urlSessionId);
        return [{ id: urlSessionId, name: 'Board', joinedAt: Date.now() }, ...filtered].slice(0, 10);
      });
    }

    return () => {
      socket.off('session-created', handleSessionCreated);
      socket.off('session-state', handleSessionState);
      socket.off('error', handleError);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, connected, joined, urlSessionId, searchParams, navigate,
    setLines, setSessionId, setSessionName, setUsers, setChatMessages,
    clearHistory, setRecentSessions]);

  // Leave session on unmount
  useEffect(() => {
    return () => {
      socket?.emit('leave-session');
      setSessionId(null);
      setLines([]);
      setChatMessages([]);
      setUsers([]);
    };
  }, [socket, setSessionId, setLines, setChatMessages, setUsers]);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (e.key === 'p') setTool('pen');
      if (e.key === 'e') setTool('eraser');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setTool]);

  // Undo/redo keyboard events
  useEffect(() => {
    const handleUndo = () => {
      document.querySelector<HTMLButtonElement>('[title="Undo (Ctrl+Z)"]')?.click();
    };
    const handleRedo = () => {
      document.querySelector<HTMLButtonElement>('[title="Redo (Ctrl+Y)"]')?.click();
    };
    document.addEventListener('wb-undo', handleUndo);
    document.addEventListener('wb-redo', handleRedo);
    return () => {
      document.removeEventListener('wb-undo', handleUndo);
      document.removeEventListener('wb-redo', handleRedo);
    };
  }, []);

  const handleClearCanvas = () => {
    if (window.confirm('Clear the entire canvas? This cannot be undone.')) {
      setLines([]);
      clearHistory();
      socket?.emit('clear-canvas');
    }
  };

  if (!connected) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-light">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wb-layout">
      <Navbar
        onToggleChat={toggleChat}
        unreadCount={unreadCount}
      />
      <div className="wb-main">
        <Toolbar stageRef={stageRef} onClearCanvas={handleClearCanvas} />
        <WhiteboardCanvas stageRef={stageRef} />
        <ChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          onNewMessage={handleNewMessage}
        />
      </div>
    </div>
  );
};

export default WhiteboardPage;
