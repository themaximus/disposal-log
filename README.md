# DISPOSAL LOG — Game Dev Mechanics Task Manager

<p align="center">
  <img src="public/images/disposal_log_logo.png" alt="DISPOSAL LOG Logo" width="160" style="border-radius: 50%;">
</p>

<p align="center">
  <b>DISPOSAL LOG</b> is a specialized Kanban task manager designed for indie developers and game dev studios to track game mechanics, gameplay features, and development tasks.
</p>

---

## ⚡ Key Features

- **🎮 GameDev Native Video & Media Support**: Attach `.mp4`, `.webm` videos, GIFs, and screenshots to tasks. Game mechanics autoplay directly on card banners.
- **📦 3D Physical Card Stacking**: Drag cards onto each other to group related sub-mechanics into physical card stacks without cluttering board columns.
- **🤖 Automated Telegram Integration**: Instant automated reports sent to your Telegram channel when tasks are completed or updated, with customizable HTML templates.
- **💾 Automatic Database Backups**: Automatic SQLite database backups created on server launch inside the `/backups` directory.
- **🎨 GitHub Dark Theme Integration**: Extracted design system styling inspired by GitHub's Dark UI (customizable via CSS tokens).
- **📱 Responsive Column Layouts**: Dynamic 1-column, 2-column, and 3-column view modes.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 5, SQLite3, Multer (Media Storage), Telegraf (Telegram Bot API)
- **Frontend**: Native Vanilla JS, HTML5, CSS3, GitHub Dark Design System
- **Design Tokens**: Extracted via [Dembrandt](https://www.dembrandt.com)

---

## 🚀 Quickstart & Installation

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd public_bot
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the root directory:
```env
PORT=3000
BOT_TOKEN=your_telegram_bot_token
CHANNEL_ID=-1001234567890
```

### 3. Run Application
```bash
# Start via Node
node server.js

# Or double click start.bat on Windows
```
Open `http://localhost:3000` in your web browser.

---

## 📄 License
ISC License
