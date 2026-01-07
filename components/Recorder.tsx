
import React from 'react';
import { AppStatus } from '../types';

interface RecorderProps {
  status: AppStatus;
  onStart: () => void;
  onStop: () => void;
}

export const Recorder: React.FC<RecorderProps> = ({ status, onStart, onStop }) => {
  const isListening = status === AppStatus.LISTENING;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {isListening && (
          <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-25"></div>
        )}
        <button
          onClick={isListening ? onStop : onStart}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'} text-white text-4xl`}></i>
        </button>
      </div>
      
      <div className="mt-6 text-center h-8">
        {status === AppStatus.LISTENING && (
          <p className="text-red-500 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full pulse"></span>
            Listening...
          </p>
        )}
        {status === AppStatus.PROCESSING && (
          <p className="text-indigo-600 font-medium">Analyzing audio...</p>
        )}
        {status === AppStatus.IDLE && (
          <p className="text-slate-400 font-medium">Click microphone to transcribe</p>
        )}
        {status === AppStatus.ERROR && (
          <p className="text-red-600 font-medium text-sm">Error: Check mic permissions</p>
        )}
      </div>
    </div>
  );
};
