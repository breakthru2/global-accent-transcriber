
# GlobalAccent Speech-to-Text (Serverless)

A high-quality, accent-robust STT application that runs entirely in the browser.

## Architecture
- **No Backend Required**: This app uses the Google Gemini Live API directly from the browser via WebSockets.
- **Real-time Streaming**: Audio is streamed in 16kHz Mono PCM format for instant transcription.
- **GitHub Pages Ready**: Can be hosted as a static site.

## How to Deploy to GitHub Pages
1. Push this code to a GitHub repository.
2. Go to **Settings > Pages**.
3. Select the branch you want to deploy from (e.g., `main`).
4. Ensure your environment has access to the Gemini API Key.

## Key Features
- **Verbatim Accuracy**: Tuned to ignore "ums" and "ahs" while preserving regional vocabulary (Nigerian English, Indian English, etc.).
- **Live Refinement**: Uses Gemini Flash to add punctuation and capitalization after you finish speaking.
- **Privacy**: No audio is stored or sent to a private server. Everything goes directly to the GenAI endpoint.

## Browser Support
- Requires a modern browser with `MediaDevices.getUserMedia` and `AudioContext` support (Chrome, Edge, Safari 14.1+, Firefox).
