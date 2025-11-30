
import React, { useMemo, useState } from 'react';
import { Question, AnswerState, DailyLog } from '../types';
import { Check, X, Lock, Unlock, SkipBack, CalendarOff, Target, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { formatDate, stripTime, addDays } from '../services/dateUtils';
import { RetroButton } from './RetroButton';

interface DailyViewProps {
  questions: Question[];
  logs: DailyLog;
  onUpdateLog: (date: string, questionId: string, answer: AnswerState) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({ questions, logs, onUpdateLog }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRecordLocked, setIsRecordLocked] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
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

  const handleUnlockClick = () => {
      if (isRecordLocked) {
          if (!isToday) {
              setShowUnlockModal(true);
          } else {
              setIsRecordLocked(false);
          }
      } else {
          setIsRecordLocked(true);
      }
  };

  const confirmUnlock = () => {
      setIsRecordLocked(false);
      setShowUnlockModal(false);
  };

  const handlePrevDay = () => {
      const prev = addDays(selectedDate, -1);
      setSelectedDate(prev);
  };

  const handleNextDay = () => {
      const next = addDays(selectedDate, 1);
      const today = new Date();
      // Prevent going into future
      if (formatDate(next) > formatDate(today)) return;
      setSelectedDate(next);
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
  //    HIDE Archived questions from pending list entirely
  const activeQuestions = useMemo(() => {
    if (!isToday) return [];
    return scheduledQs.filter(q => !q.isArchived && getStatus(q.id) === AnswerState.UNANSWERED);
  }, [scheduledQs, logs, dateStr, isToday]);

  // 3. Filter Record (Scheduled) 
  // If Today: Show Scheduled questions that are NOT Unanswered
  // If Past: Show ALL Scheduled questions
  // ARCHIVE LOGIC: If archived, only show if they have data (Answered)
  const recordScheduledQuestions = useMemo(() => {
    let list = scheduledQs;
    
    // First pass: Filter based on day state
    if (isToday) {
        list = list.filter(q => getStatus(q.id) !== AnswerState.UNANSWERED);
    }
    
    // Second pass: Filter archived
    return list.filter(q => {
        if (q.isArchived) {
            // Only show archived if they have a logged answer for this specific day
            const status = getStatus(q.id);
            return status !== AnswerState.UNANSWERED;
        }
        return true;
    });

  }, [scheduledQs, logs, dateStr, isToday]);

  // 4. Filter Record (Unscheduled) - Show ALL Unscheduled questions always
  // ARCHIVE LOGIC: Same as above, only show if archived has data
  const recordUnscheduledQuestions = useMemo(() => {
      return unscheduledQs.filter(q => {
          if (q.isArchived) {
              const status = getStatus(q.id);
              return status !== AnswerState.UNANSWERED;
          }
          return true;
      });
  }, [unscheduledQs, logs, dateStr]);


  const renderQuestionCard = (q: Question, locked: boolean) => {
    const status = getStatus(q.id);
    return (
      <div 
        key={q.id} 
        className={`
            border-2 bg-[#0B0D0F] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all
            ${locked ? 'border-[#708CA9]/20 opacity-70' : 'border-[#708CA9]/30 hover:border-[#708CA9]'}
            ${!!q.isArchived && 'border-dashed opacity-60'}
        `}
      >
        <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <div className={`text-xs font-bold uppercase flex items-center gap-1 ${q.desiredOutcome === AnswerState.YES ? 'text-[#7FEDFA]' : 'text-[#FF9580]'} opacity-70`}>
                    <Target className="w-3 h-3" />
                    GOAL: {q.desiredOutcome}
                </div>
                {!!q.isArchived && <span className="text-[10px] bg-[#708CA9] text-[#0B0D0F] px-1 font-bold">ARCHIVED</span>}
             </div>
             <span className={`text-xl md:text-2xl font-bold tracking-wider ${locked ? 'text-[#708CA9]/50' : 'text-[#708CA9]'}`}>
               {q.text}
             </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* YES BUTTON - Blue (Cyan) */}
          <button
            onClick={() => !locked && handleToggle(q.id, AnswerState.YES)}
            disabled={locked}
            className={`
              px-6 py-2 border-2 flex items-center gap-2 font-bold transition-all uppercase
              ${status === AnswerState.YES 
                ? locked 
                   ? 'bg-[#7FEDFA]/10 border-[#7FEDFA]/30 text-[#7FEDFA] cursor-not-allowed shadow-none' // Dimmer state
                   : 'bg-[#7FEDFA] border-[#7FEDFA] text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(127,237,250,0.5)] translate-y-[-2px]' 
                : locked 
                    ? 'border-[#708CA9]/20 text-[#708CA9]/20 cursor-not-allowed'
                    : 'border-[#708CA9] text-[#708CA9] hover:border-[#7FEDFA] hover:text-[#7FEDFA]'}
            `}
          >
            <Check className="w-5 h-5" />
            YES
          </button>

          {/* NO BUTTON - Red */}
          <button
            onClick={() => !locked && handleToggle(q.id, AnswerState.NO)}
            disabled={locked}
            className={`
              px-6 py-2 border-2 flex items-center gap-2 font-bold transition-all uppercase
              ${status === AnswerState.NO 
                ? locked
                   ? 'bg-[#FF9580]/10 border-[#FF9580]/30 text-[#FF9580] cursor-not-allowed shadow-none' // Dimmer state
                   : 'bg-[#FF9580] border-[#FF9580] text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(255,149,128,0.5)] translate-y-[-2px]' 
                : locked 
                    ? 'border-[#708CA9]/20 text-[#708CA9]/20 cursor-not-allowed'
                    : 'border-[#708CA9] text-[#708CA9] hover:border-[#FF9580] hover:text-[#FF9580]'}
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
        <h2 className="text-3xl uppercase animate-pulse text-[#708CA9]">>> LOGS</h2>
        <div className="flex items-center gap-2">
            <RetroButton 
                onClick={() => !isToday && setSelectedDate(new Date())} 
                className={`h-full ${isToday ? 'opacity-50 cursor-default' : ''}`}
                title="Jump to Today"
                variant="secondary"
                disabled={isToday}
            >
                TODAY
            </RetroButton>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handlePrevDay}
                    className="h-10 w-10 flex items-center justify-center text-[#708CA9] hover:text-[#8AFF80] hover:scale-110 transition-all"
                    title="Previous Day"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <DatePicker date={selectedDate} onChange={setSelectedDate} />
                <button 
                    onClick={handleNextDay}
                    disabled={isToday}
                    className={`h-10 w-10 flex items-center justify-center transition-all ${isToday ? 'opacity-30 cursor-not-allowed text-[#708CA9]' : 'text-[#708CA9] hover:text-[#8AFF80] hover:scale-110'}`}
                    title="Next Day"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
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
                RECORDS [{dateStr}]
             </h3>
             <RetroButton 
                variant={!isRecordLocked ? 'primary' : 'secondary'} 
                onClick={handleUnlockClick}
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

      {/* PAST DATE UNLOCK CONFIRMATION MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0B0D0F] border-2 border-[#FF9580] p-6 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(255,149,128,0.3)] relative animate-in zoom-in-95 duration-200 font-mono">
                <div className="absolute top-0 left-0 bg-[#FF9580] text-[#0B0D0F] px-2 py-1 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> PARADOX_WARNING
                </div>
                
                <div className="mt-6 text-[#FF9580] space-y-4 text-sm leading-relaxed">
                    <p className="font-bold text-lg border-b border-[#FF9580]/30 pb-2">
                        ATTEMPTING TO MODIFY HISTORICAL RECORD
                    </p>
                    <p>
                        "I understand that the truth will not change just because I'm changing the record of it, and that very knowledge of the actual truth cannot be destroyed from existence as truth will always prevail in the end."
                    </p>
                    <p className="text-[#708CA9] text-xs italic">
                        >> Proceeding will grant write access to finalized time blocks.
                    </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <RetroButton 
                        variant="secondary" 
                        onClick={() => setShowUnlockModal(false)}
                    >
                        CANCEL
                    </RetroButton>
                    <RetroButton 
                        variant="danger" 
                        onClick={confirmUnlock}
                    >
                        I UNDERSTAND
                    </RetroButton>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
