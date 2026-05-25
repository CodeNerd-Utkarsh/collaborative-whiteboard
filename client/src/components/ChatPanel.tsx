/**
 * Live chat panel component.
 * Slide-out panel for real-time messaging during whiteboard sessions.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useWhiteboard } from '../context/WhiteboardContext';
import { useSocket, ChatMessage } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, onNewMessage }) => {
  const { chatMessages, setChatMessages } = useWhiteboard();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    const handleMsg = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
      if (msg.userId !== user?.id) onNewMessage();
    };
    socket.on('chat-message', handleMsg);
    return () => { socket.off('chat-message', handleMsg); };
  }, [socket, setChatMessages, user, onNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;
    socket.emit('chat-message', { text: message.trim() });
    setMessage('');
  };

  const fmt = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`wb-chat-panel ${isOpen ? 'open' : ''}`}>
      <div className="wb-chat-header">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-chat-dots-fill"></i>
          <span className="fw-semibold">Chat</span>
        </div>
        <button className="btn btn-sm wb-btn-ghost" onClick={onClose}><i className="bi bi-x-lg"></i></button>
      </div>
      <div className="wb-chat-messages">
        {chatMessages.length === 0 && (
          <div className="text-center text-muted py-5">
            <i className="bi bi-chat-square-text fs-1 d-block mb-2 opacity-50"></i>
            <p className="small">No messages yet.</p>
          </div>
        )}
        {chatMessages.map((msg) => {
          const isOwn = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`wb-chat-message ${isOwn ? 'own' : ''}`}>
              {!isOwn && <span className="wb-chat-sender">{msg.userName}</span>}
              <div className={`wb-chat-bubble ${isOwn ? 'own' : ''}`}>{msg.text}</div>
              <span className="wb-chat-time">{fmt(msg.timestamp)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form className="wb-chat-input" onSubmit={handleSend}>
        <input type="text" className="form-control form-control-sm" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!message.trim()}><i className="bi bi-send-fill"></i></button>
      </form>
    </div>
  );
};

export default ChatPanel;
