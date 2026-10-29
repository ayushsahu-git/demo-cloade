# QuizForge — Turn your PDFs into interactive quizzes with AI

Upload a PDF → extract text → chunk → embed → store in ChromaDB → retrieve relevant passages → Claude writes 5 MCQs → you answer → get score + explanations.

## Setup
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then put your ANTHROPIC_API_KEY inside
streamlit run app.py
```
Optional: `QUIZFORGE_MODEL` in `.env` to change the Claude model. On Streamlit Cloud, use Secrets instead of `.env`.

## Usage
1. Upload a text-based PDF and wait for **Ready**.
2. Click **Generate Quiz**, answer all 5 questions, click **Submit Quiz**.
3. Review score, correct answers and explanations. **Restart Quiz** or **Generate New Quiz** to retry.

## Architecture (single file `app.py`)
- `extract_text` (pypdf; handles encrypted/scanned/empty) → `chunk_text` (~900 chars, 150 overlap)
- `index_document`: ChromaDB persistent store (`.chroma/`), one collection per document hash (isolation, index reuse). Embeddings: Chroma's built-in local all-MiniLM-L6-v2 (no embedding API key).
- `retrieve`: semantic search with several topical queries, de-duplicated, shuffled for variety
- `generate_quiz`: Claude with a context-only prompt, JSON schema validation, one automatic retry
- `score_quiz`: pure function; result is locked after submission
- Tests: `python test_core.py` (offline; scoring, validation, chunking, bad PDF)

## Known limitations
- Scanned/image-only PDFs are rejected (no OCR).
- First run downloads the small embedding model (~80 MB) — internet required once.
- Quiz quality depends on the PDF text and the LLM; very long PDFs use only top-retrieved passages.
