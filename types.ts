export enum AnswerState {
  UNANSWERED = 'NULL',
  YES = 'YES',
  NO = 'NO'
}

export interface Question {
  id: string;
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

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Did you code today?',
    schedule: [0, 1, 2, 3, 4, 5, 6],
    createdAt: Date.now()
  },
  {
    id: 'q2',
    text: 'Did you drink enough water?',
    schedule: [0, 1, 2, 3, 4, 5, 6],
    createdAt: Date.now()
  },
  {
    id: 'q3',
    text: 'Did you exercise?',
    schedule: [1, 3, 5], // Mon, Wed, Fri
    createdAt: Date.now()
  }
];