
import React from 'react';
import { TranscriptionMode } from '../types';

interface ControlsProps {
  mode: TranscriptionMode;
  showConfidence: boolean;
  onModeChange: (mode: TranscriptionMode) => void;
  onConfidenceToggle: () => void;
  onClear: () => void;
  hasContent: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ 
  mode, 
  showConfidence, 
  onModeChange, 
  onConfidenceToggle,
  onClear,
  hasContent
}) => {
  const modes = [
    { id: TranscriptionMode.RAW, label: 'Raw', icon: 'fa-align-left' },
    { id: TranscriptionMode.CLEAN, label: 'Cleaned', icon: 'fa-wand-magic-sparkles' },
    { id: TranscriptionMode.STANDARDIZED, label: 'Standard', icon: 'fa-language' },
  ];

  return (
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              mode === m.id 
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className={`fa-solid ${m.icon} mr-1.5`}></i>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onConfidenceToggle}
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
            showConfidence ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          Confidence UI: {showConfidence ? 'ON' : 'OFF'}
        </button>

        {hasContent && (
          <button 
            onClick={onClear}
            className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-500"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
