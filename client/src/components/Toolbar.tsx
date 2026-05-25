/**
 * Drawing toolbar component.
 * Provides tool selection, color picker, brush size, undo/redo, and export controls.
 * Positioned as a left sidebar on desktop, bottom bar on mobile.
 */

import React, { useRef } from 'react';
import Konva from 'konva';
import { useWhiteboard } from '../context/WhiteboardContext';
import { useSocket } from '../context/SocketContext';
import { useExport } from '../hooks/useExport';

/** Curated color palette */
const COLOR_PALETTE = [
  '#1e293b', '#475569', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#ffffff', '#000000',
];

/** Brush size presets */
const BRUSH_SIZES = [2, 4, 8, 14, 22];

interface ToolbarProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  onClearCanvas: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ stageRef, onClearCanvas }) => {
  const {
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    undo, redo,
    canUndo, canRedo,
  } = useWhiteboard();
  const { socket } = useSocket();
  const { saveAsImage, saveAsPDF } = useExport();
  const customColorRef = useRef<HTMLInputElement>(null);

  const handleUndo = () => {
    const line = undo();
    if (line && socket) {
      socket.emit('undo', { lineId: line.id });
    }
  };

  const handleRedo = () => {
    const line = redo();
    if (line && socket) {
      socket.emit('redo', { line });
    }
  };

  const handleSaveImage = () => {
    if (stageRef.current) {
      saveAsImage(stageRef.current);
    }
  };

  const handleSavePDF = () => {
    if (stageRef.current) {
      saveAsPDF(stageRef.current);
    }
  };

  const handleCustomColor = () => {
    customColorRef.current?.click();
  };

  return (
    <div className="wb-toolbar">
      {/* Tools Section */}
      <div className="wb-toolbar-section">
        <span className="wb-toolbar-label">Tools</span>
        <div className="wb-toolbar-group">
          <button
            className={`wb-tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen (P)"
          >
            <i className="bi bi-pencil-fill"></i>
          </button>
          <button
            className={`wb-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser (E)"
          >
            <i className="bi bi-eraser-fill"></i>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="wb-toolbar-divider" />

      {/* Colors Section */}
      <div className="wb-toolbar-section">
        <span className="wb-toolbar-label">Color</span>
        <div className="wb-color-grid">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              className={`wb-color-swatch ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
          <button
            className="wb-color-swatch wb-color-custom"
            onClick={handleCustomColor}
            title="Custom color"
          >
            <i className="bi bi-plus"></i>
          </button>
        </div>
        <input
          ref={customColorRef}
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="d-none"
        />
      </div>

      {/* Divider */}
      <div className="wb-toolbar-divider" />

      {/* Brush Size */}
      <div className="wb-toolbar-section">
        <span className="wb-toolbar-label">Size</span>
        <div className="wb-brush-sizes">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              className={`wb-brush-btn ${brushSize === size ? 'active' : ''}`}
              onClick={() => setBrushSize(size)}
              title={`${size}px`}
            >
              <div
                className="wb-brush-preview"
                style={{
                  width: Math.min(size + 4, 24),
                  height: Math.min(size + 4, 24),
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="wb-toolbar-divider" />

      {/* Actions */}
      <div className="wb-toolbar-section">
        <span className="wb-toolbar-label">Actions</span>
        <div className="wb-toolbar-group">
          <button
            className="wb-tool-btn"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
          <button
            className="wb-tool-btn"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
          <button
            className="wb-tool-btn wb-tool-btn-danger"
            onClick={onClearCanvas}
            title="Clear canvas"
          >
            <i className="bi bi-trash3"></i>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="wb-toolbar-divider" />

      {/* Export */}
      <div className="wb-toolbar-section">
        <span className="wb-toolbar-label">Export</span>
        <div className="wb-toolbar-group">
          <button
            className="wb-tool-btn"
            onClick={handleSaveImage}
            title="Save as PNG"
          >
            <i className="bi bi-image"></i>
          </button>
          <button
            className="wb-tool-btn"
            onClick={handleSavePDF}
            title="Save as PDF"
          >
            <i className="bi bi-file-pdf"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
