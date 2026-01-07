
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TranscriptionMode, AppStatus, TranscriptChunk, TranscriptionState } from './types';
import { refineTranscript } from './services/gemini';
import Header from './components/Header';
import Recorder from './components/Recorder';
import TranscriptView from './components/TranscriptView';
import Controls from './components/Controls';

const App: React.FC = () => {
  const [state, setState] = useState<TranscriptionState>({
    chunks: [],
    fullText: '',
    refinedText: '',
    mode: TranscriptionMode.RAW,
    status: AppStatus.IDLE,
    errorMessage: null,
    showConfidence: true,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chunkIntervalRef = useRef<number | null>(null);

  // Mock Whisper API Call
  // In a production environment, this would call the FastAPI backend provided in backend/main.py
  const transcribeAudioChunk = async (blob: Blob): Promise<TranscriptChunk> => {
    // Simulating backend processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, you'd send formData to /chunk
    // Here we generate random text to simulate live feedback
    const phrases = [
      "I think the direction we are heading is correct",
      "Moving forward with the agenda",
      "Regarding the previous point raised",
      "The Nigerian market shows great potential",
      "Our team in Ukraine is working hard",
      "We should consider the cultural context",
      "It is important to maintain the original accent",
      "Transcription should be inclusive"
    ];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      text: phrases[Math.floor(Math.random() * phrases.length)],
      confidence: 0.7 + Math.random() * 0.3,
      timestamp: Date.now(),
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          processChunk(event.data);
        }
      };

      mediaRecorder.start(5000); // 5-second chunks
      setState(prev => ({ ...prev, status: AppStatus.LISTENING, errorMessage: null }));

    } catch (err) {
      console.error("Microphone error:", err);
      setState(prev => ({ 
        ...prev, 
        status: AppStatus.ERROR, 
        errorMessage: "Microphone access denied or not available." 
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (chunkIntervalRef.current) {
      window.clearInterval(chunkIntervalRef.current);
    }
    setState(prev => ({ ...prev, status: AppStatus.PROCESSING }));
    
    // Final processing trigger
    setTimeout(async () => {
      setState(prev => ({ ...prev, status: AppStatus.IDLE }));
    }, 1000);
  };

  const processChunk = async (blob: Blob) => {
    const chunk = await transcribeAudioChunk(blob);
    setState(prev => {
      const newChunks = [...prev.chunks, chunk];
      const newFullText = newChunks.map(c => c.text).join(' ');
      return { 
        ...prev, 
        chunks: newChunks, 
        fullText: newFullText 
      };
    });
  };

  // Refinement logic
  useEffect(() => {
    const runRefinement = async () => {
      if (state.fullText && (state.mode === TranscriptionMode.CLEAN || state.mode === TranscriptionMode.STANDARDIZED)) {
        const refined = await refineTranscript(state.fullText, state.mode);
        setState(prev => ({ ...prev, refinedText: refined }));
      }
    };

    const timer = setTimeout(runRefinement, 500);
    return () => clearTimeout(timer);
  }, [state.fullText, state.mode]);

  const clearTranscript = () => {
    setState(prev => ({
      ...prev,
      chunks: [],
      fullText: '',
      refinedText: '',
      status: AppStatus.IDLE
    }));
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 py-8">
      <Header />
      
      <main className="flex-1 space-y-8 mt-10">
        <Recorder 
          status={state.status} 
          onStart={startRecording} 
          onStop={stopRecording} 
        />

        <Controls 
          mode={state.mode} 
          showConfidence={state.showConfidence}
          onModeChange={(mode) => setState(prev => ({ ...prev, mode }))}
          onConfidenceToggle={() => setState(prev => ({ ...prev, showConfidence: !prev.showConfidence }))}
          onClear={clearTranscript}
          hasContent={state.fullText.length > 0}
        />

        <TranscriptView 
          state={state} 
        />
      </main>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>Accent-aware transcription, not accent-correcting by default.</p>
        <p className="mt-1">Built with Whisper & Gemini Flash</p>
      </footer>
    </div>
  );
};

export default App;
