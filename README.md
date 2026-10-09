# PULSE DEV — Game Dev Mechanics & Task Control

<p align="center">
  <img src="docs/images/disposal_log_logo.png" alt="PULSE Logo" width="160" style="border-radius: 50%;">
</p>

<p align="center">
  <b>PULSE DEV</b> is a modern, high-performance Kanban task manager designed for game developers, indie creators, and tech teams to track game mechanics, gameplay features, and development sprints.
</p>

---

## ⚡ Key Features

- **🌐 Google & GitHub OAuth 2.0 Multi-User System**: Sign in with 1 click, featuring isolated personal task boards and DB session tokens.
- **🎮 GameDev Native Video & Media Support**: Attach `.mp4`, `.webm` videos, GIFs, and screenshots to tasks. Game mechanics autoplay directly on card banners.
- **📦 3D Physical Card Stacking**: Drag cards onto each other to group related sub-mechanics into physical card stacks without cluttering board columns.
- **🤖 Automated Telegram Integration**: Instant automated reports sent to your Telegram channel when tasks are completed or updated, with customizable HTML templates.
- **💾 Automatic Database & Volume Storage**: Persistent SQLite storage and automated backups for Railway Cloud & local deployment.
- **📱 Mobile Responsive Drawer & Tab System**: Fluid touch navigation, mobile drawer sidebar, and sticky 1-touch column switching.
- **🎨 GitHub Dark Theme Integration**: Extracted design system styling inspired by GitHub's Dark UI.

---

## 🛠️ Tech Stack

- **Backend**: Node.js 20 LTS, Express 5, SQLite3, OAuth 2.0 (Google & GitHub), Multer (uploads), Telegraf (Telegram Bot API)
- **Frontend**: React 18 + Vite, React Flow (diagrams), GitHub Dark Design System

---

## 🚀 Quickstart & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/themaximus/disposal-log.git
cd disposal-log
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the root directory:
```env
PORT=3000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Run Application
```bash
npm run build   # builds the React app into dist/ (also runs on npm install)
npm start       # serves API + dist/ on http://localhost:3000
```

For frontend development run `npm start` and `npm run dev` side by side: Vite serves the UI on
`http://localhost:5173` and proxies `/api` to the backend.

---

## 🗂️ Project Structure

```
server.js                 entrypoint: DB schema init, HTTP server, graceful shutdown
src/
  app.js                  express app (middleware, /api, static frontend, SPA fallback)
  config.js               env + paths (DATA_DIR / RAILWAY_VOLUME_MOUNT_PATH)
  db/                     sqlite connection (promise API, transactions) and schema migrations
  middleware/             session auth, uploads, error handler
  repositories/           SQL per table
  services/               business logic (auth/OAuth, boards & sharing, tasks, settings, maintenance)
  routes/                 HTTP routes, mounted under /api
frontend/src/
  api/                    fetch client + endpoint modules
  hooks/                  app state (auth, navigation, modals, board workspace, drag & drop, diagrams)
  components/, modals/    UI
  services/, utils/       Google Drive, diagram sync, offline storage, helpers
```

---

## 📄 License
ISC License
