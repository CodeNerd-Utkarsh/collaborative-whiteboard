/**
 * Top navigation bar component.
 * Displays app branding, session info, connected users, and user controls.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWhiteboard } from '../context/WhiteboardContext';
import { useSocket } from '../context/SocketContext';

interface NavbarProps {
  onToggleChat?: () => void;
  unreadCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleChat, unreadCount = 0 }) => {
  const { user, logout } = useAuth();
  const { sessionId, sessionName, users } = useWhiteboard();
  const { connected } = useSocket();

  const handleCopyInvite = () => {
    if (sessionId) {
      const url = `${window.location.origin}/board/${sessionId}`;
      navigator.clipboard.writeText(url).then(() => {
        alert('Invite link copied to clipboard!');
      });
    }
  };

  return (
    <nav className="navbar navbar-dark wb-navbar px-3">
      <div className="d-flex align-items-center gap-3">
        {/* Brand */}
        <span className="navbar-brand d-flex align-items-center gap-2 mb-0">
          <i className="bi bi-easel2-fill fs-4"></i>
          <span className="fw-semibold d-none d-sm-inline">Whiteboard</span>
        </span>

        {/* Session info */}
        {sessionId && (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary bg-opacity-25 text-primary-emphasis px-2 py-1 d-none d-md-inline">
              {sessionName || 'Untitled'}
            </span>
            <span className="badge bg-secondary bg-opacity-25 text-light px-2 py-1 font-monospace" style={{ fontSize: '0.7rem' }}>
              #{sessionId}
            </span>
          </div>
        )}
      </div>

      <div className="d-flex align-items-center gap-2">
        {/* Connected users */}
        {sessionId && (
          <div className="d-flex align-items-center gap-1 me-2">
            {users.slice(0, 5).map((u) => (
              <div
                key={u.userId}
                className="wb-user-avatar"
                style={{ backgroundColor: u.color }}
                title={u.userName}
              >
                {u.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 5 && (
              <span className="text-light small ms-1">+{users.length - 5}</span>
            )}
          </div>
        )}

        {/* Invite link */}
        {sessionId && (
          <button
            className="btn btn-sm wb-btn-ghost"
            onClick={handleCopyInvite}
            title="Copy invite link"
          >
            <i className="bi bi-link-45deg"></i>
            <span className="d-none d-lg-inline ms-1">Invite</span>
          </button>
        )}

        {/* Chat toggle */}
        {sessionId && onToggleChat && (
          <button
            className="btn btn-sm wb-btn-ghost position-relative"
            onClick={onToggleChat}
            title="Toggle chat"
          >
            <i className="bi bi-chat-dots"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Connection status */}
        <div className="d-flex align-items-center gap-1 me-2">
          <div
            className={`wb-status-dot ${connected ? 'wb-status-online' : 'wb-status-offline'}`}
          />
          <span className="text-light small d-none d-lg-inline">
            {connected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* User menu */}
        <div className="dropdown">
          <button
            className="btn btn-sm wb-btn-ghost dropdown-toggle d-flex align-items-center gap-2"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <div className="wb-user-avatar wb-user-avatar-sm" style={{ backgroundColor: '#3b82f6' }}>
              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="d-none d-md-inline text-light">{user?.fullName || 'User'}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark">
            <li><span className="dropdown-item-text text-muted small">{user?.email}</span></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item" onClick={logout}>
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
