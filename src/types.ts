export type OptionKey = "A" | "B" | "C" | "D";

export interface Question {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: OptionKey;
  explanation: string;
}

export interface ReviewItem {
  selected: string | null;
  correct: OptionKey;
  is_correct: boolean;
  explanation: string;
}

export interface QuizResult {
  correct: number;
  total: number;
  percent: number;
  review: ReviewItem[];
}

export interface DocInfo {
  id: string;
  name: string;
  pages: number;
  chars: number;
  chunks: number;
}
