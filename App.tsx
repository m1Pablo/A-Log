import React, { useState, useEffect } from 'react';
import { loadState, saveState } from './services/storageService';
import { AppState, AnswerState, Question } from './types';
import { DailyView } from './components/DailyView';
import { ManageQuestions } from './components/ManageQuestions';
import { StatsView } from './components/StatsView';
import { LayoutDashboard, ListTodo, Settings, Monitor, Terminal } from 'lucide-react';

enum View {
  DAILY = 'DAILY',
  MANAGE = 'MANAGE',
  STATS = 'STATS'
}

function App() {
  const [state, setState] = useState<AppState>({ questions: [], logs: {} });
  const [currentView, setCurrentView] = useState<View>(View.DAILY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveState(state);
    }
  }, [state, isLoaded]);

  const updateLog = (date: string, qId: string, answer: AnswerState) => {
    setState(prev => ({
      ...prev,
      logs: {
        ...prev.logs,
        [date]: {
          ...(prev.logs[date] || {}),
          [qId]: answer
        }
      }
    }));
  };

  const addQuestion = (q: Question) => {
    setState(prev => ({
      ...prev,
      questions: [...prev.questions, q]
    }));
  };

  const deleteQuestion = (id: string) => {
    setState(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  if (!isLoaded) return <div className="bg-[#0B0D0F] text-[#8AFF80] h-screen w-screen flex items-center justify-center font-mono">LOADING SYSTEM...</div>;

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#708CA9] font-mono flex flex-col md:flex-row overflow-hidden relative crt">
      {/* Sidebar / Navigation */}
      <nav className="md:w-64 border-r-2 border-[#708CA9] flex flex-col bg-[#0B0D0F] z-10">
        <div className="p-6 border-b-2 border-[#708CA9]">
          <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-2 text-[#8AFF80]">
             <Terminal className="w-8 h-8" />
             BitJournal
          </h1>
          <p className="text-xs text-[#708CA9] mt-2">v1.1.0 [MODERN_UI]</p>
        </div>
        
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavButton 
            active={currentView === View.DAILY} 
            onClick={() => setCurrentView(View.DAILY)}
            icon={<ListTodo />}
            label="DAILY_LOGS"
          />
          <NavButton 
            active={currentView === View.STATS} 
            onClick={() => setCurrentView(View.STATS)}
            icon={<Monitor />}
            label="ANALYTICS"
          />
          <NavButton 
            active={currentView === View.MANAGE} 
            onClick={() => setCurrentView(View.MANAGE)}
            icon={<Settings />}
            label="CONFIG"
          />
        </div>

        <div className="p-4 text-xs text-[#708CA9] border-t-2 border-[#708CA9]">
          SYSTEM STATUS: ONLINE<br/>
          MEMORY: {Object.keys(state.logs).length} RECORDS
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 bg-[#0B0D0F]">
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
          {currentView === View.DAILY && (
            <DailyView 
              questions={state.questions} 
              logs={state.logs} 
              onUpdateLog={updateLog} 
            />
          )}
          {currentView === View.MANAGE && (
            <ManageQuestions 
              questions={state.questions} 
              onAdd={addQuestion} 
              onDelete={deleteQuestion} 
            />
          )}
          {currentView === View.STATS && (
            <StatsView state={state} />
          )}
        </div>
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 text-lg transition-all border-2
      ${active 
        ? 'bg-[#708CA9] text-[#0B0D0F] border-[#708CA9] shadow-[4px_4px_0px_0px_rgba(112,140,169,0.4)]' 
        : 'border-transparent hover:border-[#708CA9] hover:text-[#8AFF80] text-[#708CA9]'}
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;