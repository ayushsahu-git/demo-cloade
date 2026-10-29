import React, { useState, useRef, useEffect } from "react";
import { DocInfo, Question, QuizResult, OptionKey } from "./types";
import { SAMPLE_DOCUMENTS } from "./sampleDocs";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Lightbulb,
  XCircle,
  Loader2,
  BookOpen,
} from "lucide-react";

export default function App() {
  const [doc, setDoc] = useState<DocInfo | null>(null);
  const [docChunks, setDocChunks] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Quiz state
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, OptionKey | null>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [quizRound, setQuizRound] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Please upload a PDF file.");
      return;
    }

    setErrorMsg(null);
    setWarningMsg(null);
    setQuiz(null);
    setResult(null);
    setUserAnswers({});
    setIsProcessing(true);

    try {
      setUploadStatus("Uploading…");
      await new Promise((r) => setTimeout(r, 200));

      setUploadStatus("Processing: extracting text…");
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Failed to process PDF.");
      }

      setUploadStatus("Processing: chunking and embedding…");
      await new Promise((r) => setTimeout(r, 300));

      setUploadStatus("Ready ✅");
      setDoc({
        id: data.id,
        name: data.name,
        pages: data.pages,
        chars: data.chars,
        chunks: data.chunks,
      });
      setDocChunks(data.chunkList || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process PDF.");
      setDoc(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load preset sample document
  const handleLoadSample = async (sampleIdx: number) => {
    const sample = SAMPLE_DOCUMENTS[sampleIdx];
    if (!sample) return;

    setErrorMsg(null);
    setWarningMsg(null);
    setQuiz(null);
    setResult(null);
    setUserAnswers({});
    setIsProcessing(true);

    try {
      setUploadStatus("Processing: extracting text…");
      const resp = await fetch("/api/load-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sample),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Failed to load sample.");
      }

      setUploadStatus("Processing: chunking and embedding…");
      await new Promise((r) => setTimeout(r, 250));

      setUploadStatus("Ready ✅");
      setDoc({
        id: data.id,
        name: data.name,
        pages: data.pages,
        chars: data.chars,
        chunks: data.chunks,
      });
      setDocChunks(data.chunkList || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load sample.");
      setDoc(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate quiz
  const handleGenerateQuiz = async () => {
    if (!doc) return;
    setErrorMsg(null);
    setWarningMsg(null);
    setResult(null);
    setUserAnswers({});
    setIsGenerating(true);

    try {
      const resp = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: doc.id,
          chunks: docChunks,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Failed to generate quiz.");
      }

      setQuiz(data.questions);
      setQuizRound((prev) => prev + 1);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong generating questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit answers
  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    // Check all questions answered
    const unanswered = quiz.some((_, idx) => !userAnswers[idx]);
    if (unanswered) {
      setWarningMsg("Please answer all questions before submitting.");
      return;
    }

    setWarningMsg(null);
    try {
      const resp = await fetch("/api/score-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: quiz,
          answers: userAnswers,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Failed to score quiz.");
      }

      setResult(data);
      // Scroll to top of results smoothly
      window.scrollTo({ top: 300, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to score quiz.");
    }
  };

  // Restart quiz (retry same questions)
  const handleRestartQuiz = () => {
    setResult(null);
    setUserAnswers({});
    setWarningMsg(null);
    setQuizRound((prev) => prev + 1);
  };

  // Reset all and change document
  const handleResetDocument = () => {
    setDoc(null);
    setDocChunks([]);
    setQuiz(null);
    setResult(null);
    setUserAnswers({});
    setErrorMsg(null);
    setWarningMsg(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-gray-900">
      <div className="block-container bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 sm:p-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="qf-title">
            <span>📝</span> QuizForge
          </h1>
          <p className="qf-tag">Turn your PDFs into interactive quizzes with AI.</p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm leading-relaxed">{errorMsg}</div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-500 hover:text-red-700 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Global Warning Banner */}
        {warningMsg && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm font-medium">{warningMsg}</div>
          </div>
        )}

        {/* Upload Section (Shown when no doc or when changing doc) */}
        {!doc ? (
          <div className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                isProcessing
                  ? "border-indigo-400 bg-indigo-50/50"
                  : "border-gray-300 hover:border-indigo-500 hover:bg-gray-50/50 cursor-pointer"
              }`}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!isProcessing && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="mx-auto w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                {isProcessing ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {isProcessing ? "Processing Document…" : "Upload a PDF"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop your text-based PDF here, or click to browse
              </p>
              <button
                type="button"
                disabled={isProcessing}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow-sm transition"
              >
                Browse PDF File
              </button>
            </div>

            {/* Processing status box */}
            {isProcessing && uploadStatus && (
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                <span className="text-sm font-medium text-indigo-900">{uploadStatus}</span>
              </div>
            )}

            {/* Quick-test sample documents */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold tracking-wider uppercase text-gray-500">
                  Or test immediately with a sample document:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_DOCUMENTS.map((sample, idx) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleLoadSample(idx)}
                    disabled={isProcessing}
                    className="p-3 text-left border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-xl transition flex items-center justify-between group"
                  >
                    <div className="truncate pr-2">
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 truncate">
                        📄 {sample.name}
                      </div>
                      <div className="text-xs text-gray-500">{sample.pages} pages • Ready to quiz</div>
                    </div>
                    <span className="text-xs bg-gray-100 group-hover:bg-indigo-100 text-gray-600 group-hover:text-indigo-700 font-medium px-2 py-1 rounded">
                      Try
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Document Ready View */
          <div className="space-y-6">
            {/* Success notification */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-gray-900">{doc.name}</span> is ready
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetDocument}
                className="text-xs text-emerald-800 hover:text-emerald-950 underline font-medium"
              >
                Change PDF
              </button>
            </div>

            {/* Document Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Pages
                </div>
                <div className="text-2xl font-extrabold text-gray-900">{doc.pages}</div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Characters
                </div>
                <div className="text-2xl font-extrabold text-gray-900">
                  {doc.chars.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Chunks
                </div>
                <div className="text-2xl font-extrabold text-gray-900">{doc.chunks}</div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-base rounded-xl shadow-sm transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Retrieving context and generating questions…
                  </>
                ) : quiz ? (
                  <>
                    <RotateCcw className="w-5 h-5" />
                    🔄 Generate New Quiz
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    🎯 Generate Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quiz Section */}
        {quiz && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            {/* Unsubmitted Quiz Form */}
            {result === null ? (
              <form onSubmit={handleSubmitQuiz} className="space-y-8">
                {quiz.map((q, idx) => {
                  const options = ["A", "B", "C", "D"] as const;
                  return (
                    <div
                      key={`q_${quizRound}_${idx}`}
                      className="p-5 sm:p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4"
                    >
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">
                        Q{idx + 1}. {q.question}
                      </h3>
                      <div className="space-y-2.5">
                        {options.map((opt) => {
                          const isSelected = userAnswers[idx] === opt;
                          return (
                            <label
                              key={opt}
                              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium ring-1 ring-indigo-500"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question_${quizRound}_${idx}`}
                                value={opt}
                                checked={isSelected}
                                onChange={() => {
                                  setUserAnswers((prev) => ({ ...prev, [idx]: opt }));
                                  setWarningMsg(null);
                                }}
                                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <div className="flex-1 text-sm sm:text-base leading-relaxed">
                                <span className="font-bold mr-1.5">{opt}.</span> {q.options[opt]}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl shadow-sm transition"
                  >
                    ✅ Submit Quiz
                  </button>
                </div>
              </form>
            ) : (
              /* Scored Quiz Results */
              <div className="space-y-6">
                {/* Score Banner */}
                <div className="qf-score">
                  Score: {result.correct}/{result.total} — {result.percent}%
                </div>

                {/* Review Questions */}
                <div className="space-y-6">
                  {quiz.map((q, idx) => {
                    const review = result.review[idx];
                    const selected = review.selected as OptionKey | null;
                    const correctOpt = review.correct;

                    return (
                      <div
                        key={`review_${idx}`}
                        className="p-5 sm:p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3"
                      >
                        <h3 className="text-lg font-bold text-gray-900 leading-snug">
                          Q{idx + 1}. {q.question}
                        </h3>

                        {/* Answer Feedback */}
                        {review.is_correct ? (
                          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>
                              ✅ Your answer: {selected}. {selected ? q.options[selected] : ""}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm font-semibold flex items-center gap-2">
                              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                              <span>
                                ❌ Your answer: {selected ? `${selected}. ${q.options[selected]}` : "No answer selected"}
                              </span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-semibold flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                              <span>
                                Correct answer: {correctOpt}. {q.options[correctOpt]}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Explanation */}
                        <div className="pt-2 text-xs sm:text-sm text-gray-600 flex items-start gap-2 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <span className="font-semibold text-gray-800">Explanation:</span>{" "}
                            {review.explanation}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Post-Quiz Actions */}
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRestartQuiz}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm rounded-xl border border-gray-300 shadow-xs transition"
                  >
                    🔁 Restart Quiz
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm transition"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    🔄 Generate New Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
