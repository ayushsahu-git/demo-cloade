import { Question, OptionKey, QuizResult, ReviewItem } from "./types";

export const CHUNK_SIZE = 900;
export const CHUNK_OVERLAP = 150;
export const MIN_TEXT_CHARS = 200;
export const NUM_QUESTIONS = 5;

export const QUERIES = [
  "main concepts and definitions",
  "key facts, numbers and examples",
  "processes, methods and steps",
  "causes, effects and relationships",
  "important conclusions and requirements",
];

export class QuizError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuizError";
  }
}

/**
 * Splits text into overlapping chunks, preferring sentence or word boundaries.
 */
export function chunkText(
  text: string,
  size: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + size, cleaned.length);
    if (end < cleaned.length) {
      const sentenceCut = cleaned.lastIndexOf(". ", end);
      const spaceCut = cleaned.lastIndexOf(" ", end);
      const minAcceptableCut = start + Math.floor(size / 2);

      let cut = -1;
      if (sentenceCut >= minAcceptableCut && sentenceCut <= end) {
        cut = sentenceCut + 1; // include period
      } else if (spaceCut >= minAcceptableCut && spaceCut <= end) {
        cut = spaceCut;
      }

      if (cut > start) {
        end = cut;
      }
    }

    const slice = cleaned.slice(start, end).trim();
    if (slice) {
      chunks.push(slice);
    }

    if (end >= cleaned.length) {
      break;
    }
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

/**
 * Validates that the generated quiz conforms to the 5-question schema.
 */
export function validateQuiz(obj: unknown): Question[] {
  if (!obj || typeof obj !== "object") {
    throw new ValueError("Quiz must be a JSON object.");
  }

  const qs = (obj as Record<string, unknown>).questions;
  if (!Array.isArray(qs) || qs.length !== NUM_QUESTIONS) {
    throw new ValueError(`Expected exactly ${NUM_QUESTIONS} questions.`);
  }

  const validKeys: OptionKey[] = ["A", "B", "C", "D"];

  for (let i = 0; i < qs.length; i++) {
    const q = qs[i];
    const qNum = i + 1;
    if (!q || typeof q !== "object") {
      throw new ValueError(`Question ${qNum} is not an object.`);
    }

    const questionText = String(q.question || "").trim();
    if (!questionText) {
      throw new ValueError(`Question ${qNum} is empty.`);
    }

    const opts = q.options as Record<string, unknown> | undefined;
    if (!opts || typeof opts !== "object") {
      throw new ValueError(`Question ${qNum} has invalid options.`);
    }

    const sortedKeys = Object.keys(opts).sort();
    if (sortedKeys.join("") !== "ABCD") {
      throw new ValueError(`Question ${qNum} must have options A-D.`);
    }

    for (const key of validKeys) {
      if (!String(opts[key] || "").trim()) {
        throw new ValueError(`Question ${qNum} has empty option ${key}.`);
      }
    }

    const correct = q.correct_answer as OptionKey;
    if (!validKeys.includes(correct)) {
      throw new ValueError(`Question ${qNum} has an invalid correct_answer: ${correct}.`);
    }

    const explanation = String(q.explanation || "").trim();
    if (!explanation) {
      throw new ValueError(`Question ${qNum} has no explanation.`);
    }
  }

  return qs as Question[];
}

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
}

/**
 * Computes user's score and breakdown against the correct answers.
 */
export function scoreQuiz(
  questions: Question[],
  answers: Record<number, OptionKey | null>
): QuizResult {
  const review: ReviewItem[] = [];
  let correct = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const sel = answers[i] ?? null;
    const isCorrect = sel === q.correct_answer;
    if (isCorrect) {
      correct++;
    }
    review.push({
      selected: sel,
      correct: q.correct_answer,
      is_correct: isCorrect,
      explanation: q.explanation,
    });
  }

  const total = questions.length;
  const percent = total > 0 ? Math.round((100 * correct) / total) : 0;

  return {
    correct,
    total,
    percent,
    review,
  };
}

/**
 * Rank and retrieve relevant chunks based on queries.
 */
export function retrieveChunks(
  chunks: string[],
  kPerQuery: number = 3,
  maxChunks: number = 10
): string[] {
  if (chunks.length <= maxChunks) {
    // Shuffle and return
    return [...chunks].sort(() => Math.random() - 0.5);
  }

  // Tokenize chunks
  const chunkWords = chunks.map((c) =>
    new Set(c.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean))
  );

  const seen = new Set<number>();
  const selected: string[] = [];

  for (const query of QUERIES) {
    const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = chunks.map((_, idx) => {
      let score = 0;
      for (const w of qWords) {
        if (chunkWords[idx].has(w)) score += 1;
      }
      return { idx, score };
    });

    scored.sort((a, b) => b.score - a.score);

    let picked = 0;
    for (const item of scored) {
      if (!seen.has(item.idx)) {
        seen.add(item.idx);
        selected.push(chunks[item.idx]);
        picked++;
        if (picked >= kPerQuery) break;
      }
    }
  }

  // If still less than maxChunks, pick remaining
  for (let i = 0; i < chunks.length && selected.length < maxChunks; i++) {
    if (!seen.has(i)) {
      seen.add(i);
      selected.push(chunks[i]);
    }
  }

  // Shuffle for variety
  return selected.sort(() => Math.random() - 0.5).slice(0, maxChunks);
}
