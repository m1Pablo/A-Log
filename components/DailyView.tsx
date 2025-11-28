import React, { useMemo, useState } from 'react';
import { Question, AnswerState, DailyLog } from '../types';
import { Check, X, Lock, Unlock, SkipBack, CalendarOff } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { formatDate, stripTime } from '../services/dateUtils';
import { RetroButton } from './RetroButton';

interface DailyViewProps {
  questions: Question[];
  logs: DailyLog;
  onUpdateLog: (date: string, questionId: string, answer: AnswerState) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({ questions, logs, onUpdateLog }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRecordLocked, setIsRecordLocked] = useState(true);
  
  const dateStr = formatDate(selectedDate);
  const dayOfWeek = selectedDate.getDay();

  // Determine if viewing today
  const isToday = useMemo(() => {
    return formatDate(new Date()) === dateStr;
  }, [dateStr]);

  const getStatus = (qId: string) => {
    return logs[dateStr]?.[qId] || AnswerState.UNANSWERED;
  };

  const setAnswer = (qId: string, answer: AnswerState) => {
    onUpdateLog(dateStr, qId, answer);
  };

  const handleToggle = (qId: string, value: AnswerState) => {
    const current = getStatus(qId);
    if (current === value) {
        setAnswer(qId, AnswerState.UNANSWERED);
    } else {
        setAnswer(qId, value);
    }
  };

  // --- CATEGORIZATION LOGIC ---

  // 1. Split questions into Scheduled for this day vs Not Scheduled
  const scheduledQs = useMemo(() => {
    return questions.filter(q => q.schedule.includes(dayOfWeek));
  }, [questions, dayOfWeek]);

  const unscheduledQs = useMemo(() => {
    return questions.filter(q => !q.schedule.includes(dayOfWeek));
  }, [questions, dayOfWeek]);

  // 2. Filter Active (Pending) - Only applies to TODAY and SCHEDULED questions that are UNANSWERED
  const activeQuestions = useMemo(() => {
    if (!isToday) return [];
    return scheduledQs.filter(q => getStatus(q.id) === AnswerState.UNANSWERED);
  }, [scheduledQs, logs, dateStr, isToday]);

  // 3. Filter Record (Scheduled) 
  // If Today: Show Scheduled questions that are NOT Unanswered
  // If Past: Show ALL Scheduled questions
  const recordScheduledQuestions = useMemo(() => {
    if (!isToday) return scheduledQs;
    return scheduledQs.filter(q => getStatus(q.id) !== AnswerState.UNANSWERED);
  }, [scheduledQs, logs, dateStr, isToday]);

  // 4. Filter Record (Unscheduled) - Show ALL Unscheduled questions always
  const recordUnscheduledQuestions = unscheduledQs;


  const renderQuestionCard = (q: Question, locked: boolean) => {
    const status = getStatus(q.id);
    return (
      <div 
        key={q.id} 
        className={`
            border-2 bg-[#0B0D0F] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all
            ${locked ? 'border-[#708CA9]/20 opacity-70' : 'border-[#708CA9]/30 hover:border-[#708CA9]'}
        `}
      >
        <span className={`text-xl md:text-2xl font-bold tracking-wider ${locked ? 'text-[#708CA9]/50' : 'text-[#708CA9]'}`}>
          {q.text}
        </span>
        
        <div className="flex items-center gap-3">
          {/* YES BUTTON */}
          <button
            onClick={() => !locked && handleToggle(q.id, AnswerState.YES)}
            disabled={locked}
            className={`
              px-6 py-2 border-2 flex items-center gap-2 font-bold transition-all uppercase
              ${status === AnswerState.YES 
                ? 'bg-[#8AFF80] border-[#8AFF80] text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(138,255,128,0.5)] translate-y-[-2px]' 
                : locked 
                    ? 'border-[#708CA9]/20 text-[#708CA9]/20 cursor-not-allowed'
                    : 'border-[#708CA9] text-[#708CA9] hover:border-[#8AFF80] hover:text-[#8AFF80]'}
            `}
          >
            <Check className="w-5 h-5" />
            YES
          </button>

          {/* NO BUTTON */}
          <button
            onClick={() => !locked && handleToggle(q.id, AnswerState.NO)}
            disabled={locked}
            className={`
              px-6 py-2 border-2 flex items-center gap-2 font-bold transition-all uppercase
              ${status === AnswerState.NO 
                ? 'bg-[#FF80BF] border-[#FF80BF] text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(255,128,191,0.5)] translate-y-[-2px]' 
                : locked 
                    ? 'border-[#708CA9]/20 text-[#708CA9]/20 cursor-not-allowed'
                    : 'border-[#708CA9] text-[#708CA9] hover:border-[#FF80BF] hover:text-[#FF80BF]'}
            `}
          >
            <X className="w-5 h-5" />
            NO
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-[#708CA9] pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h2 className="text-3xl uppercase animate-pulse text-[#708CA9]">>> DAILY LOGS</h2>
        <div className="flex items-center gap-2">
            {!isToday && (
                <RetroButton 
                    onClick={() => setSelectedDate(new Date())} 
                    className="h-full"
                    title="Jump to Today"
                    variant="secondary"
                >
                    TODAY
                </RetroButton>
            )}
            <DatePicker date={selectedDate} onChange={setSelectedDate} />
        </div>
      </div>

      {/* TODAY'S ACTIVE SECTION */}
      {isToday && (
          <div className="space-y-4">
            <h3 className="text-[#8AFF80] text-sm font-bold uppercase tracking-widest border-l-4 border-[#8AFF80] pl-3 mb-4">
                PENDING QUESTIONS
            </h3>
            {activeQuestions.length === 0 ? (
                <div className="text-[#708CA9] border-2 border-[#708CA9]/20 border-dashed p-6 text-center text-sm">
                   ALL SCHEDULED QUESTIONS LOGGED. CHECK RECORD BELOW.
                </div>
            ) : (
                <div className="grid gap-4">
                    {activeQuestions.map(q => renderQuestionCard(q, false))}
                </div>
            )}
          </div>
      )}

      {/* RECORD SECTION */}
      <div className="space-y-4 pt-8">
         <div className="flex items-center justify-between border-b border-[#708CA9]/30 pb-2">
             <h3 className="text-[#708CA9] text-sm font-bold uppercase tracking-widest border-l-4 border-[#708CA9] pl-3">
                LOG RECORD [{dateStr}]
             </h3>
             <RetroButton 
                variant={isRecordLocked ? 'secondary' : 'danger'} 
                onClick={() => setIsRecordLocked(!isRecordLocked)}
                className="py-1 px-3 text-xs"
                icon={isRecordLocked ? <Lock className="w-3 h-3"/> : <Unlock className="w-3 h-3"/>}
             >
                {isRecordLocked ? 'UNLOCK RECORD' : 'LOCK RECORD'}
             </RetroButton>
         </div>

         {/* 1. Scheduled Questions in Record */}
         <div className="space-y-4">
             {recordScheduledQuestions.length === 0 && (
                 <div className="text-[#708CA9]/50 italic text-center py-4 text-sm">
                     {isToday ? "NO COMPLETED LOGS YET." : "NO SCHEDULED TASKS FOR THIS DATE."}
                 </div>
             )}
             <div className="grid gap-4">
                {recordScheduledQuestions.map(q => renderQuestionCard(q, isRecordLocked))}
             </div>
         </div>

         {/* 2. Unscheduled / Other Questions */}
         {recordUnscheduledQuestions.length > 0 && (
            <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-[#708CA9]/60 text-xs font-bold uppercase border-b border-[#708CA9]/10 pb-1 mt-4">
                   <CalendarOff className="w-3 h-3" />
                   OFF-SCHEDULE / OTHER
                </div>
                <div className="grid gap-4">
                    {recordUnscheduledQuestions.map(q => renderQuestionCard(q, isRecordLocked))}
                </div>
            </div>
         )}
      </div>
    </div>
  );
};