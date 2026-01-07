
import React from 'react';
import { TranscriptionState, TranscriptionMode } from '../types';

interface TranscriptViewProps {
  state: TranscriptionState;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ state }) => {
  const { fullText, refinedText, mode, chunks, showConfidence } = state;
  const displayedText = mode === TranscriptionMode.RAW ? fullText : refinedText;

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([displayedText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcript_${new Date().toISOString()}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayedText);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-lg font-bold text-slate-700">Transcript Preview</h2>
        {displayedText && (
          <div className="flex gap-2">
             <button 
              onClick={copyToClipboard}
              className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
              title="Copy to clipboard"
            >
              <i className="fa-regular fa-copy"></i>
            </button>
            <button 
              onClick={downloadTxt}
              className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
              title="Download as TXT"
            >
              <i className="fa-solid fa-download"></i>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 min-h-[300px] leading-relaxed relative overflow-hidden">
        {!displayedText && state.status !== 'LISTENING' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
            <i className="fa-solid fa-comment-dots text-6xl mb-4 opacity-50"></i>
            <p>Your transcript will appear here...</p>
          </div>
        )}

        <div className="text-xl text-slate-800 whitespace-pre-wrap">
          {mode === TranscriptionMode.RAW ? (
            chunks.map((chunk, idx) => (
              <span 
                key={chunk.id} 
                className={`mr-1 transition-all duration-300 ${
                  showConfidence && chunk.confidence < 0.85 ? 'bg-amber-50 border-b-2 border-amber-200' : ''
                }`}
                title={showConfidence ? `Confidence: ${(chunk.confidence * 100).toFixed(0)}%` : undefined}
              >
                {chunk.text}
              </span>
            ))
          ) : (
            <span className="transition-all duration-500">
              {refinedText || "Processing refined transcript..."}
            </span>
          )}
        </div>

        {state.status === 'LISTENING' && (
          <span className="inline-block w-2 h-6 bg-indigo-400 ml-1 animate-pulse"></span>
        )}
      </div>

      <div className="flex gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl items-start">
        <i className="fa-solid fa-circle-info text-indigo-500 mt-1"></i>
        <div className="text-sm text-indigo-900 leading-snug">
          <strong>Tip:</strong> The "Cleaned" mode uses Gemini Flash to intelligently fix punctuation and minor errors while strictly preserving your original accent and regional wording.
        </div>
      </div>
    </div>
  );
};

export default TranscriptView;
