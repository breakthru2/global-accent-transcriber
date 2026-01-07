
import { GoogleGenAI } from "@google/genai";
import { TranscriptionMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const refineTranscript = async (
  text: string, 
  mode: TranscriptionMode
): Promise<string> => {
  if (mode === TranscriptionMode.RAW || !text.trim()) return text;

  // CLEAN mode is strictly for punctuation and legibility.
  // STANDARDIZED is the ONLY mode allowed to rewrite syntax.
  const systemInstruction = mode === TranscriptionMode.CLEAN
    ? "You are a transcription editor. Add correct punctuation and capitalization to the text. DO NOT change words, DO NOT fix grammar, DO NOT 'standardize' regional English (Nigerian, Indian, etc.), and DO NOT remove any slang or idioms. Output ONLY the original text with punctuation."
    : "You are a professional scribe. Standardize the following speech-to-text into formal English prose. Fix syntax errors and remove disfluencies (ums, ahs). ONLY rewrite if the user has explicitly requested standardization. Ensure the core meaning remains identical.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Input Transcription: ${text}`,
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    return response.text || text;
  } catch (error) {
    console.error("Refinement Error:", error);
    return text;
  }
};
