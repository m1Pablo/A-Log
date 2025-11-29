import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initDB, dbAddQuestion, dbDeleteQuestion, dbUpdateLog, dbAddProject, dbDeleteProject } from './services/storageService';
import { AppState, AnswerState, Question, Project } from './types';
import { DailyView } from './components/DailyView';
import { ManageQuestions } from './components/ManageQuestions';
import { StatsView } from './components/StatsView';
import { ListTodo, Settings, Monitor, Database, Plus, Folder, FolderOpen, Trash2, Info, AlertTriangle, X } from 'lucide-react';
import { RetroButton } from './components/RetroButton';

enum View {
  DAILY = 'DAILY',
  MANAGE = 'MANAGE',
  STATS = 'STATS',
  ABOUT = 'ABOUT'
}

function App() {
  const [state, setState] = useState<AppState>({ projects: [], questions: [], logs: {} });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DAILY);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Project Creation Ref
  const createProjectRef = useRef<HTMLDivElement>(null);

  // Delete Project Modal State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

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

  // Handle outside clicks and ESC for Project Creation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createProjectRef.current && !createProjectRef.current.contains(event.target as Node)) {
        setIsCreatingProject(false);
        setNewProjectName('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCreatingProject(false);
        setNewProjectName('');
      }
    };

    if (isCreatingProject) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreatingProject]);

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

  const requestDeleteProject = (e: React.MouseEvent, p: Project) => {
      e.stopPropagation();
      setProjectToDelete(p);
      setDeleteConfirmationInput('');
  };

  const executeDeleteProject = async () => {
      if (!projectToDelete) return;
      const id = projectToDelete.id;

      setState(prev => ({
         ...prev,
         projects: prev.projects.filter(p => p.id !== id),
         questions: prev.questions.filter(q => q.projectId !== id)
      }));

      if (activeProjectId === id) {
          // Switch to another project if available, or null
          const remaining = state.projects.find(p => p.id !== id);
          setActiveProjectId(remaining ? remaining.id : null);
      }

      await dbDeleteProject(id);
      setProjectToDelete(null);
  };

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
          <p className="text-xs text-[#708CA9] mt-2">v1.0.0</p>
        </div>
        
        {/* Project Selector */}
        <div className="p-4 border-b-2 border-[#708CA9] bg-[#0B0D0F]">
            <div className="text-xs text-[#708CA9] uppercase font-bold mb-2 flex justify-between items-center">
                <span>ACTIVE_PROJECT</span>
                <button 
                  onClick={() => setIsCreatingProject(!isCreatingProject)} 
                  className={`hover:text-[#8AFF80] transition-transform ${isCreatingProject ? 'rotate-45' : ''}`}
                  title={isCreatingProject ? "Cancel" : "Create Project"}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            
            {isCreatingProject && (
                <div ref={createProjectRef} className="mb-4 border border-[#708CA9] p-2 animate-in fade-in slide-in-from-top-2 relative">
                    <input 
                        type="text" 
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="PROJECT NAME"
                        className="w-full bg-[#0B0D0F] text-[#8AFF80] text-sm outline-none placeholder-[#708CA9]/50 mb-2 uppercase"
                        autoFocus
                    />
                    <RetroButton onClick={handleCreateProject} className="w-full py-1 text-xs">CREATE</RetroButton>
                    <div className="text-[10px] text-[#708CA9]/50 text-center mt-1">ESC to cancel</div>
                </div>
            )}

            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {state.projects.map(p => (
                    <div 
                        key={p.id}
                        onClick={() => setActiveProjectId(p.id)}
                        className={`
                            group flex items-center justify-between px-3 py-2 cursor-pointer transition-all border
                            ${activeProjectId === p.id 
                                ? 'bg-[#708CA9]/20 border-[#8AFF80] text-[#8AFF80]' 
                                : 'border-transparent hover:border-[#708CA9] text-[#708CA9] hover:bg-[#708CA9]/10'}
                        `}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            {activeProjectId === p.id ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0" />}
                            <span className="text-sm font-bold truncate">{p.name}</span>
                        </div>
                        {/* Delete button: Visible if Active OR on Hover (Group Hover), only if more than 1 project exists */}
                        {state.projects.length > 1 && (
                            <button 
                                onClick={(e) => requestDeleteProject(e, p)}
                                className={`
                                    text-[#FF9580] hover:bg-[#FF9580] hover:text-[#0B0D0F] p-1 rounded-sm transition-opacity
                                    ${activeProjectId === p.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                `}
                                title="Delete Project"
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
          <NavButton 
            active={currentView === View.ABOUT} 
            onClick={() => setCurrentView(View.ABOUT)}
            icon={<Info />}
            label="ABOUT"
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
                <StatsView state={{...state, questions: activeQuestions}} />
              )}
              {currentView === View.ABOUT && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                     <div className="border-b-2 border-[#708CA9] pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-3xl uppercase animate-pulse text-[#708CA9]">>> ABOUT</h2>
                     </div>
                     <div className="border-2 border-[#708CA9] p-8 bg-[#0B0D0F] shadow-[8px_8px_0px_0px_rgba(112,140,169,0.3)]">
                        <h3 className="text-2xl text-[#8AFF80] mb-6 font-bold uppercase">PHILOSOPHY OF A-LOG</h3>
                        <div className="space-y-6 text-lg leading-relaxed text-[#708CA9]">
                            <p>
                                <span className="text-[#8AFF80] font-bold">A-Log</span> stands for <span className="text-[#8AFF80]">A</span>ccountability<span className="text-[#8AFF80]">-Log</span>. It is designed for those who reject the ephemeral and cloud-dependent nature of modern applications.
                            </p>
                            <p>
                                In a world of infinite distraction, <span className="text-[#8AFF80]">binary choices</span> are a mechanism for truth. You either did the work, or you didn't. There are no excuses, no partial credits, and no "maybe" states.
                            </p>
                            <div className="border-l-4 border-[#8AFF80] pl-6 italic text-[#8AFF80]/80 py-2 my-8">
                                "The only metric that matters is the record you keep with yourself."
                            </div>
                            <h4 className="text-[#8AFF80] font-bold uppercase mt-8 mb-2 text-sm tracking-widest">PRIVACY & OWNERSHIP</h4>
                            <p>
                                This application follows a <span className="text-[#8AFF80]">Local-First</span> architecture. Your data is stored in a secure SQLite container directly within your browser. There is no cloud backend, no tracking, and no data harvesting. You own your database file and can export it at any time.
                            </p>
                            <h4 className="text-[#8AFF80] font-bold uppercase mt-8 mb-2 text-sm tracking-widest">INTENTIONAL FRICTION</h4>
                            <p>
                                The interface is designed to add intentional friction to modifying the past. Once a day is logged, the record is locked. Unlocking it is a deliberate action, serving as a psychological barrier to rewriting history.
                            </p>
                        </div>
                     </div>
                 </div>
              )}
             </>
          )}
        </div>
      </main>

      {/* DELETE PROJECT CONFIRMATION MODAL */}
      {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#0B0D0F] border-2 border-[#FF9580] p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(255,149,128,0.3)] relative animate-in zoom-in-95 duration-200">
                  <div className="absolute top-0 left-0 bg-[#FF9580] text-[#0B0D0F] px-2 py-1 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> DANGER_ZONE
                  </div>
                  <button 
                    onClick={() => setProjectToDelete(null)}
                    className="absolute top-2 right-2 text-[#708CA9] hover:text-[#FF9580]"
                  >
                      <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-xl text-[#FF9580] mt-6 mb-4 font-bold uppercase">DELETE PROJECT?</h3>
                  <p className="text-[#708CA9] mb-4 text-sm">
                      This action will permanently delete <span className="text-[#FF9580] font-bold">"{projectToDelete.name}"</span> and all associated logs. This cannot be undone.
                  </p>
                  
                  <div className="mb-6">
                      <label className="block text-xs text-[#708CA9] mb-2 uppercase">
                          Type <span className="text-[#FF9580] font-bold">{projectToDelete.name}</span> to confirm:
                      </label>
                      <input 
                          type="text"
                          value={deleteConfirmationInput}
                          onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                          className="w-full bg-[#0B0D0F] border-2 border-[#708CA9] p-2 text-[#FF9580] focus:border-[#FF9580] outline-none font-bold uppercase"
                          autoFocus
                          placeholder={projectToDelete.name}
                      />
                  </div>

                  <div className="flex justify-end gap-3">
                      <RetroButton 
                          variant="secondary" 
                          onClick={() => setProjectToDelete(null)}
                      >
                          CANCEL
                      </RetroButton>
                      <RetroButton 
                          variant="danger" 
                          onClick={executeDeleteProject}
                          disabled={deleteConfirmationInput !== projectToDelete.name}
                          className={deleteConfirmationInput !== projectToDelete.name ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                          DELETE
                      </RetroButton>
                  </div>
              </div>
          </div>
      )}
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