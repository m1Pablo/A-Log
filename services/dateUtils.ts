import { DailyLog, Question, AnswerState, Granularity, DateRange } from '../types';

// --- Date Math Helpers ---

export const stripTime = (d: Date): Date => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const addDays = (d: Date, days: number): Date => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

export const getStartOfWeek = (d: Date, startMonday: boolean = false): Date => {
  const day = d.getDay();
  const diff = d.getDate() - day + (startMonday ? (day === 0 ? -6 : 1) : 0);
  return new Date(d.setDate(diff));
};

export const formatDate = (d: Date): string => {
  return d.toISOString().split('T')[0];
};

export const formatDisplayDate = (d: Date): string => {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- Preset Generators ---

export const getPresets = () => {
  const today = stripTime(new Date());
  const yesterday = addDays(today, -1);
  
  const getStartOf = (d: Date, unit: 'month' | 'quarter' | 'year') => {
    const res = new Date(d);
    if (unit === 'month') res.setDate(1);
    if (unit === 'quarter') {
      res.setDate(1);
      res.setMonth(Math.floor(res.getMonth() / 3) * 3);
    }
    if (unit === 'year') {
      res.setMonth(0, 1);
    }
    return res;
  };

  const getEndOf = (d: Date, unit: 'month' | 'quarter' | 'year') => {
    const res = new Date(d);
    if (unit === 'month') { res.setMonth(res.getMonth() + 1, 0); }
    if (unit === 'quarter') {
        const currentQuarter = Math.floor(res.getMonth() / 3);
        res.setMonth((currentQuarter + 1) * 3, 0);
    }
    if (unit === 'year') { res.setMonth(11, 31); }
    return res;
  };

  return {
    Fixed: [
      { label: 'Yesterday', start: yesterday, end: yesterday },
      { label: 'Today', start: today, end: today },
    ],
    This: [
      { label: 'This month', start: getStartOf(today, 'month'), end: getEndOf(today, 'month') },
      { label: 'This month to date', start: getStartOf(today, 'month'), end: today },
      { label: 'This week (Sun)', start: getStartOfWeek(new Date(today), false), end: addDays(getStartOfWeek(new Date(today), false), 6) },
      { label: 'This week (Mon)', start: getStartOfWeek(new Date(today), true), end: addDays(getStartOfWeek(new Date(today), true), 6) },
      { label: 'This quarter', start: getStartOf(today, 'quarter'), end: getEndOf(today, 'quarter') },
      { label: 'This year', start: getStartOf(today, 'year'), end: getEndOf(today, 'year') },
    ],
    Last: [
      { label: 'Last 7 days', start: addDays(today, -6), end: today },
      { label: 'Last 14 days', start: addDays(today, -13), end: today },
      { label: 'Last 30 days', start: addDays(today, -29), end: today },
      { label: 'Last month', start: getStartOf(addDays(getStartOf(today, 'month'), -1), 'month'), end: getEndOf(addDays(getStartOf(today, 'month'), -1), 'month') },
      { label: 'Last quarter', start: getStartOf(addDays(getStartOf(today, 'quarter'), -1), 'quarter'), end: getEndOf(addDays(getStartOf(today, 'quarter'), -1), 'quarter') },
      { label: 'Last year', start: getStartOf(addDays(getStartOf(today, 'year'), -1), 'year'), end: getEndOf(addDays(getStartOf(today, 'year'), -1), 'year') },
    ]
  };
};

// --- Aggregation Logic ---

export interface ChartDataPoint {
  key: string; // The label on X Axis
  fullDate: string; // For sorting/tooltip
  yes: number;
  no: number;
  total: number;
}

export const aggregateData = (
  logs: DailyLog, 
  questions: Question[], 
  range: DateRange, 
  granularity: Granularity
): ChartDataPoint[] => {
  const dataMap = new Map<string, ChartDataPoint>();
  const cursor = new Date(range.start);
  const end = new Date(range.end);

  // Normalize range
  cursor.setHours(0,0,0,0);
  end.setHours(23,59,59,999);

  while (cursor <= end) {
    const dateStr = formatDate(cursor);
    const dayOfWeek = cursor.getDay();
    
    // Determine the key based on granularity
    let key = dateStr;
    let fullDate = dateStr;

    if (granularity === 'week') {
      const sow = getStartOfWeek(new Date(cursor));
      key = `Week ${formatDisplayDate(sow)}`;
      fullDate = formatDate(sow);
    } else if (granularity === 'month') {
      key = cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      fullDate = `${cursor.getFullYear()}-${cursor.getMonth()}-01`;
    } else {
        // day
        key = formatDisplayDate(cursor);
    }

    // Initialize if missing
    if (!dataMap.has(key)) {
      dataMap.set(key, { key, fullDate, yes: 0, no: 0, total: 0 });
    }

    const entry = dataMap.get(key)!;
    const log = logs[dateStr] || {};
    
    // Find valid questions for this specific day of week
    const daysQuestions = questions.filter(q => q.schedule.includes(dayOfWeek));
    
    // Tally
    daysQuestions.forEach(q => {
      // If granularity is large, we might not want to count "Total" as every possible question 
      // but usually for adherence, we compare Answers vs Expected.
      // However, simplified: Yes count vs No count.
      const ans = log[q.id];
      if (ans === AnswerState.YES) entry.yes++;
      if (ans === AnswerState.NO) entry.no++;
      // entry.total += 1; // Optional: Track potential total
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return Array.from(dataMap.values());
};