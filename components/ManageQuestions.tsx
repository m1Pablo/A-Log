
import React, { useState } from 'react';
import { Question, DAYS_OF_WEEK } from '../types';
import { RetroButton } from './RetroButton';
import { Trash2, Plus, Save, Download, Database, HelpCircle, Edit3 } from 'lucide-react';
import { exportSQLiteFile } from '../services/storageService';

interface ManageQuestionsProps {
  questions: Question[];
  onAdd: (q: Question) => void;
  onUpdate: (q: Question) => void;
  onDelete: (id: string) => void;
}

export const ManageQuestions: React.FC<ManageQuestionsProps> = ({ questions, onAdd, onUpdate, onDelete }) => {
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

  const toggleQuestionDay = (q: Question, dayIndex: number) => {
    const currentSchedule = q.schedule;
    let newSchedule;
    if (currentSchedule.includes(dayIndex)) {
        newSchedule = currentSchedule.filter(d => d !== dayIndex);
    } else {
        newSchedule = [...currentSchedule, dayIndex].sort();
    }
    onUpdate({ ...q, schedule: newSchedule });
  };

  const handleSave = () => {
    if (!newText.trim() || schedule.length === 0) return;
    
    // projectId is handled by the parent 'onAdd' wrapper in App.tsx
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      projectId: '', // Placeholder, will be overwritten by App.tsx
      text: newText,
      schedule,
      createdAt: Date.now()
    };
    
    onAdd(newQuestion);
    setNewText('');
    setSchedule([0, 1, 2, 3, 4, 5, 6]);
    setIsAdding(false);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "alog_project_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-[#708CA9] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl uppercase animate-pulse text-[#708CA9]">>> SETTINGS</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-[#708CA9] text-sm font-bold uppercase flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              QUESTIONS
           </h3>
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

        {questions.map(q => (
          <div key={q.id} className="border-2 border-[#708CA9] p-4 flex items-center justify-between hover:border-[#8AFF80] transition-colors bg-[#0B0D0F] group">
            <div className="flex-1">
              <div className="text-xl font-bold text-[#708CA9] group-hover:text-[#8AFF80] transition-colors">{q.text}</div>
              
              <div className="mt-3 flex items-center gap-4">
                <span className="text-xs text-[#708CA9]/60 uppercase flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> SCHEDULE:
                </span>
                <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day, idx) => (
                        <button
                            key={day}
                            onClick={() => toggleQuestionDay(q, idx)}
                            className={`
                                w-6 h-6 text-[10px] font-bold border flex items-center justify-center transition-all
                                ${q.schedule.includes(idx) 
                                    ? 'bg-[#8AFF80] text-[#0B0D0F] border-[#8AFF80]' 
                                    : 'bg-transparent text-[#708CA9] border-[#708CA9] opacity-50 hover:opacity-100 hover:border-[#8AFF80] hover:text-[#8AFF80]'}
                            `}
                            title={day}
                        >
                            {day.charAt(0)}
                        </button>
                    ))}
                </div>
              </div>
            </div>
            <button 
              onClick={() => onDelete(q.id)}
              className="ml-4 p-2 text-[#FF80BF] hover:bg-[#FF80BF] hover:text-[#0B0D0F] border-2 border-transparent hover:border-[#FF80BF] transition-all shrink-0"
              title="Delete Question"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-12 text-[#708CA9] border-2 border-[#708CA9] border-dashed">
            DATABASE EMPTY. INITIALIZE FIRST QUESTION FOR THIS PROJECT.
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t-2 border-[#708CA9]/50">
        <h3 className="text-[#708CA9] mb-4 text-sm font-bold uppercase flex items-center gap-2">
          <Database className="w-4 h-4" />
          Data Management
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <RetroButton 
            variant="secondary" 
            onClick={handleExportJSON} 
            icon={<Download className="w-4 h-4" />}
          >
            EXPORT PROJECT CONFIG (JSON)
          </RetroButton>
          <RetroButton 
            variant="primary" 
            onClick={exportSQLiteFile} 
            icon={<Database className="w-4 h-4" />}
          >
            EXPORT FULL DB (.SQLITE)
          </RetroButton>
        </div>
        <p className="mt-2 text-xs text-[#708CA9]/60">
          * A-Log stores all data locally in a secure SQLite container inside your browser. 
          Exporting the DB creates a backup you can inspect with any SQLite viewer.
        </p>
      </div>
    </div>
  );
};
