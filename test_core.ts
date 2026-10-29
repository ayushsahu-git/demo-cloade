import { chunkText, validateQuiz, scoreQuiz, ValueError, NUM_QUESTIONS } from "./src/quizCore.js";
import { Question } from "./src/types.js";

function testChunk() {
  const t = "Sentence number one is here. ".repeat(200);
  const cs = chunkText(t);
  if (!(cs.length > 3 && cs.every((c) => c.length <= 950))) {
    throw new Error(`testChunk failed: chunks length=${cs.length}`);
  }
  console.log("PASS testChunk");
}

function good(): { questions: Question[] } {
  return {
    questions: Array.from({ length: 5 }, (_, i) => ({
      question: `Q${i + 1}`,
      options: { A: "A", B: "B", C: "C", D: "D" },
      correct_answer: "B" as const,
      explanation: "e",
    })),
  };
}

function testValidate() {
  const valid = validateQuiz(good());
  if (valid.length !== 5) {
    throw new Error("Expected 5 questions");
  }

  // Missing question
  const bad1 = good();
  bad1.questions.pop();
  let threw1 = false;
  try {
    validateQuiz(bad1);
  } catch (e: any) {
    if (e instanceof ValueError) threw1 = true;
  }
  if (!threw1) throw new Error("bad1 should have thrown ValueError");

  // Invalid correct_answer
  const bad2 = good();
  (bad2.questions[0] as any).correct_answer = "E";
  let threw2 = false;
  try {
    validateQuiz(bad2);
  } catch (e: any) {
    if (e instanceof ValueError) threw2 = true;
  }
  if (!threw2) throw new Error("bad2 should have thrown ValueError");

  console.log("PASS testValidate");
}

function testScore() {
  const qs = validateQuiz(good());
  const r = scoreQuiz(qs, { 0: "B", 1: "B", 2: "B", 3: "B", 4: "A" });
  if (r.correct !== 4 || r.percent !== 80) {
    throw new Error(`testScore failed: correct=${r.correct}, percent=${r.percent}`);
  }
  console.log("PASS testScore");
}

async function runAll() {
  console.log("Running offline core tests...");
  testChunk();
  testValidate();
  testScore();
  console.log("All core tests PASSED!");
}

runAll().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
