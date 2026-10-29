"""Offline tests (no API key needed): chunking, validation, scoring, PDF errors."""
import sys, types
st = types.ModuleType("streamlit"); st.cache_resource = lambda **k: (lambda f: f); sys.modules.setdefault("streamlit", st)
import app

def test_chunk():
    t = ("Sentence number one is here. " * 200)
    cs = app.chunk_text(t); assert len(cs) > 3 and all(len(c) <= 950 for c in cs)

def good():
    return {"questions": [{"question": f"Q{i}", "options": {l: l for l in "ABCD"}, "correct_answer": "B", "explanation": "e"} for i in range(5)]}

def test_validate():
    assert len(app.validate_quiz(good())) == 5
    bad = good(); bad["questions"].pop()
    try: app.validate_quiz(bad); assert False
    except ValueError: pass
    bad = good(); bad["questions"][0]["correct_answer"] = "E"
    try: app.validate_quiz(bad); assert False
    except ValueError: pass

def test_score():
    qs = app.validate_quiz(good())
    r = app.score_quiz(qs, {0: "B", 1: "B", 2: "B", 3: "B", 4: "A"})
    assert (r["correct"], r["percent"]) == (4, 80)

def test_bad_pdf():
    try: app.extract_text(b"not a pdf"); assert False
    except app.QuizError: pass

if __name__ == "__main__":
    for n, f in list(globals().items()):
        if n.startswith("test_"): f(); print("PASS", n)
