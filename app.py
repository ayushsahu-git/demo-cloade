"""QuizForge - turn PDFs into interactive quizzes with RAG (pypdf + ChromaDB + Claude)."""
from __future__ import annotations

import hashlib
import io
import json
import os
import random
import re
from typing import Any

import streamlit as st
from dotenv import load_dotenv

load_dotenv()

CHUNK_SIZE, CHUNK_OVERLAP, MIN_TEXT_CHARS = 900, 150, 200
NUM_QUESTIONS = 5
DB_PATH = ".chroma"
MODEL = os.getenv("QUIZFORGE_MODEL", "claude-sonnet-4-6")
QUERIES = [
    "main concepts and definitions",
    "key facts, numbers and examples",
    "processes, methods and steps",
    "causes, effects and relationships",
    "important conclusions and requirements",
]


class QuizError(Exception):
    """User-facing error."""


# ---------- PDF ----------
def extract_text(data: bytes) -> tuple[str, int]:
    from pypdf import PdfReader
    from pypdf.errors import PdfReadError

    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted and not reader.decrypt(""):
            raise QuizError("This PDF is password-protected. Please upload an unlocked copy.")
        pages = [(p.extract_text() or "") for p in reader.pages]
    except QuizError:
        raise
    except (PdfReadError, Exception) as e:  # noqa: BLE001
        raise QuizError(f"Could not read this file as a PDF ({type(e).__name__}).") from e
    text = re.sub(r"[ \t]+", " ", "\n".join(pages)).strip()
    if len(text) < MIN_TEXT_CHARS:
        raise QuizError("No readable text found. The PDF may be empty or a scanned image (OCR is not supported).")
    return text, len(pages)


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    chunks, start = [], 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):  # prefer breaking at a sentence/space boundary
            cut = max(text.rfind(". ", start, end), text.rfind(" ", start + size // 2, end))
            end = cut + 1 if cut > start + size // 2 else end
        chunks.append(text[start:end].strip())
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return [c for c in chunks if c]


# ---------- Vector store (one collection per document = isolation) ----------
@st.cache_resource(show_spinner=False)
def get_client():
    import chromadb
    return chromadb.PersistentClient(path=DB_PATH)


def index_document(doc_id: str, chunks: list[str]):
    client = get_client()
    name = f"doc_{doc_id}"
    col = client.get_or_create_collection(name, metadata={"hnsw:space": "cosine"})
    if col.count() != len(chunks):  # reuse index when identical doc was already stored
        client.delete_collection(name)
        col = client.create_collection(name, metadata={"hnsw:space": "cosine"})
        # Chroma's default local embedding model (all-MiniLM-L6-v2) embeds the chunks
        for i in range(0, len(chunks), 64):
            batch = chunks[i : i + 64]
            col.add(ids=[f"{doc_id}-{i + j}" for j in range(len(batch))], documents=batch)
    return col


def retrieve(col, k_per_query: int = 3, max_chunks: int = 10) -> list[str]:
    n = col.count()
    res = col.query(query_texts=QUERIES, n_results=min(k_per_query, n))
    seen, out = set(), []
    for docs in res["documents"]:
        for d in docs:
            if d not in seen:
                seen.add(d)
                out.append(d)
    random.shuffle(out)  # variety between quizzes
    return out[:max_chunks]


# ---------- LLM ----------
def get_api_key() -> str | None:
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        try:
            key = st.secrets.get("ANTHROPIC_API_KEY")
        except Exception:  # noqa: BLE001
            key = None
    return key or None


def validate_quiz(obj: Any) -> list[dict]:
    qs = obj.get("questions") if isinstance(obj, dict) else None
    if not isinstance(qs, list) or len(qs) != NUM_QUESTIONS:
        raise ValueError(f"Expected exactly {NUM_QUESTIONS} questions.")
    for i, q in enumerate(qs, 1):
        opts = q.get("options")
        if not str(q.get("question", "")).strip():
            raise ValueError(f"Question {i} is empty.")
        if not isinstance(opts, dict) or sorted(opts) != list("ABCD") or not all(str(v).strip() for v in opts.values()):
            raise ValueError(f"Question {i} must have non-empty options A-D.")
        if q.get("correct_answer") not in opts:
            raise ValueError(f"Question {i} has an invalid correct_answer.")
        if not str(q.get("explanation", "")).strip():
            raise ValueError(f"Question {i} has no explanation.")
    return qs


def parse_json(text: str) -> Any:
    text = re.sub(r"```(?:json)?", "", text).strip()
    s, e = text.find("{"), text.rfind("}")
    return json.loads(text[s : e + 1])


def generate_quiz(context_chunks: list[str]) -> list[dict]:
    key = get_api_key()
    if not key:
        raise QuizError("No API key found. Set ANTHROPIC_API_KEY in a .env file (see .env.example) and restart.")
    import anthropic

    client = anthropic.Anthropic(api_key=key)
    context = "\n\n---\n\n".join(context_chunks)
    system = (
        "You write multiple-choice quizzes. Use ONLY the supplied document context; never add outside knowledge. "
        "Respond with a single valid JSON object and nothing else."
    )
    prompt = f"""Document context:
{context}

Create exactly {NUM_QUESTIONS} distinct multiple-choice questions of easy-to-moderate difficulty covering different parts of the context.
Each has four options A-D with exactly one correct answer (vary the correct letter) and a short explanation supported by the text.
JSON schema:
{{"questions":[{{"question":"...","options":{{"A":"...","B":"...","C":"...","D":"..."}},"correct_answer":"A","explanation":"..."}}]}}"""
    messages = [{"role": "user", "content": prompt}]
    last_err = ""
    for attempt in range(2):  # one retry with a correction request
        try:
            resp = client.messages.create(model=MODEL, max_tokens=2500, system=system, messages=messages)
        except anthropic.AuthenticationError as e:
            raise QuizError("The API key was rejected. Check ANTHROPIC_API_KEY.") from e
        except anthropic.APIError as e:
            raise QuizError(f"LLM request failed: {type(e).__name__}. Please try again.") from e
        raw = "".join(b.text for b in resp.content if b.type == "text")
        try:
            return validate_quiz(parse_json(raw))
        except (ValueError, json.JSONDecodeError, AttributeError) as e:
            last_err = str(e)
            messages += [
                {"role": "assistant", "content": raw},
                {"role": "user", "content": f"That was invalid ({last_err}). Return ONLY corrected JSON matching the schema with exactly {NUM_QUESTIONS} questions."},
            ]
    raise QuizError("The AI returned an unusable quiz twice. Please click Generate Quiz again.")


# ---------- Scoring ----------
def score_quiz(questions: list[dict], answers: dict[int, str | None]) -> dict:
    review, correct = [], 0
    for i, q in enumerate(questions):
        sel = answers.get(i)
        ok = sel == q["correct_answer"]
        correct += ok
        review.append({"selected": sel, "correct": q["correct_answer"], "is_correct": ok, "explanation": q["explanation"]})
    total = len(questions)
    return {"correct": correct, "total": total, "percent": round(100 * correct / total) if total else 0, "review": review}


# ---------- UI ----------
CSS = """
<style>
.block-container{max-width:820px;padding-top:2rem}
.qf-title{font-size:2.4rem;font-weight:800;color:#4f46e5;margin-bottom:0}
.qf-tag{color:#6b7280;margin-bottom:1.5rem}
.qf-score{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:14px;padding:1.2rem 1.5rem;margin:1rem 0;font-size:1.3rem;font-weight:700}
</style>
"""


def reset_quiz():
    for k in ("quiz", "result"):
        st.session_state.pop(k, None)
    st.session_state["quiz_round"] = st.session_state.get("quiz_round", 0) + 1


def main():
    st.set_page_config(page_title="QuizForge", page_icon="📝", layout="centered")
    st.markdown(CSS, unsafe_allow_html=True)
    st.markdown('<p class="qf-title">📝 QuizForge</p><p class="qf-tag">Turn your PDFs into interactive quizzes with AI.</p>', unsafe_allow_html=True)

    if not get_api_key():
        st.warning("Setup needed: add `ANTHROPIC_API_KEY` to a `.env` file (see `.env.example`) and restart the app.")

    up = st.file_uploader("Upload a PDF", type=["pdf"])
    if up is None:
        st.session_state.pop("doc", None)
        reset_quiz()
        st.info("Upload a text-based PDF to get started.")
        return

    data = up.getvalue()
    doc_id = hashlib.sha256(data).hexdigest()[:16]
    if st.session_state.get("doc", {}).get("id") != doc_id:  # new document -> drop stale quiz
        reset_quiz()
        st.session_state.pop("doc", None)
        try:
            with st.status("Uploading…", expanded=True) as status:
                status.update(label="Processing: extracting text…")
                text, pages = extract_text(data)
                status.update(label="Processing: chunking and embedding (first run downloads a small local model)…")
                chunks = chunk_text(text)
                index_document(doc_id, chunks)
                status.update(label="Ready ✅", state="complete", expanded=False)
            st.session_state["doc"] = {"id": doc_id, "name": up.name, "pages": pages, "chars": len(text), "chunks": len(chunks)}
        except QuizError as e:
            st.error(str(e))
            return
        except Exception as e:  # noqa: BLE001
            st.error(f"Processing failed: {type(e).__name__}: {e}")
            return

    d = st.session_state["doc"]
    st.success(f"**{d['name']}** is ready")
    c1, c2, c3 = st.columns(3)
    c1.metric("Pages", d["pages"]); c2.metric("Characters", f"{d['chars']:,}"); c3.metric("Chunks", d["chunks"])

    if st.button("🎯 Generate Quiz" if "quiz" not in st.session_state else "🔄 Generate New Quiz", type="primary"):
        reset_quiz()
        try:
            with st.spinner("Retrieving context and generating questions…"):
                col = get_client().get_collection(f"doc_{d['id']}")
                st.session_state["quiz"] = generate_quiz(retrieve(col))
        except QuizError as e:
            st.error(str(e))
        except Exception as e:  # noqa: BLE001
            st.error(f"Something went wrong: {type(e).__name__}. Please try again.")

    quiz = st.session_state.get("quiz")
    if not quiz:
        return
    rnd = st.session_state.get("quiz_round", 0)
    result = st.session_state.get("result")

    st.divider()
    if result is None:
        with st.form(f"quiz_form_{rnd}"):
            for i, q in enumerate(quiz):
                st.markdown(f"**Q{i + 1}. {q['question']}**")
                st.radio("Select an answer", list("ABCD"), index=None, key=f"q{rnd}_{i}",
                         format_func=lambda l, q=q: f"{l}. {q['options'][l]}", label_visibility="collapsed")
                st.write("")
            submitted = st.form_submit_button("✅ Submit Quiz", type="primary")
        if submitted:
            answers = {i: st.session_state.get(f"q{rnd}_{i}") for i in range(len(quiz))}
            if None in answers.values():
                st.warning("Please answer all questions before submitting.")
            else:
                st.session_state["result"] = score_quiz(quiz, answers)  # locked: score can't change after this
                st.rerun()
    else:
        st.markdown(f'<div class="qf-score">Score: {result["correct"]}/{result["total"]} — {result["percent"]}%</div>', unsafe_allow_html=True)
        for i, (q, r) in enumerate(zip(quiz, result["review"])):
            st.markdown(f"**Q{i + 1}. {q['question']}**")
            fmt = lambda l: f"{l}. {q['options'][l]}"  # noqa: E731
            if r["is_correct"]:
                st.success(f"✅ Your answer: {fmt(r['selected'])}")
            else:
                st.error(f"❌ Your answer: {fmt(r['selected'])}")
                st.info(f"Correct answer: {fmt(r['correct'])}")
            st.caption(f"💡 {r['explanation']}")
        if st.button("🔁 Restart Quiz"):
            st.session_state.pop("result", None)
            st.session_state["quiz_round"] = rnd + 1
            st.rerun()


if __name__ == "__main__":
    main()
