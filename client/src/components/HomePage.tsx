import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface RecentSession {
  id: string;
  name: string;
  joinedAt: number;
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionName, setSessionName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [recentSessions] = useLocalStorage<RecentSession[]>('wb-recent-sessions', []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = sessionName.trim() || 'Untitled Board';
    navigate(`/board/new?name=${encodeURIComponent(name)}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) return;
    // Support full URLs or just IDs
    const match = id.match(/\/board\/([a-zA-Z0-9-]+)/);
    const sessionId = match ? match[1] : id;
    navigate(`/board/${sessionId}`);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="wb-home">
      <div className="wb-home-bg" />
      <div className="container py-5 position-relative">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="wb-home-icon mb-3">
            <i className="bi bi-easel2-fill"></i>
          </div>
          <h1 className="fw-bold text-white mb-2">
            {greeting()}, {user?.firstName || 'there'}
          </h1>
          <p className="text-light opacity-75 fs-5">
            Start collaborating on a whiteboard in real-time
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {/* Create New */}
          <div className="col-12 col-md-5">
            <div className="wb-card wb-card-create">
              <div className="wb-card-icon">
                <i className="bi bi-plus-circle-fill"></i>
              </div>
              <h3 className="fw-semibold mb-2">Create New Board</h3>
              <p className="text-muted small mb-4">
                Start a fresh whiteboard and invite others to collaborate
              </p>
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control wb-input"
                    placeholder="Board name (optional)"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <button type="submit" className="btn wb-btn-primary w-100">
                  <i className="bi bi-plus-lg me-2"></i>
                  Create Whiteboard
                </button>
              </form>
            </div>
          </div>

          {/* Join Existing */}
          <div className="col-12 col-md-5">
            <div className="wb-card wb-card-join">
              <div className="wb-card-icon wb-card-icon-secondary">
                <i className="bi bi-box-arrow-in-right"></i>
              </div>
              <h3 className="fw-semibold mb-2">Join a Board</h3>
              <p className="text-muted small mb-4">
                Enter a session ID or paste an invite link to join
              </p>
              <form onSubmit={handleJoin}>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control wb-input"
                    placeholder="Session ID or invite link"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn wb-btn-secondary w-100">
                  <i className="bi bi-arrow-right-circle me-2"></i>
                  Join Whiteboard
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="mt-5">
            <h5 className="text-light mb-3">
              <i className="bi bi-clock-history me-2"></i>Recent Sessions
            </h5>
            <div className="row g-3">
              {recentSessions.slice(0, 6).map((session) => (
                <div key={session.id} className="col-12 col-sm-6 col-md-4">
                  <button
                    className="wb-recent-card w-100"
                    onClick={() => navigate(`/board/${session.id}`)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="wb-recent-icon">
                        <i className="bi bi-easel"></i>
                      </div>
                      <div className="text-start">
                        <div className="fw-medium">{session.name}</div>
                        <div className="text-muted small">
                          #{session.id} · {new Date(session.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
