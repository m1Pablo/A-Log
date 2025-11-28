import React, { useState } from 'react';
import { Question, DAYS_OF_WEEK } from '../types';
import { RetroButton } from './RetroButton';
import { Trash2, Plus, Save } from 'lucide-react';

interface ManageQuestionsProps {
  questions: Question[];
  onAdd: (q: Question) => void;
  onDelete: (id: string) => void;
}

export const ManageQuestions: React.FC<ManageQuestionsProps> = ({ questions, onAdd, onDelete }) => {
  const [newText, setNewText] = useState('');
  const [schedule, setSchedule] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isAdding, setIsAdding] = useState(false);

  const toggleDay = (dayIndex: number) => {
    if (schedule.includes(dayIndex)) {
      setSchedule(schedule.filter(d => d !== dayIndex));
    } else {
      setSchedule([...schedule, dayIndex].sort());
    }
  };

  const handleSave = () => {
    if (!newText.trim() || schedule.length === 0) return;
    
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: newText,
      schedule,
      createdAt: Date.now()
    };
    
    onAdd(newQuestion);
    setNewText('');
    setSchedule([0, 1, 2, 3, 4, 5, 6]);
    setIsAdding(false);
  };

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-[#708CA9] pb-4 flex justify-between items-center">
        <h2 className="text-3xl uppercase animate-pulse text-[#708CA9]">>> Configure Database</h2>
        {!isAdding && (
          <RetroButton onClick={() => setIsAdding(true)} icon={<Plus className="w-4 h-4" />}>
            New Entry
          </RetroButton>
        )}
      </div>

      {isAdding && (
        <div className="border-2 border-[#8AFF80] p-6 bg-[#8AFF80]/5 shadow-[8px_8px_0px_0px_rgba(138,255,128,0.2)]">
          <h3 className="text-xl mb-4 bg-[#8AFF80] text-[#0B0D0F] inline-block px-2">NEW_PARAMETER_INPUT</h3>
          
          <div className="mb-4">
            <label className="block mb-2 text-[#8AFF80]">QUERY_STRING:</label>
            <input
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              className="w-full bg-[#0B0D0F] border-2 border-[#708CA9] p-3 text-[#8AFF80] focus:border-[#8AFF80] outline-none font-mono text-lg placeholder-[#708CA9]"
              placeholder="E.g. Did you read 10 pages?"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-[#8AFF80]">EXECUTION_SCHEDULE:</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => toggleDay(idx)}
                  className={`
                    px-3 py-1 border-2 text-sm uppercase transition-colors
                    ${schedule.includes(idx) 
                      ? 'bg-[#8AFF80] text-[#0B0D0F] border-[#8AFF80]' 
                      : 'bg-[#0B0D0F] text-[#708CA9] border-[#708CA9] hover:border-[#8AFF80] hover:text-[#8AFF80]'}
                  `}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
             <RetroButton variant="secondary" onClick={() => setIsAdding(false)}>
              CANCEL
            </RetroButton>
            <RetroButton onClick={handleSave} icon={<Save className="w-4 h-4" />}>
              COMMIT
            </RetroButton>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="border-2 border-[#708CA9] p-4 flex items-center justify-between hover:border-[#8AFF80] transition-colors bg-[#0B0D0F] group">
            <div>
              <div className="text-xl font-bold text-[#708CA9] group-hover:text-[#8AFF80] transition-colors">{q.text}</div>
              <div className="text-xs text-[#708CA9]/60 mt-1 uppercase flex gap-2">
                <span>ID: {q.id.split('-')[0]}</span>
                <span>|</span>
                <span>
                   DAYS: {q.schedule.length === 7 ? 'ALL' : q.schedule.map(d => DAYS_OF_WEEK[d].substring(0,2)).join(',')}
                </span>
              </div>
            </div>
            <button 
              onClick={() => onDelete(q.id)}
              className="p-2 text-[#FF80BF] hover:bg-[#FF80BF] hover:text-[#0B0D0F] border-2 border-transparent hover:border-[#FF80BF] transition-all"
              title="Delete Question"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 text-[#708CA9] border-2 border-[#708CA9] border-dashed">
            DATABASE EMPTY. INITIALIZE FIRST QUESTION.
          </div>
        )}
      </div>
    </div>
  );
};