import React, { useMemo } from 'react';
import { Question, AnswerState, DailyLog } from '../types';
import { Check, X } from 'lucide-react';

interface DailyViewProps {
  questions: Question[];
  logs: DailyLog;
  onUpdateLog: (date: string, questionId: string, answer: AnswerState) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({ questions, logs, onUpdateLog }) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  const todaysQuestions = useMemo(() => {
    return questions.filter(q => q.schedule.includes(dayOfWeek));
  }, [questions, dayOfWeek]);

  const getStatus = (qId: string) => {
    return logs[dateStr]?.[qId] || AnswerState.UNANSWERED;
  };

  const setAnswer = (qId: string, answer: AnswerState) => {
    onUpdateLog(dateStr, qId, answer);
  };

  const handleYes = (qId: string) => {
    const current = getStatus(qId);
    if (current === AnswerState.YES) {
      setAnswer(qId, AnswerState.UNANSWERED); // Toggle off
    } else {
      setAnswer(qId, AnswerState.YES);
    }
  };

  const handleNo = (qId: string) => {
    const current = getStatus(qId);
    if (current === AnswerState.NO) {
      setAnswer(qId, AnswerState.UNANSWERED); // Toggle off
    } else {
      setAnswer(qId, AnswerState.NO);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-[#708CA9] pb-4 mb-6">
        <h2 className="text-3xl uppercase animate-pulse text-[#708CA9]">>> Today's Objectives [{dateStr}]</h2>
      </div>

      {todaysQuestions.length === 0 ? (
        <div className="text-[#708CA9] text-xl border-2 border-[#708CA9] border-dashed p-8 text-center">
          NO OBJECTIVES SCHEDULED FOR TODAY. REST MODE ENGAGED.
        </div>
      ) : (
        <div className="grid gap-4">
          {todaysQuestions.map(q => {
            const status = getStatus(q.id);
            
            return (
              <div 
                key={q.id} 
                className="border-2 border-[#708CA9]/30 bg-[#0B0D0F] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-[#708CA9] transition-all"
              >
                <span className="text-xl md:text-2xl font-bold tracking-wider text-[#708CA9]">
                  {q.text}
                </span>
                
                <div className="flex items-center gap-3">
                  {/* YES BUTTON */}
                  <button
                    onClick={() => handleYes(q.id)}
                    className={`
                      px-6 py-2 border-2 flex items-center gap-2 font-bold transition-all uppercase
                      ${status === AnswerState.YES 
                        ? 'bg-[#8AFF80] border-[#8AFF80] text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(138,255,128,0.5)] translate-y-[-2px]' 
                        : 'border-[#708CA9] text-[#708CA9] hover:border-[#8AFF80] hover:text-[#8AFF80]'}
                    `}
                  >
                    <Check className="w-5 h-5" />
                    YES
                  </button>

                  {/* NO BUTTON */}
                  <button
                    onClick={() => handleNo(q.id)}
                    className={`
                      px-6 py-2 border-2 flex items-center gap-2 font-bold transition-all uppercase
                      ${status === AnswerState.NO 
                        ? 'bg-[#FF80BF] border-[#FF80BF] text-[#0B0D0F] shadow-[4px_4px_0px_0px_rgba(255,128,191,0.5)] translate-y-[-2px]' 
                        : 'border-[#708CA9] text-[#708CA9] hover:border-[#FF80BF] hover:text-[#FF80BF]'}
                    `}
                  >
                    <X className="w-5 h-5" />
                    NO
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-8 text-[#708CA9] text-sm">
        <p>HINT: SELECT STATUS [YES] OR [NO]. CLICK AGAIN TO DESELECT.</p>
      </div>
    </div>
  );
};