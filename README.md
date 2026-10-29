# QuizForge — AI-Powered PDF Quiz Generator

QuizForge turns study material into an interactive multiple-choice quiz. Upload a **text-based PDF**, let the application extract and organize its content, generate five questions, answer them, and review your score with explanations.

**Source code:** https://github.com/ayushsahu-git/demo-cloade

> **Current input support:** PDF files only. CSV and JSON uploads are not implemented in the current version. Scanned/image-only PDFs are not supported because OCR has not been added.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [How It Works](#how-it-works)
- [How RAG Is Used](#how-rag-is-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Commands](#available-commands)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Limitations](#limitations)
- [Possible Improvements](#possible-improvements)
- [Author](#author)

## Features

- **PDF upload and text extraction:** Reads text and page count from text-based PDFs.
- **File validation and helpful errors:** Reports invalid or password-protected PDFs and PDFs without enough readable text.
- **Text chunking:** Splits extracted text into smaller, overlapping chunks to preserve context around chunk boundaries.
- **Relevant passage retrieval:** Selects passages from the document to provide context for question generation.
- **AI quiz generation:** Uses the Google Gemini API to generate exactly five MCQs, each with options A–D, one correct answer, and an explanation.
- **Fallback quiz generation:** Can attempt to create questions from retrieved text if Gemini is unavailable or generation fails. The fallback is simpler and may be less reliable than AI-generated questions.
- **Interactive quiz interface:** Select answers, submit the quiz, view your score and review explanations.
- **Sample documents:** Try the built-in *Quantum Computing Fundamentals* and *Photosynthesis and Cellular Energy* examples without uploading a file.
- **Responsive interface:** React, Tailwind CSS, and Lucide icons provide the user interface.

## Technology Stack

| Area | Technology | Purpose |
|---|---|---|
| Frontend | React 18 | Builds the interactive user interface |
| Language | TypeScript | Adds types and helps catch coding errors |
| Frontend tooling | Vite | Development server and frontend build tooling |
| Styling | Tailwind CSS 4 | Utility-based styling |
| Icons | Lucide React | Interface icons |
| Backend | Node.js and Express | Handles uploads, quiz generation, and scoring APIs |
| PDF processing | `pdf-parse` | Extracts text and page information from PDFs |
| AI integration | `@google/genai` | Calls the configured Gemini model |
| Upload handling | Multer | Receives uploaded PDF files in memory |
| Environment configuration | `dotenv` | Loads values from `.env` |
| Testing | TypeScript core test file | Tests chunking, quiz validation, and scoring logic |

## How It Works

```text
User uploads a PDF or chooses a sample document
                    |
                    v
       React + TypeScript frontend
                    |
                    v
       Express backend receives data
                    |
                    v
       Extract text from the PDF
                    |
                    v
     Split text into overlapping chunks
                    |
                    v
       Retrieve relevant text passages
                    |
                    v
   Gemini generates five MCQs (if configured)
                    |
                    v
       Validate the generated questions
                    |
                    v
 User answers the quiz and submits responses
                    |
                    v
      Calculate score and show review
```

### Workflow details

1. **Upload:** The user selects a PDF or chooses one of the sample documents.
2. **Extract:** The backend uses `pdf-parse` to extract text and page count. The uploaded file is held in memory and is limited to 25 MB.
3. **Chunk:** The text is divided into chunks of approximately 900 characters, with 150 characters of overlap. Chunk boundaries try to respect sentences and words.
4. **Retrieve:** The retrieval helper selects up to 10 chunks using predefined topic queries and simple word matching. These passages become the context for question generation.
5. **Generate:** If `GEMINI_API_KEY` is set, the backend asks Gemini for five questions in a specified JSON structure. It retries generation once if the first attempt fails, then can use its fallback generator.
6. **Validate:** The application checks that there are five questions, each has options A–D, a valid correct-answer letter, and an explanation.
7. **Score:** When the user submits all answers, the backend calculates the number correct, total questions, percentage, and answer-by-answer review.

## How RAG Is Used

RAG stands for **Retrieval-Augmented Generation**. It supplies relevant source information to an AI model before the model generates an answer.

In QuizForge, the RAG-style flow is:

1. Extract text from the uploaded PDF.
2. Split it into overlapping chunks.
3. Retrieve relevant chunks from the document.
4. Send the retrieved text as context to Gemini.
5. Ask Gemini to create questions and explanations using only that context.

**Implementation note:** The current code uses lightweight, query/keyword-based chunk retrieval. It does **not** currently create vector embeddings or use a vector database such as ChromaDB or Pinecone. Adding embedding-based semantic search would be a future enhancement, not a current feature.

## Project Structure

```text
demo-cloade/
├── src/
│   ├── App.tsx          # Main React interface and quiz flow
│   ├── main.tsx         # Frontend entry point
│   ├── index.css        # Global styles and Tailwind import
│   ├── quizCore.ts      # Chunking, retrieval, validation, scoring
│   ├── types.ts         # TypeScript data types
│   └── sampleDocs.ts    # Built-in sample documents
├── .env.example         # Example environment variable names
├── .gitignore           # Files excluded from Git
├── index.html           # HTML entry point
├── package.json         # Dependencies and npm scripts
├── server.ts            # Express API and server setup
├── test_core.ts         # Offline core tests
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite, React, and Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js (Node.js 22 is the version specified by the project documentation; use a compatible current Node.js release).
- npm, which is included with Node.js.
- A Gemini API key for Gemini-powered question generation. The fallback generator can be used when no Gemini key is configured, but its output quality may be lower.

### 1. Clone the repository

```bash
git clone https://github.com/ayushsahu-git/demo-cloade.git
cd demo-cloade
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file to `.env`.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Open `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Keep the key private. Do not put it in frontend code or commit your `.env` file to Git.

`ANTHROPIC_API_KEY` is also listed in the example environment file, but the current quiz-generation route uses Gemini; an Anthropic key is not required for the documented workflow.

### 4. Start the application

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. The Express server runs the Vite development middleware, so the frontend and API are available from the same local origin.

### 5. Create your first quiz

1. Upload a text-based PDF with enough readable text, or select a built-in sample document.
2. Wait for processing to finish.
3. Select **Generate Quiz**.
4. Answer all five MCQs.
5. Submit your answers to view your score and explanations.
6. Restart the quiz or choose a different document to practise again.

## Environment Variables

| Variable | Required? | Description |
|---|---|---|
| `GEMINI_API_KEY` | Recommended for AI generation | API key used by the backend to call Gemini. Without it, the app attempts its fallback question generator. |
| `ANTHROPIC_API_KEY` | No | Present in `.env.example`, but not currently used to generate quizzes. |

Never publish real API keys in your repository, screenshots, or public issue reports. If a key is accidentally exposed, revoke it and create a replacement.

## Available Commands

| Command | What it does |
|---|---|
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts the Express server with Vite development middleware |
| `npm run build` | Runs TypeScript compilation and builds the frontend with Vite |
| `npm run lint` | Runs TypeScript checking with `tsc --noEmit` |
| `npx tsx test_core.ts` | Runs the offline core tests |
| `npm run start` | Starts the server in production mode; the script currently uses POSIX-style environment-variable syntax, which may require adjustment on native Windows shells |

## API Endpoints

The frontend communicates with the Express backend through these routes:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/status` | Returns server status and whether configured API keys are present |
| `POST` | `/api/upload-pdf` | Accepts a multipart upload using the field name `file`, extracts PDF text, chunks it, and returns document metadata and chunks |
| `POST` | `/api/load-sample` | Loads a built-in sample's text and prepares its chunks |
| `POST` | `/api/generate-quiz` | Retrieves context and returns five validated questions |
| `POST` | `/api/score-quiz` | Accepts questions and user answers, then returns the score and review |

### Example: upload a PDF

`POST /api/upload-pdf` uses `multipart/form-data` with a field named `file`.

A successful response includes the document ID, filename, page count, character count, chunk count, and chunk list. A failed request returns an error message, for example if the PDF is invalid, password-protected, scanned, or contains too little readable text.

## Testing

Run the core test suite:

```bash
npx tsx test_core.ts
```

The tests cover:

- Splitting long text into chunks.
- Validating the quiz's five-question structure and answer choices.
- Calculating scores and percentages.

The tests are designed to run offline and do not require a Gemini API key.

## Limitations

- **PDF only:** CSV and JSON file uploads are not currently supported by the upload interface or PDF-processing endpoint.
- **Text PDFs only:** Scanned PDFs and image-only documents require OCR, which is not implemented.
- **Retrieval is not embedding-based:** Relevant passages are selected with predefined queries and word matching, not a vector database.
- **Temporary in-memory storage:** Document chunks are held in server memory. They are not persisted in a database and may be lost when the server restarts.
- **AI output can be wrong:** Generated questions and explanations should be reviewed before being used for formal assessments.
- **Fallback quality varies:** The fallback generator is simpler than Gemini and may produce less natural questions or distractor options.
- **External API and network:** Gemini-powered generation requires a working API key, network access, and an available configured model.

## Possible Improvements

- Add CSV and JSON upload support with format-specific parsers.
- Add OCR for scanned PDFs.
- Implement embedding-based retrieval with a vector store for stronger semantic matching.
- Allow the user to choose quiz length and difficulty.
- Store documents and quiz history persistently.
- Add automated API/integration tests and question-quality checks.
- Add citations or page references to show which part of the source supports each question.

## Author

**Ayush Sahu**  
GitHub: [@ayushsahu-git](https://github.com/ayushsahu-git)

## License

No license file is currently included in the repository. Add a `LICENSE` file if you want to specify how others may use, modify, and distribute this project.
