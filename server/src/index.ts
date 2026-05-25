/**
 * Main entry point for the collaborative whiteboard backend.
 * Sets up Express, Socket.io, and JWT authentication.
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types';
import { registerSocketHandlers } from './socketHandlers';

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'whiteboard';

const JWKS_URI = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;

/* ------------------------------------------------------------------ */
/*  JWKS Client for token verification                                 */
/* ------------------------------------------------------------------ */

const jwks = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwks.getSigningKey(kid, (err, key) => {
      if (err || !key) {
        reject(err || new Error('No signing key found'));
        return;
      }
      resolve(key.getPublicKey());
    });
  });
}

interface KeycloakToken {
  sub: string;
  preferred_username?: string;
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

async function verifyToken(token: string): Promise<KeycloakToken> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header.kid) {
    throw new Error('Invalid token structure');
  }

  const publicKey = await getSigningKey(decoded.header.kid);

  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      publicKey,
      {
        algorithms: ['RS256'],
        issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
      },
      (err, payload) => {
        if (err) reject(err);
        else resolve(payload as KeycloakToken);
      }
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Express & HTTP Server                                              */
/* ------------------------------------------------------------------ */

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);

/* ------------------------------------------------------------------ */
/*  Socket.io Server                                                   */
/* ------------------------------------------------------------------ */

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Authentication middleware — verify JWT on every connection
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const payload = await verifyToken(token);

    socket.data.userId = payload.sub;
    socket.data.userName =
      payload.preferred_username ||
      payload.name ||
      payload.given_name ||
      'Anonymous';

    next();
  } catch (err) {
    console.error('Socket auth failed:', err);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(
    `User connected: ${socket.data.userName} (${socket.id})`
  );
  registerSocketHandlers(io, socket);
});

/* ------------------------------------------------------------------ */
/*  Start Server                                                       */
/* ------------------------------------------------------------------ */

server.listen(PORT, () => {
  console.log(`\n🚀 Whiteboard server running on http://localhost:${PORT}`);
  console.log(`📡 JWKS URI: ${JWKS_URI}`);
  console.log(`🌐 Client URL: ${CLIENT_URL}\n`);
});
