/**
 * Main whiteboard canvas component using react-konva.
 * Handles drawing, cursor tracking, and rendering of all lines and remote cursors.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Circle, Text, Group } from 'react-konva';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import { useWhiteboard } from '../context/WhiteboardContext';
import { useSocket, CursorPosition, DrawLine } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface WhiteboardCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ stageRef }) => {
  const {
    lines, setLines,
    tool, color, brushSize,
    pushToHistory,
  } = useWhiteboard();
  const { socket } = useSocket();
  const { user } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const currentLineId = useRef<string>('');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());

  /* ---------------------------------------------------------------- */
  /*  Responsive canvas sizing                                         */
  /* ---------------------------------------------------------------- */

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  /* ---------------------------------------------------------------- */
  /*  Socket event listeners                                           */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!socket) return;

    const handleRemoteDraw = (line: DrawLine) => {
      setLines((prev) => [...prev, line]);
    };

    const handleRemoteUpdate = (data: { lineId: string; points: number[] }) => {
      setLines((prev) =>
        prev.map((l) =>
          l.id === data.lineId ? { ...l, points: data.points } : l
        )
      );
    };

    const handleRemoteEnd = (data: { lineId: string; points: number[] }) => {
      setLines((prev) =>
        prev.map((l) =>
          l.id === data.lineId ? { ...l, points: data.points } : l
        )
      );
    };

    const handleCursorMove = (cursor: CursorPosition) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(cursor.userId, cursor);
        return next;
      });
    };

    const handleUndo = (data: { userId: string; lineId: string }) => {
      setLines((prev) => prev.filter((l) => l.id !== data.lineId));
    };

    const handleRedo = (data: { userId: string; line: DrawLine }) => {
      setLines((prev) => [...prev, data.line]);
    };

    const handleClear = () => {
      setLines([]);
    };

    const handleUserLeft = (userId: string) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('draw-line', handleRemoteDraw);
    socket.on('draw-update', handleRemoteUpdate);
    socket.on('draw-end', handleRemoteEnd);
    socket.on('cursor-move', handleCursorMove);
    socket.on('undo', handleUndo);
    socket.on('redo', handleRedo);
    socket.on('clear-canvas', handleClear);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('draw-line', handleRemoteDraw);
      socket.off('draw-update', handleRemoteUpdate);
      socket.off('draw-end', handleRemoteEnd);
      socket.off('cursor-move', handleCursorMove);
      socket.off('undo', handleUndo);
      socket.off('redo', handleRedo);
      socket.off('clear-canvas', handleClear);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, setLines]);

  /* ---------------------------------------------------------------- */
  /*  Drawing handlers                                                 */
  /* ---------------------------------------------------------------- */

  const getPointerPosition = (stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    return pos || { x: 0, y: 0 };
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    isDrawing.current = true;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getPointerPosition(stage);

    const lineId = uuidv4();
    currentLineId.current = lineId;

    const newLine: DrawLine = {
      id: lineId,
      tool,
      points: [pos.x, pos.y],
      stroke: tool === 'eraser' ? '#ffffff' : color,
      strokeWidth: tool === 'eraser' ? brushSize * 3 : brushSize,
      userId: user?.id || '',
      userName: user?.username || '',
    };

    setLines((prev) => [...prev, newLine]);
    socket?.emit('draw-line', newLine);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getPointerPosition(stage);

    // Emit cursor position
    socket?.emit('cursor-move', { x: pos.x, y: pos.y, color: '#3b82f6' });

    if (!isDrawing.current) return;

    setLines((prev) => {
      const lastLine = prev.find((l) => l.id === currentLineId.current);
      if (!lastLine) return prev;

      const newPoints = [...lastLine.points, pos.x, pos.y];

      // Emit update
      socket?.emit('draw-update', {
        lineId: currentLineId.current,
        points: newPoints,
      });

      return prev.map((l) =>
        l.id === currentLineId.current ? { ...l, points: newPoints } : l
      );
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const finishedLine = lines.find((l) => l.id === currentLineId.current);
    if (finishedLine) {
      pushToHistory(finishedLine);
      socket?.emit('draw-end', {
        lineId: currentLineId.current,
        points: finishedLine.points,
      });
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Keyboard shortcuts                                               */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        // Trigger undo via toolbar context
        document.dispatchEvent(new CustomEvent('wb-undo'));
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('wb-redo'));
      }
      if (e.key === 'p' || e.key === 'P') {
        if (!e.ctrlKey && !e.metaKey) {
          const el = document.activeElement;
          if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
          // No action needed — tool shortcut handled in WhiteboardPage
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div ref={containerRef} className="wb-canvas-container">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        className="wb-stage"
      >
        <Layer>
          {/* Draw all lines */}
          {lines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}

          {/* Remote cursors */}
          {Array.from(cursors.values())
            .filter((c) => c.userId !== user?.id)
            .map((cursor) => (
              <Group key={cursor.userId} x={cursor.x} y={cursor.y}>
                <Circle
                  radius={6}
                  fill={cursor.color}
                  opacity={0.8}
                />
                <Text
                  text={cursor.userName}
                  fontSize={11}
                  fontFamily="Inter, sans-serif"
                  fill={cursor.color}
                  x={10}
                  y={-6}
                  padding={2}
                />
              </Group>
            ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default WhiteboardCanvas;
