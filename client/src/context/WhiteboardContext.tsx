/**
 * Whiteboard state context.
 * Manages drawing lines, tool selection, colors, brush sizes,
 * undo/redo history, and session metadata.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { DrawLine, SessionUser, ChatMessage } from './SocketContext';
import type { Tool } from './SocketContext';

interface WhiteboardContextValue {
  /* Drawing state */
  lines: DrawLine[];
  setLines: React.Dispatch<React.SetStateAction<DrawLine[]>>;

  /* Tool settings */
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;

  /* Undo / Redo */
  undo: () => DrawLine | undefined;
  redo: () => DrawLine | undefined;
  canUndo: boolean;
  canRedo: boolean;
  pushToHistory: (line: DrawLine) => void;
  clearHistory: () => void;

  /* Session */
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  sessionName: string;
  setSessionName: (name: string) => void;
  users: SessionUser[];
  setUsers: React.Dispatch<React.SetStateAction<SessionUser[]>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const WhiteboardContext = createContext<WhiteboardContextValue | null>(null);

export const useWhiteboard = (): WhiteboardContextValue => {
  const ctx = useContext(WhiteboardContext);
  if (!ctx) throw new Error('useWhiteboard must be used within WhiteboardProvider');
  return ctx;
};

interface WhiteboardProviderProps {
  children: React.ReactNode;
}

export const WhiteboardProvider: React.FC<WhiteboardProviderProps> = ({ children }) => {
  /* Drawing state */
  const [lines, setLines] = useState<DrawLine[]>([]);

  /* Tool settings — restore from localStorage */
  const [tool, setToolState] = useState<Tool>(() => {
    return (localStorage.getItem('wb-tool') as Tool) || 'pen';
  });
  const [color, setColorState] = useState(() => {
    return localStorage.getItem('wb-color') || '#1e293b';
  });
  const [brushSize, setBrushSizeState] = useState(() => {
    return parseInt(localStorage.getItem('wb-brushSize') || '3', 10);
  });

  const setTool = useCallback((t: Tool) => {
    setToolState(t);
    localStorage.setItem('wb-tool', t);
  }, []);

  const setColor = useCallback((c: string) => {
    setColorState(c);
    localStorage.setItem('wb-color', c);
  }, []);

  const setBrushSize = useCallback((s: number) => {
    setBrushSizeState(s);
    localStorage.setItem('wb-brushSize', String(s));
  }, []);

  /* Undo / Redo stack */
  const undoStack = useRef<DrawLine[]>([]);
  const redoStack = useRef<DrawLine[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushToHistory = useCallback((line: DrawLine) => {
    undoStack.current.push(line);
    redoStack.current = []; // clear redo on new action
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback((): DrawLine | undefined => {
    const line = undoStack.current.pop();
    if (line) {
      redoStack.current.push(line);
      setLines((prev) => prev.filter((l) => l.id !== line.id));
      setCanRedo(true);
    }
    setCanUndo(undoStack.current.length > 0);
    return line;
  }, []);

  const redo = useCallback((): DrawLine | undefined => {
    const line = redoStack.current.pop();
    if (line) {
      undoStack.current.push(line);
      setLines((prev) => [...prev, line]);
      setCanUndo(true);
    }
    setCanRedo(redoStack.current.length > 0);
    return line;
  }, []);

  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  /* Session state */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const value: WhiteboardContextValue = {
    lines, setLines,
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    undo, redo, canUndo, canRedo, pushToHistory, clearHistory,
    sessionId, setSessionId,
    sessionName, setSessionName,
    users, setUsers,
    chatMessages, setChatMessages,
  };

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  );
};
