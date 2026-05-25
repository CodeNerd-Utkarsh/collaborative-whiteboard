/**
 * Authentication context using keycloak-js directly.
 * Handles initialization, login-required flow, and token refresh.
 * Compatible with React 18 StrictMode.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import keycloak from '../config/keycloak';

interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

interface AuthContextValue {
  authenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  authenticated: false,
  user: null,
  token: null,
  logout: () => {},
});

export const useAuth = (): AuthContextValue => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double-init in StrictMode
    if (initialized.current) return;
    initialized.current = true;

    keycloak
      .init({
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      })
      .then((auth) => {
        if (auth) {
          setAuthenticated(true);
          setToken(keycloak.token || null);

          const profile: AuthUser = {
            id: keycloak.tokenParsed?.sub || '',
            username: keycloak.tokenParsed?.preferred_username || '',
            firstName: keycloak.tokenParsed?.given_name || '',
            lastName: keycloak.tokenParsed?.family_name || '',
            email: keycloak.tokenParsed?.email || '',
            fullName:
              keycloak.tokenParsed?.name ||
              keycloak.tokenParsed?.preferred_username ||
              'User',
          };
          setUser(profile);

          // Set up token refresh
          setInterval(() => {
            keycloak
              .updateToken(70)
              .then((refreshed) => {
                if (refreshed) {
                  setToken(keycloak.token || null);
                }
              })
              .catch(() => {
                console.warn('Token refresh failed, logging out');
                keycloak.logout();
              });
          }, 60000);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Keycloak init failed:', err);
        setLoading(false);
      });
  }, []);

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-light fs-5">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authenticated, user, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
