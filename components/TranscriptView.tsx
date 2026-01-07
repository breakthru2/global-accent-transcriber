
import React from 'react';
import { TranscriptionState, TranscriptionMode, AppStatus } from '../types';

interface TranscriptViewProps {
  state: TranscriptionState;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ state }) => {
  const { fullText, refinedText, mode, chunks, showConfidence, status } = state;
  const displayedText = mode === TranscriptionMode.RAW ? fullText : refinedText;

  const downloadTxt = () => {
    const blob = new Blob([displayedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transcript_GlobalAccent_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateOverallConfidence = () => {
    if (chunks.length === 0) return null;
    const avg = chunks.reduce((acc, c) => acc + c.confidence, 0) / chunks.length;
    if (avg > 0.85) return { label: 'High Confidence', color: 'text-emerald-600' };
    if (avg > 0.70) return { label: 'Good Confidence', color: 'text-indigo-600' };
    return { label: 'Mixed Accuracy', color: 'text-amber-600' };
  };

  const confidenceStatus = calculateOverallConfidence();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Output</h2>
          {confidenceStatus && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 ${confidenceStatus.color}`}>
              {confidenceStatus.label}
            </span>
          )}
        </div>
        
        {displayedText && (
          <div className="flex gap-1">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(displayedText);
              }} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all" 
              title="Copy"
            >
              <i className="fa-regular fa-copy"></i>
            </button>
            <button 
              onClick={downloadTxt} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all" 
              title="Download"
            >
              <i className="fa-solid fa-download"></i>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-200 min-h-[400px] transition-all relative ring-1 ring-slate-100/50">
        {!displayedText && status === AppStatus.IDLE && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
             <i className="fa-solid fa-waveform text-5xl mb-4 opacity-10"></i>
             <p className="text-sm font-bold uppercase tracking-widest opacity-40">Awaiting Input</p>
          </div>
        )}

        <div className="text-2xl text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
          {mode === TranscriptionMode.RAW ? (
            chunks.map((chunk) => (
              <span 
                key={chunk.id} 
                className={`mr-1.5 transition-all duration-500 rounded px-1 ${
                  showConfidence && chunk.isLowConfidence 
                    ? 'bg-amber-50 text-amber-900 border-b-2 border-amber-300 decoration-amber-200 underline-offset-4' 
                    : ''
                }`}
                title={showConfidence ? `Accuracy: ${(chunk.confidence * 100).toFixed(0)}%` : undefined}
              >
                {chunk.text}
              </span>
            ))
          ) : (
            <span className="animate-in fade-in duration-700">
              {refinedText || (fullText ? 'AI Refinement in progress...' : '')}
            </span>
          )}
          {status === AppStatus.PROCESSING && (
            <span className="inline-flex items-center gap-1.5 ml-2">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
            </span>
          )}
          {status === AppStatus.LISTENING && (
            <span className="inline-block w-1.5 h-7 bg-indigo-500/20 ml-2 animate-pulse align-middle rounded-full"></span>
          )}
        </div>
      </div>
    </div>
  );
};
