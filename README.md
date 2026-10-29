# QuizForge — Turn your PDFs into interactive quizzes with AI

Upload a PDF → extract text → chunk & index → retrieve relevant passages → AI writes 5 MCQs → you answer → get score + explanations.

Rewritten as a modern full-stack React + TypeScript application with Tailwind CSS and Express backend.

## Features
- **PDF Upload & Text Extraction**: Extracts text and counts pages from text-based PDFs (handles encrypted / scanned PDF errors with helpful messages).
- **Text Chunking & Semantic Retrieval**: Splits text into 900-character chunks with 150-character overlap along sentence and word boundaries. Retrieves top relevant passages matching core conceptual queries.
- **AI Quiz Generation**: Generates exactly 5 distinct multiple choice questions (options A–D, single correct answer, and grounded explanations) using Gemini 3.8 Flash (with intelligent offline knowledge-extraction fallback).
- **Interactive Quiz Interface & Scoring**: Clean, responsive UI with radio option selections, locked scoring on submission, detailed answer reviews with explanations, and instant quiz restart / new quiz generation.
- **Sample Document Presets**: Built-in rich sample documents ("Quantum Computing Fundamentals", "Photosynthesis and Cellular Energy") for immediate 1-click testing.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide icons, Vite
- **Backend**: Express, Node.js 22, `pdf-parse`, `@google/genai`
- **Testing**: Offline core test suite in `test_core.ts`

## Getting Started
```bash
npm install
npm run dev
```

Server runs on `http://0.0.0.0:3000`.

## Testing
Run core unit tests:
```bash
npx tsx test_core.ts
```
