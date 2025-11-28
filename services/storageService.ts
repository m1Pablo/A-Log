import { AppState, INITIAL_QUESTIONS } from '../types';

const STORAGE_KEY = 'bitjournal_data_v1';

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return {
        questions: INITIAL_QUESTIONS,
        logs: {}
      };
    }
    return JSON.parse(serialized);
  } catch (e) {
    console.error("Failed to load state", e);
    return {
      questions: INITIAL_QUESTIONS,
      logs: {}
    };
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};
