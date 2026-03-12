# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend** (`frontend/`):
```bash
npm run dev       # Start Vite dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

**Backend** (`backend/`):
```bash
npm install       # First time only
npm run dev       # Start Express server at http://localhost:3001
```

Both servers must run simultaneously during development.

## Project overview

**read-and-recall**
Read&Recall is a React web app where students upload dense 
study material (PDF or pasted text) and study it interactively.

The app splits the material into sections. After each section, 
AI-generated multiple choice questions appear. The student 
answers them before moving to the next section. At the end, 
a 10-question open-answer final quiz tests recall of the 
entire material. AI grades each final answer with feedback.

Wrong answer logic:
- 1st wrong attempt → section is revealed again to re-read
- 2nd wrong attempt → correct answer + brief explanation shown

The core differentiator: questions are embedded INSIDE the 
student's own material as they read, not after.

## Architecture

```
frontend/src/
├── App.jsx                   ← all state, all quiz logic, orchestration
├── api.js                    ← fetch calls only (processText, gradeAnswer, fetchUrl)
├── utils/extractText.js      ← PDF text extraction + tesseract.js OCR fallback
└── components/
    ├── InputTabs.jsx         ← File / Pasted Text / URL tab switcher
    ├── FileUploader.jsx      ← drag-and-drop PDF uploader
    ├── TextInput.jsx         ← textarea for pasted text
    ├── UrlInput.jsx          ← URL input with validation
    ├── StudyView.jsx         ← maps over sections + renders FinalQuiz
    ├── Section.jsx           ← one section: text + quiz orchestration
    ├── SectionQuiz.jsx       ← MCQ questions, explanation on 2nd wrong
    └── FinalQuiz.jsx         ← 10 open-answer questions, one at a time

backend/
├── server.js    ← POST /api/process, POST /api/grade, GET /api/fetch-url
├── .env         ← ANTHROPIC_API_KEY (never committed)
└── .env.example
```

### Data flow

```
User selects input (File / Text / URL)
  → clicks Start
  → frontend extracts text (pdfjs, or tesseract.js OCR for scanned PDFs)
  → POST /api/process → Claude returns { sections[], finalQuiz[] }
  → sections initialized with quizState: 'locked'|'reading'|'quizzing'|'retry'|'passed'
  → StudyView renders; page auto-scrolls to it
```

### Per-section quiz state machine (lives in App.jsx)

```
locked → (previous section passed) → reading
reading → (Start Quiz) → quizzing
quizzing → correct → reading next / passed if last
quizzing → 1st wrong → retry (text visible again)
retry → (Try Again) → quizzing
quizzing → 2nd wrong → showExplanation=true (Continue button)
Continue → next question / passed if last
```

### Backend routes

| Route | Purpose |
|---|---|
| `POST /api/process` | receives raw text, returns `{ sections, finalQuiz }` |
| `POST /api/grade` | receives `{ question, answer }`, returns `{ correct, feedback }` |
| `GET /api/fetch-url?url=` | fetches URL and strips HTML to plain text |

### PDF extraction strategy (`utils/extractText.js`)

1. Try pdfjs native text extraction (fast, works for digital PDFs)
2. If text < 100 chars, fall back to tesseract.js OCR (handles scanned pages, two-column layouts)
3. OCR runs with `['eng', 'spa']` language support

### Session persistence

Full state (`status`, `sections`, `finalQuiz`) is saved to `localStorage` under `readAndRecallState`. Loading from a new file clears it entirely before starting.

## General
- Always use functional React components with hooks
- Keep components small — one responsibility per file
- All Claude API calls go through `api.js`, never inline in components

## Parent-level rules
A `CLAUDE.md` at `/Users/rocioalonsopano/Documents/React/CLAUDE.md` contains general rules that apply to all React projects in this workspace. Those rules take precedence and cover: communication style, architecture planning, code quality checklist, and API key handling policy.

## What NOT to do
- Never hardcode the API key in any file
- Never put API logic inside JSX components
- Never install unnecessary libraries — keep it lean
- Never modify vite.config.js or main.jsx without asking