
import React, { useState, useEffect, useRef } from 'react';
import { TranscriptionMode, AppStatus, TranscriptChunk, TranscriptionState } from './types';
import { refineTranscript } from './services/gemini';
import { Header } from './components/Header';
import { Recorder } from './components/Recorder';
import { TranscriptView } from './components/TranscriptView';
import { Controls } from './components/Controls';
import { GoogleGenAI, Modality } from "@google/genai";

// Audio Encoding Utility
const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

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

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setState(prev => ({ ...prev, status: AppStatus.IDLE }));
  };

  const startRecording = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      // Resume audio context if it was suspended (browser policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, 
          systemInstruction: 'You are a verbatim, accent-robust transcription service. Transcribe everything exactly as heard. Do not "fix" grammar or regional phrasing. If a word is cut off, use context to finish it naturally.',
        },
        callbacks: {
          onopen: () => {
            source.connect(processor);
            processor.connect(audioContext.destination);
            setState(prev => ({ ...prev, status: AppStatus.LISTENING, errorMessage: null }));
          },
          onmessage: async (message) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (!text) return;

              const newChunk: TranscriptChunk = {
                id: Math.random().toString(36).substr(2, 9),
                text: text,
                confidence: 0.99, // Live API transcription is highly confident
                timestamp: Date.now(),
                isLowConfidence: false
              };

              setState(prev => {
                const updatedFullText = (prev.fullText + " " + text).trim();
                return {
                  ...prev,
                  chunks: [...prev.chunks, newChunk],
                  fullText: updatedFullText
                };
              });
            }
          },
          onerror: (e) => {
            console.error("Transcription Error:", e);
            stopRecording();
            setState(prev => ({ ...prev, status: AppStatus.ERROR, errorMessage: "Connection lost. Please try again." }));
          },
          onclose: () => {
            console.log("Session closed normally");
          }
        }
      });

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          int16[i] = inputData[i] * 32768;
        }
        const pcmData = new Uint8Array(int16.buffer);
        
        sessionPromise.then(session => {
          if (session) {
            session.sendRealtimeInput({
              media: {
                data: encode(pcmData),
                mimeType: 'audio/pcm;rate=16000'
              }
            });
          }
        }).catch(err => console.error("Failed to send audio", err));
      };

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, status: AppStatus.ERROR, errorMessage: "Mic access denied or browser incompatible." }));
    }
  };

  useEffect(() => {
    const runRefinement = async () => {
      if (state.fullText && state.mode !== TranscriptionMode.RAW) {
        setState(prev => ({ ...prev, status: AppStatus.PROCESSING }));
        const refined = await refineTranscript(state.fullText, state.mode);
        setState(prev => ({ ...prev, refinedText: refined, status: state.status === AppStatus.LISTENING ? AppStatus.LISTENING : AppStatus.IDLE }));
      }
    };
    const timer = setTimeout(runRefinement, 1000);
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
            setState(prev => ({ ...prev, chunks: [], fullText: '', refinedText: '' }));
          }}
          hasContent={state.fullText.length > 0}
        />
        <TranscriptView state={state} />
      </main>

      <footer className="mt-12 text-center border-t border-slate-100 pt-6">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-4">
          <span className="flex items-center gap-1"><i className="fa-solid fa-cloud-arrow-up text-indigo-400"></i> Serverless</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span>Continuous Stream</span>
          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
          <span>Static Site Compatible</span>
        </p>
      </footer>
    </div>
  );
};
