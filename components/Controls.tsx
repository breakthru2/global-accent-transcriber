
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

const Controls: React.FC<ControlsProps> = ({ 
  mode, 
  showConfidence, 
  onModeChange, 
  onConfidenceToggle,
  onClear,
  hasContent
}) => {
  const modes = [
    { id: TranscriptionMode.RAW, label: 'Raw Transcript', icon: 'fa-align-left' },
    { id: TranscriptionMode.CLEAN, label: 'Cleaned', icon: 'fa-wand-magic-sparkles' },
    { id: TranscriptionMode.STANDARDIZED, label: 'Standardized', icon: 'fa-language' },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className={`fa-solid ${m.icon} mr-2`}></i>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center cursor-pointer gap-2">
          <input 
            type="checkbox" 
            checked={showConfidence} 
            onChange={onConfidenceToggle}
            className="w-4 h-4 text-indigo-600 rounded"
          />
          <span className="text-sm font-medium text-slate-600">Show Confidence</span>
        </label>

        {hasContent && (
          <button 
            onClick={onClear}
            className="text-sm font-medium text-red-500 hover:text-red-600 px-3 py-1 border border-red-100 rounded-lg hover:bg-red-50"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default Controls;
