
import { GoogleGenAI } from "@google/genai";
import { TranscriptionMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const refineTranscript = async (
  text: string, 
  mode: TranscriptionMode
): Promise<string> => {
  if (mode === TranscriptionMode.RAW || !text.trim()) return text;

  const systemInstruction = mode === TranscriptionMode.CLEAN
    ? "You are a specialized transcription editor. Fix punctuation, capitalization, and minor grammatical errors in the provided text. DO NOT rewrite or 'correct' the speaker's accent, regional phrasing, or vocabulary choices. Maintain the speaker's original voice exactly as is, but make it readable."
    : "You are a professional scribe. Convert the provided speech-to-text output into clear, standardized English. Smooth out disfluencies (ums, ahs, false starts) and preserve the original meaning while making the syntax follow formal English conventions. Ensure regional idiomatic expressions remain if they provide context, but ensure the overall structure is professional.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Process the following transcription:\n\n${text}`,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini refinement error:", error);
    return text;
  }
};
