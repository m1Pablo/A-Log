
import { AppState, Question, DailyLog, AnswerState, Project } from '../types';

declare global {
  interface Window {
    initSqlJs: (config: any) => Promise<any>;
  }
}

// --- IDB Persistence Helper ---
const DB_NAME = 'alog_storage';
const STORE_NAME = 'sqlite_blob';
const KEY_NAME = 'db_file';

const saveToIndexedDB = async (data: Uint8Array) => {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, KEY_NAME);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
};

const loadFromIndexedDB = async (): Promise<Uint8Array | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
    };
    request.onsuccess = (event: any) => {
      const db = event.target.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(KEY_NAME);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => {
        resolve(null);
    };
  });
};

// --- MOCK DATA SEED ---

const SEED_PROJECT: Project = {
  id: 'p_better_me',
  name: 'A BETTER ME',
  createdAt: Date.now()
};

// Set creation date to 60 days ago so mock data (45 days) is valid
const MOCK_START_DATE = Date.now() - (60 * 24 * 60 * 60 * 1000);

const SEED_QUESTIONS: Question[] = [
  {
    id: 'q_health_food',
    projectId: 'p_better_me',
    text: 'Did you eat whole foods today?',
    desiredOutcome: AnswerState.YES,
    schedule: [0, 1, 2, 3, 4, 5, 6], // Daily
    createdAt: MOCK_START_DATE,
    isArchived: 0
  },
  {
    id: 'q_health_exercise',
    projectId: 'p_better_me',
    text: 'Did you exercise for 30 mins?',
    desiredOutcome: AnswerState.YES,
    schedule: [0, 1, 2, 3, 4, 5, 6], // Daily
    createdAt: MOCK_START_DATE,
    isArchived: 0
  },
  {
    id: 'q_wlb_logoff',
    projectId: 'p_better_me',
    text: 'Did you log off work by 6PM?',
    desiredOutcome: AnswerState.YES,
    schedule: [1, 2, 3, 4, 5], // Mon-Fri
    createdAt: MOCK_START_DATE,
    isArchived: 0
  },
  {
    id: 'q_doomscroll',
    projectId: 'p_better_me',
    text: 'Did you doomscroll on social media?',
    desiredOutcome: AnswerState.NO,
    schedule: [0, 1, 2, 3, 4, 5, 6], // Daily
    createdAt: MOCK_START_DATE,
    isArchived: 0
  },
  {
    id: 'q_self_leisure',
    projectId: 'p_better_me',
    text: 'Did you do something just for yourself?',
    desiredOutcome: AnswerState.YES,
    schedule: [0, 1, 2, 3, 4, 5, 6], // Daily
    createdAt: MOCK_START_DATE,
    isArchived: 0
  },
  {
    id: 'q_social_friends',
    projectId: 'p_better_me',
    text: 'Did you check in with friends this week?',
    desiredOutcome: AnswerState.YES,
    schedule: [0], // Sunday check-in
    createdAt: MOCK_START_DATE,
    isArchived: 0
  },
  {
    id: 'q_social_family',
    projectId: 'p_better_me',
    text: 'Did you call your family?',
    desiredOutcome: AnswerState.YES,
    schedule: [0], // Sunday check-in
    createdAt: MOCK_START_DATE,
    isArchived: 0
  }
];

// Helper to format local date YYYY-MM-DD
const getLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateMockLogs = (questions: Question[]) => {
    const logs: any[] = [];
    const today = new Date();
    
    // Generate data for past 45 days to show detailed history
    // Start from i=1 (Yesterday) to ensure Today is empty for the demo
    for (let i = 1; i <= 45; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = getLocalDateStr(date);
        const dayOfWeek = date.getDay(); // 0 Sun - 6 Sat

        questions.forEach(q => {
            // Check if question existed at this date
            if (date.getTime() < q.createdAt) return;

            // Check if question is scheduled for this day
            if (q.schedule.includes(dayOfWeek)) {
                // Simulation Logic: 10% chance to forget logging entirely
                if (Math.random() > 0.1) {
                    let answer = AnswerState.UNANSWERED;
                    
                    // Specific logic for believability
                    if (q.id === 'q_health_food') {
                         // Harder on weekends (Fri/Sat)
                         if (dayOfWeek === 5 || dayOfWeek === 6) {
                             answer = Math.random() > 0.6 ? AnswerState.YES : AnswerState.NO;
                         } else {
                             answer = Math.random() > 0.3 ? AnswerState.YES : AnswerState.NO;
                         }
                    } else if (q.id === 'q_doomscroll') {
                        // We want the answer to be NO (success).
                        // Let's say we fail (answer YES) 40% of the time.
                        answer = Math.random() > 0.6 ? AnswerState.YES : AnswerState.NO;
                    } else if (q.id === 'q_wlb_logoff') {
                         // Work Life Balance: Often fails on Wednesdays/Thursdays
                         answer = Math.random() > 0.4 ? AnswerState.YES : AnswerState.NO;
                    } else if (q.id === 'q_health_exercise') {
                         // 50/50 struggle
                         answer = Math.random() > 0.5 ? AnswerState.YES : AnswerState.NO;
                    } else {
                         // General 70% success rate (Success means answer == desiredOutcome)
                         const isSuccess = Math.random() > 0.3;
                         if (isSuccess) {
                             answer = q.desiredOutcome;
                         } else {
                             answer = q.desiredOutcome === AnswerState.YES ? AnswerState.NO : AnswerState.YES;
                         }
                    }
                    
                    logs.push([dateStr, q.id, q.projectId, answer]);
                }
            }
        });
    }
    return logs;
};

// --- SQL Service ---

let db: any = null;
let SQL: any = null;

const saveDB = async () => {
  if (!db) return;
  const data = db.export();
  await saveToIndexedDB(data);
};

export const initDB = async (): Promise<AppState> => {
  if (!window.initSqlJs) {
    throw new Error("sql.js not loaded");
  }

  SQL = await window.initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

  const savedData = await loadFromIndexedDB();

  if (savedData) {
    db = new SQL.Database(savedData);
    
    // MIGRATION: Ensure schema consistency
    try {
        db.exec("SELECT * FROM projects LIMIT 1");
    } catch (e) {
        console.log("Migrating DB: Adding projects table");
        db.run(`CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT, created_at INTEGER);`);
        db.run("INSERT OR REPLACE INTO projects VALUES (?, ?, ?)", ['default', 'LEGACY LOG', Date.now()]);
        try { db.run("ALTER TABLE questions ADD COLUMN project_id TEXT DEFAULT 'default'"); } catch(e) {}
        try { db.run("ALTER TABLE logs ADD COLUMN project_id TEXT DEFAULT 'default'"); } catch(e) {}
    }
    
    // MIGRATION: Add desired_outcome column if missing
    try {
        db.run("ALTER TABLE questions ADD COLUMN desired_outcome TEXT DEFAULT 'YES'"); 
    } catch(e) {}

    // MIGRATION: Add is_archived column if missing
    try {
        db.run("ALTER TABLE questions ADD COLUMN is_archived INTEGER DEFAULT 0"); 
    } catch(e) {}
    
    // DATA SEEDING CHECK: If logs are empty (e.g. after a fresh revamp), seed them.
    const logCountRes = db.exec("SELECT count(*) FROM logs");
    if (logCountRes.length > 0 && logCountRes[0].values[0][0] === 0) {
        console.log("Seeding mock logs for existing DB...");
        
        db.run("INSERT OR IGNORE INTO projects VALUES (?, ?, ?)", [SEED_PROJECT.id, SEED_PROJECT.name, SEED_PROJECT.createdAt]);

        // 2. Add Questions if missing
        const stmt = db.prepare("INSERT OR IGNORE INTO questions VALUES (?, ?, ?, ?, ?, ?, ?)");
        SEED_QUESTIONS.forEach(q => {
            stmt.run([q.id, q.projectId, q.text, JSON.stringify(q.schedule), q.createdAt, q.desiredOutcome, q.isArchived]);
        });
        stmt.free();

        // 3. Insert Logs
        const mockLogs = generateMockLogs(SEED_QUESTIONS);
        const logStmt = db.prepare("INSERT INTO logs VALUES (?, ?, ?, ?)");
        mockLogs.forEach(row => {
            logStmt.run(row);
        });
        logStmt.free();
        await saveDB();
    }

  } else {
    db = new SQL.Database();
    // Initialize Schema
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY, 
        project_id TEXT,
        text TEXT, 
        schedule TEXT, 
        created_at INTEGER,
        desired_outcome TEXT DEFAULT 'YES',
        is_archived INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS logs (
        date TEXT, 
        question_id TEXT, 
        project_id TEXT,
        answer TEXT,
        PRIMARY KEY (date, question_id)
      );
    `);
    
    // Seed Initial Data
    db.run("INSERT INTO projects VALUES (?, ?, ?)", [SEED_PROJECT.id, SEED_PROJECT.name, SEED_PROJECT.createdAt]);
    
    const stmt = db.prepare("INSERT INTO questions VALUES (?, ?, ?, ?, ?, ?, ?)");
    SEED_QUESTIONS.forEach(q => {
      stmt.run([q.id, q.projectId, q.text, JSON.stringify(q.schedule), q.createdAt, q.desiredOutcome, q.isArchived]);
    });
    stmt.free();
    
    // Seed Mock Logs
    const mockLogs = generateMockLogs(SEED_QUESTIONS);
    const logStmt = db.prepare("INSERT INTO logs VALUES (?, ?, ?, ?)");
    mockLogs.forEach(row => {
        logStmt.run(row);
    });
    logStmt.free();

    await saveDB();
  }

  return fetchState();
};

export const fetchState = (): AppState => {
  if (!db) throw new Error("DB not initialized");

  // Load Projects
  const pRes = db.exec("SELECT * FROM projects");
  const projects: Project[] = [];
  if (pRes.length > 0) {
      pRes[0].values.forEach((row: any) => {
          projects.push({
              id: row[0],
              name: row[1],
              createdAt: row[2]
          });
      });
  }

  // Load Questions
  const qRes = db.exec("SELECT * FROM questions");
  const questions: Question[] = [];
  if (qRes.length > 0) {
    qRes[0].values.forEach((row: any) => {
      questions.push({
        id: row[0],
        projectId: row[1],
        text: row[2],
        schedule: JSON.parse(row[3]),
        createdAt: row[4],
        desiredOutcome: (row[5] as AnswerState) || AnswerState.YES,
        isArchived: row[6] === 1 ? 1 : 0
      });
    });
  }

  // Load Logs
  const lRes = db.exec("SELECT * FROM logs");
  const logs: DailyLog = {};
  if (lRes.length > 0) {
    lRes[0].values.forEach((row: any) => {
      const date = row[0];
      const qId = row[1];
      const ans = row[3];
      
      if (!logs[date]) logs[date] = {};
      logs[date][qId] = ans as AnswerState;
    });
  }

  return { projects, questions, logs };
};

// --- Actions ---

export const dbAddProject = async (p: Project) => {
    if (!db) return;
    db.run("INSERT OR REPLACE INTO projects VALUES (?, ?, ?)", [p.id, p.name, p.createdAt]);
    await saveDB();
}

export const dbDeleteProject = async (id: string) => {
    if (!db) return;
    db.run("DELETE FROM projects WHERE id = ?", [id]);
    db.run("DELETE FROM questions WHERE project_id = ?", [id]);
    await saveDB();
}

export const dbAddQuestion = async (q: Question) => {
  if (!db) return;
  db.run("INSERT OR REPLACE INTO questions VALUES (?, ?, ?, ?, ?, ?, ?)", [q.id, q.projectId, q.text, JSON.stringify(q.schedule), q.createdAt, q.desiredOutcome, q.isArchived || 0]);
  await saveDB();
};

export const dbDeleteQuestion = async (id: string) => {
  if (!db) return;
  db.run("DELETE FROM questions WHERE id = ?", [id]);
  db.run("DELETE FROM logs WHERE question_id = ?", [id]);
  await saveDB();
};

export const dbUpdateLog = async (date: string, qId: string, projectId: string, answer: AnswerState) => {
  if (!db) return;
  if (answer === AnswerState.UNANSWERED) {
    db.run("DELETE FROM logs WHERE date = ? AND question_id = ?", [date, qId]);
  } else {
    db.run("INSERT OR REPLACE INTO logs VALUES (?, ?, ?, ?)", [date, qId, projectId, answer]);
  }
  await saveDB();
};

export const exportSQLiteFile = async () => {
    if(!db) return;
    const data = db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alog_backup_${new Date().toISOString().split('T')[0]}.sqlite`;
    a.click();
};
