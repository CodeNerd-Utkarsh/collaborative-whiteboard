# Collaborative Whiteboard

A real-time collaborative whiteboard application built with React, TypeScript, and WebSockets. Multiple users can draw together on a shared canvas, communicate via live chat, and export their work.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=flat&logo=bootstrap&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Features

### Core
- **Real-time drawing** — Pen and eraser tools with customizable colors and brush sizes
- **Multi-user collaboration** — See other users' cursors and drawings in real-time
- **Session management** — Create new whiteboards or join existing ones via session ID
- **Undo / Redo** — Full history support with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- **Export** — Save the whiteboard as PNG image or PDF document
- **Secure authentication** — Keycloak-based login with OIDC + PKCE

### Bonus
- **Live chat** — Slide-out chat panel for in-session communication
- **Invite links** — Copy and share session URLs to invite collaborators
- **User preferences** — Tool settings persisted in localStorage

### UI/UX
- Professional dark-themed interface inspired by Microsoft Whiteboard
- Responsive design — works on desktop, tablet, and mobile
- Bootstrap 5.3 with custom design system
- Inter font, smooth animations, and glassmorphism effects
- Color-coded user cursors and avatars

---

## Tech Stack

| Layer          | Technology                                |
|----------------|-------------------------------------------|
| Frontend       | React 18 + TypeScript + Vite              |
| Drawing Engine | Konva.js + react-konva                    |
| Styling        | Bootstrap 5.3 + Custom CSS               |
| Real-time      | Socket.io (WebSocket)                     |
| Backend        | Node.js + Express + TypeScript            |
| Authentication | Keycloak 24 (via Docker)                  |
| Database       | PostgreSQL 16 (for Keycloak, via Docker)  |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (Vite :5173)              │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐  │
│  │ Auth    │  │ Canvas   │  │ Toolbar │  │ Chat  │  │
│  │ Context │  │ (Konva)  │  │         │  │ Panel │  │
│  └────┬────┘  └────┬─────┘  └─────────┘  └───┬───┘  │
│       │            │                          │      │
│       │     Socket.io Client                  │      │
└───────┼────────────┼──────────────────────────┼──────┘
        │            │                          │
    OIDC/PKCE    WebSocket                  WebSocket
        │            │                          │
┌───────┴───┐  ┌─────┴──────────────────────────┴─────┐
│ Keycloak  │  │      Backend (Express :5000)          │
│  (:8080)  │  │  ┌──────────┐  ┌──────────────────┐  │
│           │  │  │ Socket.io│  │ Session Manager  │  │
│           │  │  │  Server  │  │ (In-Memory)      │  │
└───────────┘  │  └──────────┘  └──────────────────┘  │
               │  JWT Verification via JWKS            │
               └───────────────────────────────────────┘
```

---

## Prerequisites

- **Node.js** v18+ and npm
- **Docker** and **Docker Compose**

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd collaborative-whiteboard
```

### 2. Start infrastructure (Keycloak + PostgreSQL)

```bash
docker compose up -d
```

Wait ~30 seconds for Keycloak to fully start, then verify at [http://localhost:8080](http://localhost:8080).

**Admin credentials:** `admin` / `admin`

The realm `whiteboard` and client `whiteboard-app` are auto-imported on first start.

### 3. Install and start the backend

```bash
cd server
npm install
npm run dev
```

Server starts at [http://localhost:5000](http://localhost:5000).

### 4. Install and start the frontend

```bash
cd client
npm install
npm run dev
```

App starts at [http://localhost:5173](http://localhost:5173).

### 5. Login

The app redirects to Keycloak login. Use one of the pre-configured test accounts:

| Username | Password   |
|----------|------------|
| `demo`   | `demo123`  |
| `alice`  | `alice123` |

Or register a new account — registration is enabled on the realm.

---

## Project Structure

```
collaborative-whiteboard/
├── docker-compose.yml          # Keycloak + PostgreSQL containers
├── keycloak/
│   └── realm-export.json       # Pre-configured realm for auto-import
├── server/                     # Backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # Express + Socket.io server entry
│       ├── types.ts            # Shared TypeScript interfaces
│       ├── sessionManager.ts   # In-memory session state management
│       └── socketHandlers.ts   # Socket event handlers
├── client/                     # Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env                    # Environment config
│   └── src/
│       ├── main.tsx            # App entry point
│       ├── App.tsx             # Router + auth gating
│       ├── config/
│       │   └── keycloak.ts     # Keycloak singleton config
│       ├── context/
│       │   ├── AuthContext.tsx  # Keycloak auth provider
│       │   ├── SocketContext.tsx # Socket.io client provider
│       │   └── WhiteboardContext.tsx # Drawing state management
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── Toolbar.tsx
│       │   ├── WhiteboardCanvas.tsx
│       │   ├── ChatPanel.tsx
│       │   ├── HomePage.tsx
│       │   └── WhiteboardPage.tsx
│       ├── hooks/
│       │   ├── useExport.ts    # PNG + PDF export logic
│       │   └── useLocalStorage.ts # Typed localStorage hook
│       └── styles/
│           └── index.css       # Design system + responsive styles
└── README.md
```

---

## Keyboard Shortcuts

| Shortcut       | Action        |
|----------------|---------------|
| `P`            | Select pen    |
| `E`            | Select eraser |
| `Ctrl + Z`     | Undo          |
| `Ctrl + Y`     | Redo          |

---

## Environment Variables

### Client (`.env`)

| Variable                   | Default                | Description             |
|----------------------------|------------------------|-------------------------|
| `VITE_KEYCLOAK_URL`        | `http://localhost:8080` | Keycloak server URL     |
| `VITE_KEYCLOAK_REALM`      | `whiteboard`           | Keycloak realm name     |
| `VITE_KEYCLOAK_CLIENT_ID`  | `whiteboard-app`       | OIDC client ID          |
| `VITE_SOCKET_URL`          | `http://localhost:5000` | Backend WebSocket URL   |

### Server (environment)

| Variable         | Default                | Description             |
|------------------|------------------------|-------------------------|
| `PORT`           | `5000`                 | Server port             |
| `CLIENT_URL`     | `http://localhost:5173` | Allowed CORS origin     |
| `KEYCLOAK_URL`   | `http://localhost:8080` | Keycloak server URL     |
| `KEYCLOAK_REALM` | `whiteboard`           | Keycloak realm name     |

---

## Keycloak Configuration

The realm is auto-imported from `keycloak/realm-export.json` with:

- **Realm:** `whiteboard`
- **Client:** `whiteboard-app` (Public, Standard Flow, PKCE S256)
- **Redirect URIs:** `http://localhost:5173/*`
- **Registration:** Enabled
- **Test users:** `demo`/`demo123`, `alice`/`alice123`

To access the Keycloak Admin Console: [http://localhost:8080/admin](http://localhost:8080/admin) with `admin`/`admin`.

---

## How It Works

### Session Flow
1. User logs in via Keycloak (OIDC with PKCE)
2. On the home page, user creates a new board or joins an existing one
3. The frontend connects to the Socket.io backend with the JWT token
4. Backend verifies the JWT against Keycloak's JWKS endpoint
5. User joins a Socket.io room identified by the session ID

### Real-time Sync
- **Drawing:** Mouse/touch events generate line data, emitted via Socket.io and broadcast to all room members
- **Cursors:** Mouse position is throttled and broadcast so other users see live cursor movement
- **Chat:** Messages are broadcast to the room and stored in session memory

### Undo/Redo
- Each completed line is pushed onto a local undo stack
- Undo removes the line and pushes it to the redo stack
- Both actions are synced via Socket.io to keep all clients consistent

---

## License

This project is for educational purposes.
