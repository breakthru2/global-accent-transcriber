
# GlobalAccent Speech-to-Text

A production-ready, accent-robust STT application.

## How it Works
1. **Frontend (React)**: Captures audio in 5-second chunks using the Web Audio API.
2. **Backend (FastAPI + Whisper)**: Processes chunks locally using the open-source Whisper model.
3. **Refinement (Gemini)**: Uses Google Gemini Flash to polish transcripts while respecting regional linguistic nuances.

## Local Setup (Backend)
1. Install Python 3.9+
2. Install FFmpeg (required by Whisper):
   - Mac: `brew install ffmpeg`
   - Windows: `choco install ffmpeg`
3. Install dependencies: `pip install -r backend/requirements.txt`
4. Run server: `python backend/main.py`

## Features
- **Accent Robust**: Unlike many commercial APIs that default to US/UK English, Whisper's training data is globally diverse.
- **Privacy First**: Audio is processed in memory and never stored.
- **Intelligent Refinement**: "Cleaned" mode uses AI to fix punctuation without "Americanizing" your speech.

## Limitations & Trade-offs
- **Hardware**: Running Whisper locally requires at least 4GB RAM. A GPU (NVIDIA) is highly recommended for real-time performance.
- **Latency**: Chunk-based processing means there's a ~1-2 second lag per segment.
