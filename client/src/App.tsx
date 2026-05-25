import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { WhiteboardProvider } from './context/WhiteboardContext';
import HomePage from './components/HomePage';
import WhiteboardPage from './components/WhiteboardPage';

const App: React.FC = () => {
  const { authenticated } = useAuth();

  if (!authenticated) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-light">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <WhiteboardProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/board/:sessionId" element={<WhiteboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WhiteboardProvider>
    </BrowserRouter>
  );
};

export default App;
