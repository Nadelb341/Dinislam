export interface Quiz {
  id: string;
  day_id: string;
  question: string;
  options: string[];
  correct_option: number | null;
  correct_options?: number[];
  explanation?: string | null;
  question_order?: number;
  /** 🕌 27/11 : source (hadith ou verset) + degré d'authenticité de la question */
  source?: string | null;
  degre?: string | null;
  degre_divergence?: string | null;
}

export interface DayVideo {
  id: string;
  day_id?: string;
  video_url: string;
  file_name: string | null;
  display_order: number;
}

export interface QuestionForm {
  question: string;
  options: string[];
  correctOptions: number[];
  explanation: string;
  source?: string;
  degre?: string | null;
  divergence?: string | null;
  existingId?: string;
}

export const emptyQuestion = (): QuestionForm => ({
  question: '',
  options: ['', '', '', ''],
  correctOptions: [],
  explanation: '',
  source: '',
  degre: null,
  divergence: null,
});
