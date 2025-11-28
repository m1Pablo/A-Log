
import React, { useState, useEffect, useMemo } from 'react';
import { initDB, dbAddQuestion, dbDeleteQuestion, dbUpdateLog, dbAddProject, dbDeleteProject } from './services/storageService';
import { AppState, AnswerState, Question, Project } from './types';
import { DailyView } from './components/DailyView';
import { ManageQuestions } from './components/ManageQuestions';
import { StatsView } from './components/StatsView';
import { ListTodo, Settings, Monitor, Database, Plus, Folder, FolderOpen, Trash2 } from 'lucide-react';
import { RetroButton } from './components/RetroButton';

enum View {
  DAILY = 'DAILY',
  MANAGE = 'MANAGE',
  STATS = 'STATS'
}

function App() {
  const [state, setState] = useState<AppState>({ projects: [], questions: [], logs: {} });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DAILY);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const loadedState = await initDB();
        setState(loadedState);
        // Default to first project if exists
        if (loadedState.projects.length > 0) {
            setActiveProjectId(loadedState.projects[0].id);
        }
        setIsLoaded(true);
      } catch (e) {
        console.error("Failed to init DB", e);
      }
    };
    init();
  }, []);

  // Filter Data for Active Project
  const activeQuestions = useMemo(() => {
      if (!activeProjectId) return [];
      return state.questions.filter(q => q.projectId === activeProjectId);
  }, [state.questions, activeProjectId]);

  const activeProject = useMemo(() => {
      return state.projects.find(p => p.id === activeProjectId);
  }, [state.projects, activeProjectId]);


  // --- Actions ---

  const handleCreateProject = async () => {
      if (!newProjectName.trim()) return;
      const newProject: Project = {
          id: crypto.randomUUID(),
          name: newProjectName.toUpperCase(),
          createdAt: Date.now()
      };
      
      // Optimistic
      setState(prev => ({...prev, projects: [...prev.projects, newProject]}));
      setActiveProjectId(newProject.id);
      setNewProjectName('');
      setIsCreatingProject(false);
      
      // DB
      await dbAddProject(newProject);
  };

  const handleDeleteProject = async (id: string) => {
      if (confirm("DELETE PROJECT? THIS CANNOT BE UNDONE.")) {
          setState(prev => ({
             ...prev,
             projects: prev.projects.filter(p => p.id !== id),
             questions: prev.questions.filter(q => q.projectId !== id)
          }));
          if (activeProjectId === id) {
              setActiveProjectId(state.projects.find(p => p.id !== id)?.id || null);
          }
          await dbDeleteProject(id);
      }
  }

  const updateLog = (date: string, qId: string, answer: AnswerState) => {
    if (!activeProjectId) return;
    // Optimistic UI Update
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
    // Async DB Update
    dbUpdateLog(date, qId, activeProjectId, answer);
  };

  const addQuestion = (q: Question) => {
    // Optimistic UI Update
    setState(prev => ({
      ...prev,
      questions: [...prev.questions, q]
    }));
    // Async DB Update
    dbAddQuestion(q);
  };

  const updateQuestion = (q: Question) => {
    // Optimistic UI Update
    setState(prev => ({
      ...prev,
      questions: prev.questions.map(existing => existing.id === q.id ? q : existing)
    }));
    // Async DB Update
    dbAddQuestion(q);
  };

  const deleteQuestion = (id: string) => {
    // Optimistic UI Update
    setState(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
    // Async DB Update
    dbDeleteQuestion(id);
  };

  if (!isLoaded) return (
    <div className="bg-[#0B0D0F] text-[#8AFF80] h-screen w-screen flex flex-col gap-4 items-center justify-center font-mono">
       <Database className="w-12 h-12 animate-bounce" />
       <div className="text-2xl">INITIALIZING SECURE LOCAL DATABASE...</div>
       <div className="text-[#708CA9] text-sm">ENCRYPTING LOCALLY STORED ASSETS</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#708CA9] font-mono flex flex-col md:flex-row overflow-hidden relative crt">
      {/* Sidebar / Navigation */}
      <nav className="md:w-72 border-r-2 border-[#708CA9] flex flex-col bg-[#0B0D0F] z-10">
        <div className="p-6 border-b-2 border-[#708CA9]">
          <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-2 text-[#8AFF80]">
             A-Log
          </h1>
          <p className="text-xs text-[#708CA9] mt-2">v0.2.0 [PROJECT_SUPPORT]</p>
        </div>
        
        {/* Project Selector */}
        <div className="p-4 border-b-2 border-[#708CA9] bg-[#0B0D0F]">
            <div className="text-xs text-[#708CA9] uppercase font-bold mb-2 flex justify-between items-center">
                <span>ACTIVE_PROJECT</span>
                <button onClick={() => setIsCreatingProject(!isCreatingProject)} className="hover:text-[#8AFF80]">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            
            {isCreatingProject && (
                <div className="mb-4 border border-[#708CA9] p-2 animate-in fade-in slide-in-from-top-2">
                    <input 
                        type="text" 
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="PROJECT NAME"
                        className="w-full bg-[#0B0D0F] text-[#8AFF80] text-sm outline-none placeholder-[#708CA9]/50 mb-2 uppercase"
                        autoFocus
                    />
                    <RetroButton onClick={handleCreateProject} className="w-full py-1 text-xs">CREATE</RetroButton>
                </div>
            )}

            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {state.projects.map(p => (
                    <div 
                        key={p.id}
                        onClick={() => setActiveProjectId(p.id)}
                        className={`
                            flex items-center justify-between px-3 py-2 cursor-pointer transition-all border
                            ${activeProjectId === p.id 
                                ? 'bg-[#708CA9]/20 border-[#8AFF80] text-[#8AFF80]' 
                                : 'border-transparent hover:border-[#708CA9] text-[#708CA9] hover:bg-[#708CA9]/10'}
                        `}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            {activeProjectId === p.id ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0" />}
                            <span className="text-sm font-bold truncate">{p.name}</span>
                        </div>
                        {activeProjectId === p.id && state.projects.length > 1 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                                className="text-[#FF80BF] hover:bg-[#FF80BF] hover:text-[#0B0D0F] p-1 rounded-sm"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavButton 
            active={currentView === View.DAILY} 
            onClick={() => setCurrentView(View.DAILY)}
            icon={<ListTodo />}
            label="LOGS"
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
            label="SETTINGS"
          />
        </div>

        <div className="p-4 text-xs text-[#708CA9] border-t-2 border-[#708CA9]">
          SYSTEM STATUS: ONLINE<br/>
          DB: SQLITE (LOCAL)<br/>
          RECORDS: {Object.keys(state.logs).length}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 bg-[#0B0D0F]">
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
          {!activeProjectId ? (
              <div className="flex flex-col items-center justify-center h-full text-[#708CA9] gap-4 opacity-50">
                  <Folder className="w-16 h-16" />
                  <div>NO PROJECT SELECTED. CREATE OR SELECT ONE.</div>
              </div>
          ) : (
             <>
              {currentView === View.DAILY && (
                <DailyView 
                  questions={activeQuestions} 
                  logs={state.logs} 
                  onUpdateLog={updateLog} 
                />
              )}
              {currentView === View.MANAGE && (
                <ManageQuestions 
                  questions={activeQuestions} 
                  onAdd={(q) => addQuestion({...q, projectId: activeProjectId})} 
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion} 
                />
              )}
              {currentView === View.STATS && (
                // We pass a filtered State object to StatsView so it only processes relevant data
                <StatsView state={{...state, questions: activeQuestions}} />
              )}
             </>
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
