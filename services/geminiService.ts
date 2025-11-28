import { GoogleGenAI } from "@google/genai";
import { AppState, AnswerState, Question } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateInsights = async (state: AppState): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    throw new Error("API Key not found. Please set REACT_APP_GEMINI_API_KEY.");
  }

  // Prepare prompt context
  const questionsMap = state.questions.reduce((acc, q) => {
    acc[q.id] = q.text;
    return acc;
  }, {} as Record<string, string>);

  // Get last 14 days of logs
  const today = new Date();
  const logsTextLines: string[] = [];
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const log = state.logs[dateStr];
    
    if (log) {
      const entries = Object.entries(log)
        .map(([qId, answer]) => {
          const qText = questionsMap[qId];
          if (!qText || answer === AnswerState.UNANSWERED) return null;
          return `- ${qText}: ${answer}`;
        })
        .filter(Boolean)
        .join('\n');
      
      if (entries) {
        logsTextLines.push(`Date: ${dateStr}\n${entries}`);
      }
    }
  }

  const prompt = `
    You are a strictly logical, 8-bit retro computer terminal interface AI.
    Analyze the user's daily habit logs for the last 14 days.
    
    Style Guide:
    - Use technical, concise, slightly robotic language.
    - Use uppercase for emphasis on key metrics.
    - Keep it under 150 words.
    - Focus on patterns, streaks, and accountability.
    - If the user is doing well, commend them efficiently.
    - If the user is failing, provide a stern but constructive warning.
    
    Data:
    ${logsTextLines.join('\n\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "SYSTEM ERROR: NO RESPONSE GENERATED.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("COMMUNICATION FAILURE WITH MAIN FRAME.");
  }
};
