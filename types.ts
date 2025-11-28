
export enum AnswerState {
  UNANSWERED = 'NULL',
  YES = 'YES',
  NO = 'NO'
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
}

export interface Question {
  id: string;
  projectId: string;
  text: string;
  schedule: number[]; // 0 (Sun) - 6 (Sat)
  createdAt: number;
}

export interface DailyLog {
  [date: string]: { // YYYY-MM-DD
    [questionId: string]: AnswerState;
  };
}

export interface AppState {
  projects: Project[];
  questions: Question[];
  logs: DailyLog;
}

export interface DateRange {
  start: Date;
  end: Date;
  label?: string;
}

export type Granularity = 'day' | 'week' | 'month';

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];
