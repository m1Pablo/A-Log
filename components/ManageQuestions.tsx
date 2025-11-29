
import React, { useState } from 'react';
import { Question, DAYS_OF_WEEK, AnswerState } from '../types';
import { RetroButton } from './RetroButton';
import { Trash2, Plus, Save, Download, Database, HelpCircle, Edit3, RefreshCw, Archive, RefreshCcw, X, AlertTriangle } from 'lucide-react';
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
  const [desiredOutcome, setDesiredOutcome] = useState<AnswerState>(AnswerState.YES);
  const [isAdding, setIsAdding] = useState(false);

  // Danger Zone Modal
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  const toggleDay = (dayIndex: number) => {
    if (schedule.includes(dayIndex)) {
      setSchedule(schedule.filter(d => d !== dayIndex));
    } else {
      setSchedule([...schedule, dayIndex].sort());
    }
  };

  const toggleQuestionDay = (q: Question, dayIndex: number) => {
    if (q.isArchived) return;
    const currentSchedule = q.schedule;
    let newSchedule;
    if (currentSchedule.includes(dayIndex)) {
        newSchedule = currentSchedule.filter(d => d !== dayIndex);
    } else {
        newSchedule = [...currentSchedule, dayIndex].sort();
    }
    onUpdate({ ...q, schedule: newSchedule });
  };

  const toggleDesiredOutcome = (q: Question) => {
    if (q.isArchived) return;
    const newOutcome = q.desiredOutcome === AnswerState.YES ? AnswerState.NO : AnswerState.YES;
    onUpdate({ ...q, desiredOutcome: newOutcome });
  };

  const toggleArchive = (q: Question) => {
    onUpdate({ ...q, isArchived: q.isArchived ? 0 : 1 });
  };

  const handleSave = () => {
    if (!newText.trim() || schedule.length === 0) return;
    
    // projectId is handled by the parent 'onAdd' wrapper in App.tsx
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      projectId: '', // Placeholder, will be overwritten by App.tsx
      text: newText,
      schedule,
      desiredOutcome,
      createdAt: Date.now(),
      isArchived: 0
    };
    
    onAdd(newQuestion);
    setNewText('');
    setSchedule([0, 1, 2, 3, 4, 5, 6]);
    setDesiredOutcome(AnswerState.YES);
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

            <div className="mb-4">
               <label className="block mb-2 text-[#8AFF80]">TARGET_GOAL:</label>
               <div className="flex gap-4">
                   <button 
                       onClick={() => setDesiredOutcome(AnswerState.YES)}
                       className={`flex-1 p-2 border-2 text-center uppercase font-bold transition-all ${desiredOutcome === AnswerState.YES ? 'bg-[#7FEDFA] text-[#0B0D0F] border-[#7FEDFA]' : 'text-[#708CA9] border-[#708CA9]'}`}
                   >
                       GOAL: YES
                   </button>
                   <button 
                       onClick={() => setDesiredOutcome(AnswerState.NO)}
                       className={`flex-1 p-2 border-2 text-center uppercase font-bold transition-all ${desiredOutcome === AnswerState.NO ? 'bg-[#FF9580] text-[#0B0D0F] border-[#FF9580]' : 'text-[#708CA9] border-[#708CA9]'}`}
                   >
                       GOAL: NO
                   </button>
               </div>
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

        {questions.map(q => {
          const isArchived = !!q.isArchived;
          return (
          <div key={q.id} className={`border-2 p-4 flex flex-col md:flex-row items-start md:items-center justify-between transition-colors bg-[#0B0D0F] group gap-4 ${isArchived ? 'border-[#708CA9]/30 opacity-60' : 'border-[#708CA9] hover:border-[#8AFF80]'}`}>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2">
                 <button 
                    onClick={() => toggleDesiredOutcome(q)}
                    disabled={isArchived}
                    title="Click to toggle Goal"
                    className={`
                        text-xs font-bold px-2 py-0.5 border flex items-center gap-1 transition-all
                        ${q.desiredOutcome === AnswerState.YES 
                            ? 'text-[#7FEDFA] border-[#7FEDFA] hover:bg-[#7FEDFA]/10' 
                            : 'text-[#FF9580] border-[#FF9580] hover:bg-[#FF9580]/10'}
                        ${isArchived ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:brightness-110 active:scale-95'}
                 `}>
                    <RefreshCw className="w-3 h-3" />
                    GOAL: {q.desiredOutcome}
                 </button>
                 {isArchived && (
                    <span className="text-xs font-bold bg-[#708CA9] text-[#0B0D0F] px-2 py-0.5 border border-[#708CA9]">
                        ARCHIVED
                    </span>
                 )}
              </div>
              <div className={`text-xl font-bold transition-colors ${isArchived ? 'text-[#708CA9] decoration-line-through' : 'text-[#708CA9] group-hover:text-[#8AFF80]'}`}>
                {q.text}
              </div>
              
              <div className="mt-3 flex items-center gap-4">
                <span className="text-xs text-[#708CA9]/60 uppercase flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> SCHEDULE:
                </span>
                <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day, idx) => (
                        <button
                            key={day}
                            onClick={() => toggleQuestionDay(q, idx)}
                            disabled={isArchived}
                            className={`
                                w-6 h-6 text-[10px] font-bold border flex items-center justify-center transition-all
                                ${q.schedule.includes(idx) 
                                    ? 'bg-[#8AFF80] text-[#0B0D0F] border-[#8AFF80]' 
                                    : 'bg-transparent text-[#708CA9] border-[#708CA9] opacity-50 hover:opacity-100 hover:border-[#8AFF80] hover:text-[#8AFF80]'}
                                ${isArchived ? 'cursor-not-allowed opacity-40' : ''}
                            `}
                            title={day}
                        >
                            {day.charAt(0)}
                        </button>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 border-l border-[#708CA9]/30 pl-4">
              <button 
                onClick={() => toggleArchive(q)}
                className={`p-2 transition-all border-2 ${isArchived ? 'text-[#8AFF80] border-transparent hover:border-[#8AFF80]' : 'text-[#708CA9] border-transparent hover:border-[#708CA9] hover:bg-[#708CA9]/10'}`}
                title={isArchived ? "Restore Question" : "Archive Question"}
              >
                {isArchived ? <RefreshCcw className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
              </button>
              
              <div className="h-6 w-px bg-[#708CA9]/30 mx-1"></div>

              <button 
                onClick={() => setQuestionToDelete(q)}
                className="p-2 text-[#FF9580] hover:bg-[#FF9580] hover:text-[#0B0D0F] border-2 border-transparent hover:border-[#FF9580] transition-all"
                title="Delete Question (Danger)"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          );
        })}

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

      {/* DANGER ZONE DELETE MODAL */}
      {questionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#0B0D0F] border-2 border-[#FF9580] p-6 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(255,149,128,0.3)] relative animate-in zoom-in-95 duration-200">
                  <div className="absolute top-0 left-0 bg-[#FF9580] text-[#0B0D0F] px-2 py-1 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> PERMANENT_DELETION
                  </div>
                  <button 
                    onClick={() => setQuestionToDelete(null)}
                    className="absolute top-2 right-2 text-[#708CA9] hover:text-[#FF9580]"
                  >
                      <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-xl text-[#FF9580] mt-6 mb-4 font-bold uppercase">DELETE QUESTION?</h3>
                  <div className="text-[#708CA9] mb-6 text-sm leading-relaxed border-l-4 border-[#FF9580] pl-4">
                      <p className="mb-2 text-[#FF9580] font-bold">WARNING: DATA LOSS IMMINENT</p>
                      <p>This will permanently remove the question:</p>
                      <p className="font-mono bg-[#FF9580]/10 p-2 my-2 text-[#FF9580] border border-[#FF9580]/30">"{questionToDelete.text}"</p>
                      <p>...and <span className="text-[#FF9580] underline decoration-wavy">ALL associated historical logs</span>.</p>
                      <p className="mt-2 text-xs italic opacity-70">Tip: Use the 'Archive' button instead if you just want to stop seeing this question.</p>
                  </div>

                  <div className="flex justify-end gap-3">
                      <RetroButton 
                          variant="secondary" 
                          onClick={() => setQuestionToDelete(null)}
                      >
                          CANCEL
                      </RetroButton>
                      <RetroButton 
                          variant="danger" 
                          onClick={() => {
                              onDelete(questionToDelete.id);
                              setQuestionToDelete(null);
                          }}
                          icon={<Trash2 className="w-4 h-4"/>}
                      >
                          CONFIRM DELETION
                      </RetroButton>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
