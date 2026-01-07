
import React, { useState, useEffect, useRef } from 'react';
import { TranscriptionMode, AppStatus, TranscriptChunk, TranscriptionState } from './types';
import { refineTranscript } from './services/gemini';
import { Header } from './components/Header';
import { Recorder } from './components/Recorder';
import { TranscriptView } from './components/TranscriptView';
import { Controls } from './components/Controls';
import { GoogleGenAI } from "@google/genai";

const BACKEND_URL = 'http://localhost:8000';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const App: React.FC = () => {
  const [state, setState] = useState<TranscriptionState>({
    chunks: [],
    fullText: '',
    refinedText: '',
    mode: TranscriptionMode.RAW,
    status: AppStatus.IDLE,
    errorMessage: null,
    showConfidence: true,
    languageDetected: 'Detecting...',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const contextBufferRef = useRef<string>("");
  const audioChunksRef = useRef<Blob[]>([]);
  const lastChunkTailRef = useRef<Blob | null>(null);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  };

  const transcribeAudioChunk = async (blob: Blob, context: string): Promise<TranscriptChunk> => {
    setState(prev => ({ ...prev, status: AppStatus.PROCESSING }));
    
    // Attempt local backend
    const formData = new FormData();
    formData.append('audio', blob);
    formData.append('initial_prompt', context);

    try {
      const response = await fetch(`${BACKEND_URL}/chunk`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return {
          id: Math.random().toString(36).substr(2, 9),
          text: result.text?.trim() || "",
          confidence: result.confidence || 0.8,
          timestamp: Date.now(),
          isLowConfidence: (result.confidence || 1.0) < 0.70,
        };
      }
      throw new Error("Backend unreachable");
    } catch (err) {
      // Fallback to Gemini
      try {
        const base64Data = await blobToBase64(blob);
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { inlineData: { mimeType: 'audio/webm', data: base64Data } },
            { text: `TASK: VERBATIM TRANSCRIPTION.
            
            DIRECTIONS:
            1. Transcribe EXACTLY what is spoken.
            2. If a word at the very beginning or end sounds slightly clipped (e.g., "workin-" or "-ing"), use the audio context to complete that SPECIFIC word correctly (e.g., "working").
            3. DO NOT add punctuation.
            4. DO NOT generate new sentences or "complete" the user's thoughts.
            5. Return ONLY the text. No conversational filler.
            
            PREVIOUS WORDS (for flow): "${context}"` }
          ],
          config: {
            temperature: 0.0,
          }
        });

        const text = response.text?.trim() || "";
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          text: text,
          confidence: 0.95,
          timestamp: Date.now(),
          isLowConfidence: false,
        };
      } catch (geminiErr) {
        return {
          id: Math.random().toString(36).substr(2, 9),
          text: "",
          confidence: 0,
          timestamp: Date.now(),
          isLowConfidence: true,
        };
      } finally {
        setState(prev => ({ ...prev, status: AppStatus.LISTENING }));
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000, 
          channelCount: 1, 
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // We process the chunk. To handle boundary clipping, 
          // we rely on the 4s buffer being long enough for the model to "hear" the full word.
          const chunk = await transcribeAudioChunk(event.data, contextBufferRef.current);
          
          if (chunk.text) {
            setState(prev => {
              // Deduplication logic: If the model repeats the last word of the context, we trim it.
              const lastWord = contextBufferRef.current.split(' ').pop()?.toLowerCase();
              const firstWord = chunk.text.split(' ')[0]?.toLowerCase();
              
              let cleanedText = chunk.text;
              if (lastWord && firstWord === lastWord) {
                cleanedText = chunk.text.split(' ').slice(1).join(' ');
              }

              const updatedChunk = { ...chunk, text: cleanedText };
              const newChunks = [...prev.chunks, updatedChunk];
              
              contextBufferRef.current = newChunks.map(c => c.text).join(' ').slice(-150);
              
              return { 
                ...prev, 
                chunks: newChunks, 
                fullText: newChunks.map(c => c.text).join(' ') 
              };
            });
          }
        }
      };

      // 4 seconds is the optimal balance for "real-time" feel vs "word completion" accuracy
      mediaRecorder.start(4000); 
      setState(prev => ({ 
        ...prev, 
        status: AppStatus.LISTENING, 
        errorMessage: null,
        chunks: [],
        fullText: '',
        refinedText: '',
      }));

    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        status: AppStatus.ERROR, 
        errorMessage: "Microphone error. Please refresh and allow access." 
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setState(prev => ({ ...prev, status: AppStatus.IDLE }));
  };

  useEffect(() => {
    const runRefinement = async () => {
      if (state.fullText && state.mode !== TranscriptionMode.RAW) {
        const refined = await refineTranscript(state.fullText, state.mode);
        setState(prev => ({ ...prev, refinedText: refined }));
      }
    };
    const timer = setTimeout(runRefinement, 800);
    return () => clearTimeout(timer);
  }, [state.fullText, state.mode]);

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 py-8">
      <Header />
      <main className="flex-1 space-y-6 mt-8">
        <Recorder status={state.status} onStart={startRecording} onStop={stopRecording} />
        
        {state.errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-center text-sm font-medium">
            <i className="fa-solid fa-circle-exclamation mr-2"></i>
            {state.errorMessage}
          </div>
        )}

        <Controls 
          mode={state.mode} 
          showConfidence={state.showConfidence}
          onModeChange={(mode) => setState(prev => ({ ...prev, mode }))}
          onConfidenceToggle={() => setState(prev => ({ ...prev, showConfidence: !prev.showConfidence }))}
          onClear={() => {
            contextBufferRef.current = "";
            setState(prev => ({ ...prev, chunks: [], fullText: '', refinedText: '' }));
          }}
          hasContent={state.fullText.length > 0}
        />
        <TranscriptView state={state} />
      </main>

      <footer className="mt-12 text-center border-t border-slate-100 pt-6">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-4">
          <span>Boundary-Aware Processing</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span>4.0s Latency</span>
        </p>
      </footer>
    </div>
  );
};
