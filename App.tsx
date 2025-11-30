
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, 
  X, 
  Settings, 
  BarChart2, 
  List, 
  Folder, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { AppState, Project, Question, DailyLog, AnswerState } from './types';
import { 
  initDB, 
  fetchState, 
  dbAddProject, 
  dbAddQuestion, 
  dbUpdateLog, 
  dbDeleteProject, 
  dbDeleteQuestion 
} from './services/storageService';
import { ManageQuestions } from './components/ManageQuestions';
import { DailyView } from './components/DailyView';
import { StatsView } from './components/StatsView';
import { RetroButton } from './components/RetroButton';

// --- About View ---
const AboutView = () => (
  <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="border-b-2 border-[#708CA9] pb-4 mb-6">
        <h2 className="text-3xl uppercase animate-pulse text-[#708CA9]">>> ABOUT_SYSTEM</h2>
      </div>

      <div className="space-y-6 text-[#708CA9] font-mono leading-relaxed border-2 border-[#708CA9]/30 p-8 bg-[#0B0D0F]">
          <h3 className="text-xl text-[#8AFF80] font-bold uppercase mb-4">
            <span className="text-[#8AFF80]">A</span>ccount<span className="text-[#8AFF80]">AB</span>ility <span className="text-[#8AFF80]">Log</span>
          </h3>
          
          <p>
            <strong className="text-[#8AFF80]">A-Log</strong> is a strict, local-first accountability terminal designed for those who value the unvarnished truth of their daily habits.
          </p>

          <p>
            In an era of cloud-syncing and social sharing, true accountability is often performed for others. 
            A-Log is different. It is performed for <strong className="text-[#8AFF80]">YOU</strong>.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-sm">
             <li><strong className="text-[#7FEDFA]">LOCAL FIRST:</strong> Your data lives in your browser's SQLite database. It never leaves your device unless you export it.</li>
             <li><strong className="text-[#7FEDFA]">UNCOMPROMISING:</strong> The interface is designed to reduce friction for honesty, not for engagement.</li>
             <li><strong className="text-[#7FEDFA]">RETRO FUTURE:</strong> Inspired by the terminals of a cyberpunk future where data is the only currency that matters.</li>
          </ul>

          <div className="mt-8 pt-8 border-t border-[#708CA9]/30">
            <p className="text-xs opacity-70">
               SYSTEM VERSION: v2.1.0 // BUILD: STABLE
               <br/>
               DB DRIVER: SQL.JS (WASM)
            </p>
          </div>
      </div>
  </div>
);

const App = () => {
  const [activeView, setActiveView] = useState<'logs' | 'stats' | 'settings' | 'about'>('logs');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [state, setState] = useState<AppState>({ projects: [], questions: [], logs: {} });
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  
  // Project Creation State
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const newProjectInputRef = useRef<HTMLInputElement>(null);
  const newProjectContainerRef = useRef<HTMLDivElement>(null);

  // Project Deletion State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Initialization
  useEffect(() => {
    initDB().then(initialState => {
      setState(initialState);
      // Select first project by default
      if (initialState.projects.length > 0) {
        setActiveProjectId(initialState.projects[0].id);
      }
      
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    });
  }, []);

  // Handle Outside Click & Escape for Project Creation
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (newProjectContainerRef.current && !newProjectContainerRef.current.contains(event.target as Node)) {
              if (isCreatingProject) {
                  setIsCreatingProject(false);
                  setNewProjectName('');
              }
          }
      };

      const handleEscKey = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
              if (isCreatingProject) {
                  setIsCreatingProject(false);
                  setNewProjectName('');
              }
          }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
      
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleEscKey);
      };
  }, [isCreatingProject]);

  const activeProject = useMemo(() => 
    state.projects.find(p => p.id === activeProjectId), 
  [state.projects, activeProjectId]);

  const projectQuestions = useMemo(() => 
    state.questions.filter(q => q.projectId === activeProjectId),
  [state.questions, activeProjectId]);

  // Actions
  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName.toUpperCase(),
      createdAt: Date.now()
    };
    await dbAddProject(newProject);
    const newState = await fetchState();
    setState(newState);
    setActiveProjectId(newProject.id);
    setNewProjectName('');
    setIsCreatingProject(false);
  };

  const handleDeleteProject = async () => {
      if (!projectToDelete) return;
      if (deleteConfirmationInput !== projectToDelete.name) return;

      await dbDeleteProject(projectToDelete.id);
      const newState = await fetchState();
      setState(newState);
      
      // Reset Selection if active was deleted
      if (activeProjectId === projectToDelete.id) {
          if (newState.projects.length > 0) {
              setActiveProjectId(newState.projects[0].id);
          } else {
              setActiveProjectId('');
          }
      }
      
      setProjectToDelete(null);
      setDeleteConfirmationInput('');
  };

  const handleUpdateLog = async (date: string, qId: string, answer: AnswerState) => {
    if (!activeProjectId) return;
    await dbUpdateLog(date, qId, activeProjectId, answer);
    const newState = await fetchState();
    setState(newState);
  };

  const handleAddQuestion = async (q: Question) => {
    if (!activeProjectId) return;
    q.projectId = activeProjectId;
    await dbAddQuestion(q);
    const newState = await fetchState();
    setState(newState);
  };

  const handleUpdateQuestion = async (q: Question) => {
      await dbAddQuestion(q); // Reuse add (INSERT OR REPLACE)
      const newState = await fetchState();
      setState(newState);
  };

  const handleDeleteQuestion = async (id: string) => {
    await dbDeleteQuestion(id);
    const newState = await fetchState();
    setState(newState);
  };

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#708CA9] font-mono flex flex-col md:flex-row overflow-hidden relative selection:bg-[#8AFF80] selection:text-[#0B0D0F]">
      
      {/* SIDEBAR */}
      <div 
        className={`
            fixed top-0 left-0 w-full h-full md:relative md:h-auto md:max-h-screen 
            bg-[#0B0D0F] border-b-2 border-[#708CA9] md:border-b-0
            z-[60] transition-all duration-300 ease-in-out
            flex flex-col
            ${isSidebarOpen 
                ? 'translate-y-0 md:w-72 md:border-r-2' 
                : '-translate-y-full md:translate-y-0 md:w-0 md:border-r-0 md:overflow-hidden'}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b-2 border-[#708CA9] flex items-center justify-between shrink-0">
           <h1 className="text-2xl font-bold text-[#8AFF80] tracking-tighter">
             A-LOG
           </h1>
           <button onClick={() => setIsSidebarOpen(false)} className="text-[#708CA9] hover:text-[#8AFF80] transition-colors">
              <X className="w-6 h-6" />
           </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
            {/* Project Switcher */}
            <div>
                <div className="text-xs font-bold text-[#708CA9] mb-4 uppercase tracking-widest flex items-center gap-2">
                    PROJECTS
                </div>
                <div className="space-y-2">
                    {state.projects.map(p => (
                        <div 
                            key={p.id}
                            className={`
                                group flex items-center justify-between p-3 border-2 transition-all cursor-pointer relative
                                ${activeProjectId === p.id 
                                    ? 'border-[#8AFF80] bg-[#8AFF80]/10 text-[#8AFF80] shadow-[4px_4px_0px_0px_rgba(138,255,128,0.3)]' 
                                    : 'border-[#708CA9]/30 text-[#708CA9] hover:border-[#708CA9] hover:bg-[#708CA9]/5'}
                            `}
                            onClick={() => setActiveProjectId(p.id)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Folder className="w-4 h-4 shrink-0" />
                                <span className="font-bold truncate">{p.name}</span>
                            </div>
                            
                            {/* Delete Project Trigger */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setProjectToDelete(p);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#708CA9] hover:text-[#FF9580]"
                                title="Delete Project"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {/* New Project Input */}
                    {isCreatingProject ? (
                        <div ref={newProjectContainerRef} className="p-2 border-2 border-[#8AFF80] border-dashed bg-[#8AFF80]/5 animate-in fade-in slide-in-from-top-2">
                            <input 
                                ref={newProjectInputRef}
                                type="text" 
                                autoFocus
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddProject()}
                                placeholder="PROJECT_NAME..."
                                className="w-full bg-transparent border-none outline-none text-[#8AFF80] placeholder-[#8AFF80]/50 text-sm font-bold uppercase"
                            />
                            <div className="flex justify-end mt-2">
                                <button onClick={handleAddProject} className="text-[#8AFF80] hover:underline text-xs uppercase font-bold">
                                    [ENTER]
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => {
                                setIsCreatingProject(true);
                                setTimeout(() => newProjectInputRef.current?.focus(), 10);
                            }}
                            className="w-full p-3 border-2 border-[#708CA9] border-dashed text-[#708CA9] hover:text-[#8AFF80] hover:border-[#8AFF80] transition-all flex items-center justify-center gap-2 text-sm font-bold uppercase"
                        >
                            <Plus className="w-4 h-4" /> New Project
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
                 <button 
                    onClick={() => { setActiveView('logs'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 border-l-4 transition-all ${activeView === 'logs' ? 'border-[#8AFF80] text-[#8AFF80] bg-[#8AFF80]/5' : 'border-transparent text-[#708CA9] hover:text-[#8AFF80]'}`}
                 >
                    <List className="w-5 h-5" />
                    <span className="font-bold">LOGS</span>
                 </button>
                 <button 
                    onClick={() => { setActiveView('stats'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 border-l-4 transition-all ${activeView === 'stats' ? 'border-[#8AFF80] text-[#8AFF80] bg-[#8AFF80]/5' : 'border-transparent text-[#708CA9] hover:text-[#8AFF80]'}`}
                 >
                    <BarChart2 className="w-5 h-5" />
                    <span className="font-bold">ANALYTICS</span>
                 </button>
                 <button 
                    onClick={() => { setActiveView('settings'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 border-l-4 transition-all ${activeView === 'settings' ? 'border-[#8AFF80] text-[#8AFF80] bg-[#8AFF80]/5' : 'border-transparent text-[#708CA9] hover:text-[#8AFF80]'}`}
                 >
                    <Settings className="w-5 h-5" />
                    <span className="font-bold">SETTINGS</span>
                 </button>
                 <button 
                    onClick={() => { setActiveView('about'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 p-3 border-l-4 transition-all ${activeView === 'about' ? 'border-[#8AFF80] text-[#8AFF80] bg-[#8AFF80]/5' : 'border-transparent text-[#708CA9] hover:text-[#8AFF80]'}`}
                 >
                    <Info className="w-5 h-5" />
                    <span className="font-bold">ABOUT</span>
                 </button>
            </nav>
        </div>
        
        <div className="p-4 border-t-2 border-[#708CA9] text-[10px] text-[#708CA9]/50 text-center uppercase">
            LOCAL_FIRST_DB // ENCRYPTED_AT_REST
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Main Header - Visible on Mobile OR when Desktop Sidebar is closed */}
        <div className={`p-4 border-b-2 border-[#708CA9] flex items-center justify-between shrink-0 ${isSidebarOpen ? 'md:hidden' : ''}`}>
            <div className="font-bold text-[#8AFF80] flex items-center gap-3">
               {/* Logo only needed here if sidebar is closed/hidden */}
               <span className="md:inline hidden text-xl tracking-tighter">A-LOG</span>
               <span className="md:hidden truncate max-w-[200px]">{activeProject ? activeProject.name : 'A-LOG'}</span>
            </div>
            
            {/* Toggle Button (Opens Sidebar) */}
            <button onClick={() => setIsSidebarOpen(true)} className="text-[#708CA9] hover:text-[#8AFF80] transition-colors">
               <Menu className="w-6 h-6" />
            </button>
        </div>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
           {state.projects.length === 0 && !isCreatingProject ? (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in duration-700">
                   <div className="w-20 h-20 border-2 border-[#8AFF80] flex items-center justify-center text-[#8AFF80] shadow-[8px_8px_0px_0px_rgba(138,255,128,0.3)]">
                       <Plus className="w-10 h-10" />
                   </div>
                   <div className="space-y-2">
                       <h2 className="text-2xl text-[#8AFF80] font-bold">SYSTEM INITIALIZED</h2>
                       <p className="text-[#708CA9]">NO PROJECTS DETECTED. PLEASE CREATE A PROJECT TO BEGIN.</p>
                   </div>
                   <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="px-8 py-3 bg-[#8AFF80] text-[#0B0D0F] font-bold uppercase hover:bg-[#7FEDFA] transition-colors"
                   >
                       OPEN TERMINAL SIDEBAR
                   </button>
               </div>
           ) : (
               <>
                {!activeProjectId && (
                     <div className="text-center text-[#708CA9] mt-20">SELECT A PROJECT TO CONTINUE</div>
                )}
                
                {activeProjectId && (
                    <div className="max-w-5xl mx-auto h-full">
                        {activeView === 'logs' && (
                            <DailyView 
                                questions={projectQuestions} 
                                logs={state.logs} 
                                onUpdateLog={handleUpdateLog}
                            />
                        )}
                        {activeView === 'stats' && (
                            <StatsView state={{...state, questions: projectQuestions}} />
                        )}
                        {activeView === 'settings' && (
                            <ManageQuestions 
                                questions={projectQuestions} 
                                onAdd={handleAddQuestion} 
                                onUpdate={handleUpdateQuestion}
                                onDelete={handleDeleteQuestion}
                            />
                        )}
                        {activeView === 'about' && <AboutView />}
                    </div>
                )}
               </>
           )}
        </div>
      </div>

      {/* Project Delete Modal (Global) */}
      {projectToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#0B0D0F] border-2 border-[#FF9580] p-6 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(255,149,128,0.3)] relative animate-in zoom-in-95 duration-200">
                   <div className="absolute top-0 left-0 bg-[#FF9580] text-[#0B0D0F] px-2 py-1 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> PROJECT_DESTRUCTION
                  </div>
                  <button onClick={() => setProjectToDelete(null)} className="absolute top-2 right-2 text-[#708CA9] hover:text-[#FF9580]">
                      <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-xl text-[#FF9580] mt-6 mb-4 font-bold uppercase">DELETE PROJECT?</h3>
                  <div className="text-[#708CA9] mb-6 text-sm leading-relaxed">
                      <p className="mb-4">This action is <strong className="text-[#FF9580]">IRREVERSIBLE</strong>. It will delete the project <span className="text-[#FF9580] font-bold">"{projectToDelete.name}"</span> and all associated questions and logs.</p>
                      
                      <label className="block text-xs uppercase font-bold mb-2">Type project name to confirm:</label>
                      <input 
                        type="text" 
                        value={deleteConfirmationInput}
                        onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                        className="w-full bg-[#0B0D0F] border-2 border-[#FF9580] p-2 text-[#FF9580] outline-none placeholder-[#FF9580]/30 font-bold"
                        placeholder={projectToDelete.name}
                        autoFocus
                      />
                  </div>

                  <div className="flex justify-end gap-3">
                       <RetroButton variant="secondary" onClick={() => setProjectToDelete(null)}>CANCEL</RetroButton>
                       <RetroButton 
                            variant="danger" 
                            disabled={deleteConfirmationInput !== projectToDelete.name}
                            onClick={handleDeleteProject}
                        >
                            DELETE PROJECT
                       </RetroButton>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default App;
