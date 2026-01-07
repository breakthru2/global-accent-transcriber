
export enum TranscriptionMode {
  RAW = 'RAW',
  CLEAN = 'CLEAN',
  STANDARDIZED = 'STANDARDIZED'
}

export enum AppStatus {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR'
}

export interface TranscriptChunk {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
}

export interface TranscriptionState {
  chunks: TranscriptChunk[];
  fullText: string;
  refinedText: string;
  mode: TranscriptionMode;
  status: AppStatus;
  errorMessage: string | null;
  showConfidence: boolean;
}
