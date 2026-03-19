export interface Quiz {
  id: string;
  day_id: string;
  question: string;
  options: string[];
  correct_option: number | null;
  correct_options?: number[];
  explanation?: string | null;
  question_order?: number;
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
  existingId?: string;
}

export const emptyQuestion = (): QuestionForm => ({
  question: '',
  options: ['', '', '', ''],
  correctOptions: [],
  explanation: '',
});
