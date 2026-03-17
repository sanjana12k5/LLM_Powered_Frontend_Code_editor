# AI Frontend Diagnostic and Code Generation Studio

A desktop application (Electron) with a VS Code-like interface for analyzing, diagnosing, and generating frontend code with AI-powered intelligence.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.x, Tailwind CSS 3.x |
| Backend | Node.js, Express 4.x |
| Editor | Monaco Editor |
| Analysis | ESLint, Custom HTML/CSS analyzers |
| AI | OpenAI API / Google Gemini API |
| Database | MongoDB (Mongoose) |
| Desktop | Electron 28.x |

## Project Structure

```
project-root/
├── frontend/           # React + Tailwind UI
│   └── src/
│       ├── components/ # All UI components
│       ├── context/    # State management
│       └── index.css   # Tailwind + global styles
├── backend/            # Express API server
│   ├── routes/         # API route definitions
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   │   ├── analyzer.js # Static analysis engine
│   │   └── aiService.js# AI API integration
│   └── models/         # MongoDB schemas
├── electron/           # Desktop app shell
│   ├── main.js         # Main process
│   └── preload.js      # IPC bridge
├── .env                # Environment config
└── package.json        # Root orchestrator
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB (optional — app works without it)
- OpenAI API key OR Google Gemini API key

### 1. Install Dependencies

```bash
# Root dependencies (Electron, concurrently)
cd project-root
npm install

# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure Environment

Edit `.env` in the project root:

```env
# Choose AI provider: 'openai' or 'gemini'
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-gemini-key-here

# MongoDB (optional)
MONGODB_URI=mongodb://localhost:27017/ai-diagnostic-studio

# Backend port
PORT=3001
```

### 3. Run the Application

```bash
# Start everything (backend + frontend + Electron)
npm start

# Or run individually:
npm run frontend:dev   # React dev server on :5173
npm run backend:dev    # Express API on :3001
npm run electron:dev   # Electron window
```

### 4. Build for Production

```bash
npm run package    # Creates Windows .exe in dist/
```

## Features

- **3-Panel IDE Layout** — File explorer, Monaco Editor (with tabs), AI Assistant
- **Static Analysis** — ESLint for JS/JSX, custom HTML/CSS analyzers, broken import detection
- **AI Code Fixes** — Send issues to OpenAI/Gemini, get explanations and fixed code
- **AI Project Generation** — Describe a project in natural language, AI generates the code
- **File System Integration** — Native folder picker, recursive file reading, save support
- **Frameless Electron Window** — Custom title bar with window controls
