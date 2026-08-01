# PULSE DEV — Game Dev Mechanics & Task Control

<p align="center">
  <img src="public/images/disposal_log_logo.png" alt="PULSE Logo" width="160" style="border-radius: 50%;">
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

- **Backend**: Node.js 20 LTS, Express 5, SQLite3, OAuth 2.0 (Google & GitHub), Multer (Media Storage), Telegraf (Telegram Bot API)
- **Frontend**: Native Vanilla JS, HTML5, CSS3, GitHub Dark Design System

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
node server.js
```
Open `http://localhost:3000` in your web browser.

---

## 📄 License
ISC License
