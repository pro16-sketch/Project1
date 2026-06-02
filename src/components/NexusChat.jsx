import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Mic, MicOff, Settings, X, AlertTriangle } from 'lucide-react';
import { usePrimeState } from '../utils/PrimeState';

export default function NexusChat() {
  const {
    hospitals,
    fleet,
    missions,
    sensors,
    simActive,
    simStage,
    simLogs,
  } = usePrimeState();

  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Available models configuration
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-3.3-70b-instruct:free');
  
  // Audio recognition & media recorder fallback states
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Chat message history
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: 'Tactical Advisor ONLINE. Syncing with telemetry... System stable. Query command coordinates or ask for dispatch optimizations.'
    }
  ]);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Clean up recording timers and streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort error
        }
      }
    };
  }, []);

  // Handle Speech recognition toggling
  const toggleSpeechInput = () => {
    if (isListening || isRecording || isInitializing) {
      stopSpeechInput();
      return;
    }

    setIsInitializing(true);
    setApiError(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        let started = false;
        const timeoutId = setTimeout(() => {
          if (!started) {
            console.warn('[NexusChat] SpeechRecognition start timeout. Swapping to MediaRecorder.');
            try {
              rec.abort();
            } catch (e) {}
            setIsInitializing(false);
            startMediaRecorderFallback();
          }
        }, 6000); // 6-second timeout to allow the user to click "Allow"

        rec.onstart = () => {
          started = true;
          clearTimeout(timeoutId);
          setIsInitializing(false);
          setIsListening(true);
          setApiError(null);
        };

        rec.onresult = (event) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript) {
            setInput(prev => prev ? `${prev} ${transcript}` : transcript);
          }
        };

        rec.onerror = (event) => {
          console.warn('[NexusChat] Speech Recognition error:', event.error);
          clearTimeout(timeoutId);
          setIsInitializing(false);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            startMediaRecorderFallback();
          } else {
            setApiError(`Speech Recognition: ${event.error}. Launching voice backup...`);
            startMediaRecorderFallback();
          }
        };

        rec.onend = () => {
          clearTimeout(timeoutId);
          setIsInitializing(false);
          setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn('[NexusChat] Web Speech initiation failed, falling back:', err);
        setIsInitializing(false);
        startMediaRecorderFallback();
      }
    } else {
      console.log('[NexusChat] Web Speech API not supported. Falling back to HTML5 Audio Recorder.');
      setIsInitializing(false);
      startMediaRecorderFallback();
    }
  };

  // HTML5 Audio Recorder Fallback
  const startMediaRecorderFallback = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort error
      }
      setIsListening(false);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setApiError('MICROPHONE ERROR: Audio recording is not supported in this browser context (requires localhost or HTTPS). If inside the IDE preview, open the dashboard in a new tab.');
        setIsRecording(false);
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setIsRecording(true);
          audioChunksRef.current = [];
          
          let options = {};
          if (typeof MediaRecorder.isTypeSupported === 'function') {
            if (MediaRecorder.isTypeSupported('audio/webm')) {
              options = { mimeType: 'audio/webm' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
              options = { mimeType: 'audio/mp4' };
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
              options = { mimeType: 'audio/ogg' };
            } else if (MediaRecorder.isTypeSupported('audio/wav')) {
              options = { mimeType: 'audio/wav' };
            }
          }

          try {
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };

            mediaRecorder.onstop = async () => {
              // Clean up stream tracks
              stream.getTracks().forEach(track => track.stop());
              setIsRecording(false);
              setRecordingDuration(0);
              if (timerRef.current) clearInterval(timerRef.current);

              const finalMime = options.mimeType || 'audio/webm';
              const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
              if (audioBlob.size > 0) {
                await transcribeAudioWithGemini(audioBlob);
              }
            };

            mediaRecorder.start();

            setRecordingDuration(0);
            timerRef.current = setInterval(() => {
              setRecordingDuration(prev => {
                if (prev >= 15) { // 15-second cutoff to conserve API size
                  stopSpeechInput();
                  return prev;
                }
                return prev + 1;
              });
            }, 1000);
          } catch (mediaError) {
            console.error('[NexusChat] MediaRecorder creation failed:', mediaError);
            setApiError(`MICROPHONE ERROR: MediaRecorder initialization failed (${mediaError.message}).`);
            setIsRecording(false);
            stream.getTracks().forEach(track => track.stop());
          }
        })
        .catch(err => {
          console.error('[NexusChat] Microphone fallback failed:', err);
          setApiError('MICROPHONE ERROR: Permission denied or blocked. If inside the IDE preview iframe, open http://localhost:5173 in a new tab.');
          setIsRecording(false);
        });
    } catch (securityError) {
      console.error('[NexusChat] Media Device permission policy failure:', securityError);
      setApiError('MICROPHONE ERROR: Browser permission policy blocked mic access. Open the dashboard in a new tab (http://localhost:5173).');
      setIsRecording(false);
    }
  };

  // Stop recognition or recording
  const stopSpeechInput = () => {
    setIsInitializing(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort error
      }
      setIsListening(false);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
  };

  // Base64 encode and transcribe via Gemini with OpenRouter Whisper fallback
  const transcribeAudioWithGemini = async (audioBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const audioMime = audioBlob.type || 'audio/webm';
      
      let audioFormat = 'webm';
      if (audioMime.includes('mp4')) audioFormat = 'mp4';
      else if (audioMime.includes('ogg')) audioFormat = 'ogg';
      else if (audioMime.includes('wav')) audioFormat = 'wav';

      setIsLoading(true);
      
      // Try Gemini API first
      try {
        if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not defined.");

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType: audioMime, data: base64Audio } },
                { text: 'Transcribe this voice message precisely. Return only the transcript, no greetings, no conversational filler, and no formatting.' }
              ]
            }]
          })
        });

        if (response.status === 200) {
          const data = await response.json();
          const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (transcript && transcript.trim()) {
            setInput(prev => prev ? `${prev} ${transcript.trim()}` : transcript.trim());
            setIsLoading(false);
            return; // Success
          }
        }
        const errorText = await response.text();
        throw new Error(errorText || `Status ${response.status}`);
      } catch (geminiErr) {
        console.warn('[NexusChat] Gemini transcription failed. Falling back to OpenRouter Whisper:', geminiErr);
        
        // Secondary Fallback: OpenRouter Whisper-1 STT
        try {
          const orApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
          if (!orApiKey) throw new Error("VITE_OPENROUTER_API_KEY is not defined.");

          const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${orApiKey}`
            },
            body: JSON.stringify({
              model: 'openai/whisper-1',
              input_audio: {
                data: base64Audio,
                format: audioFormat
              }
            })
          });

          if (response.status === 200) {
            const data = await response.json();
            const transcript = data.text;
            if (transcript && transcript.trim()) {
              setInput(prev => prev ? `${prev} ${transcript.trim()}` : transcript.trim());
              setIsLoading(false);
              return; // Success
            }
          }
          const errorText = await response.text();
          throw new Error(errorText || `Status ${response.status}`);
        } catch (orErr) {
          console.error('[NexusChat] OpenRouter Whisper transcription failed:', orErr);
          setApiError(`Voice transcription failed. (Gemini: ${geminiErr.message}) (OpenRouter: ${orErr.message})`);
        }
      } finally {
        setIsLoading(false);
      }
    };
  };

  // Submit text message to LLM
  const handleChatSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setApiError(null);

    // Append user message
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMessage }]);
    setIsLoading(true);

    // Build tactical context string
    const systemPrompt = `You are NEXUS-AI, the advanced tactical disaster response command advisor. 
You are integrated into the city's DisasterResponse Dashboard.
Here is the current live system telemetry:
- Simulation Status: ${simActive ? `ACTIVE (Stage ${simStage})` : 'INACTIVE (Normal Monitoring)'}
- Incidents: ${missions.length} active (Critical: ${missions.filter(m => m.severity === 'critical').length}, High: ${missions.filter(m => m.severity === 'high').length})
- Rescue Fleet: ${fleet.map(v => `${v.name} (${v.type}, Status: ${v.status}, Fuel: ${v.fuel}%)`).join(', ')}
- Hospital Capacities: ${hospitals.map(h => `${h.name} (${h.beds} beds available, ICU: ${h.icu})`).join(', ')}
- Critical Sensors: ${sensors.filter(s => s.status === 'Danger' || s.status === 'Alert').map(s => `${s.name}: ${s.value}${s.unit} (${s.status})`).join(', ')}
- Recent logs: ${simLogs.slice(-3).map(l => `[${l.time}] ${l.text}`).join(' | ')}

Answer user questions with extreme operational efficiency, like a military/disaster coordinator. 
Format your responses using clean, readable markdown bullet points, short paragraphs, and bold text. 
Use cyberpunk emojis like 🚨, 🛸, 🌊, 🏥, ⚡, 📡 where appropriate. Keep answers concise (under 200 words) for HUD readability.

IMPORTANT: Respond in the exact same language, dialect, and script used by the user in their query. For example, if they ask in Hinglish (Romanized Hindi/Urdu, e.g., "aaj ka status kya hai?"), reply in natural, Romanized Hinglish. If they ask in Hindi script, Bengali script, Spanish, etc., reply in that script/language.

User Query: ${userMessage}`;

    try {
      let botResponse = '';

      const callGeminiDirect = async () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key in .env file.");

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });

        if (res.status === 200) {
          const data = await res.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error processing response.';
        } else {
          const errorData = await res.json();
          throw new Error(`Google API: ${errorData.error?.message || `HTTP ${res.status}`}`);
        }
      };

      if (selectedModel === 'gemini-2.5-flash-lite') {
        botResponse = await callGeminiDirect();
      } else {
        // OpenRouter models with Gemini fallback
        try {
          const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
          if (!apiKey) throw new Error("Missing OpenRouter API Key in .env file.");

          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'Nexus Disaster Dashboard'
            },
            body: JSON.stringify({
              model: selectedModel,
              messages: [{ role: 'user', content: systemPrompt }]
            })
          });

          if (res.status === 200) {
            const data = await res.json();
            botResponse = data.choices?.[0]?.message?.content || 'Error fetching completion.';
          } else {
            const errorData = await res.json();
            throw new Error(`OpenRouter API: ${errorData.error?.message || `HTTP ${res.status}`}`);
          }
        } catch (orErr) {
          console.warn('[NexusChat] OpenRouter failed, silently falling back to direct Gemini API:', orErr);
          botResponse = await callGeminiDirect();
        }
      }

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: botResponse }]);
    } catch (err) {
      console.error('[NexusChat] API Submission failed:', err);
      setApiError(`API ERROR: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating HUD Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(5, 5, 16, 0.9)',
          border: isOpen ? '2px solid var(--neon-magenta)' : '2px solid var(--neon-cyan)',
          boxShadow: isOpen 
            ? '0 0 15px rgba(255, 0, 255, 0.6), inset 0 0 10px rgba(255, 0, 255, 0.2)' 
            : '0 0 15px rgba(0, 243, 255, 0.6), inset 0 0 10px rgba(0, 243, 255, 0.2)',
          color: isOpen ? 'var(--neon-magenta)' : 'var(--neon-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        className={!isOpen ? 'animate-pulse' : ''}
        title="Toggle Tactical AI Advisor"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Cyber Chat Panel Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '30px',
            width: '380px',
            height: '520px',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(0, 243, 255, 0.3)',
            animation: 'fadeInSlide 0.3s ease-out',
          }}
          className="glass-panel"
        >
          {/* Internal CSS styles block */}
          <style>{`
            @keyframes fadeInSlide {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .chat-scanlines {
              background: linear-gradient(
                rgba(18, 16, 16, 0) 50%, 
                rgba(0, 0, 0, 0.25) 50%
              ), linear-gradient(
                90deg, 
                rgba(255, 0, 0, 0.06), 
                rgba(0, 255, 0, 0.02), 
                rgba(0, 0, 255, 0.06)
              );
              background-size: 100% 4px, 6px 100%;
              pointer-events: none;
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              z-index: 10;
              opacity: 0.15;
            }
            .message-markdown ul {
              margin-left: 15px;
              margin-top: 5px;
              margin-bottom: 5px;
            }
            .message-markdown li {
              margin-bottom: 3px;
              list-style-type: square;
              color: #b0b0e0;
            }
            .message-markdown p {
              margin-bottom: 8px;
            }
          `}</style>

          <div className="chat-scanlines" />

          {/* Chat Header */}
          <div
            style={{
              padding: '12px 15px',
              borderBottom: '1px solid rgba(0, 243, 255, 0.2)',
              background: 'rgba(5, 5, 20, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Pulsing indicator */}
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: simActive ? 'var(--neon-magenta)' : 'var(--neon-lime)',
                  boxShadow: simActive 
                    ? '0 0 8px var(--neon-magenta)' 
                    : '0 0 8px var(--neon-lime)',
                  display: 'inline-block',
                }}
                className="animate-pulse"
              />
              <span
                style={{
                  fontFamily: 'var(--font-header)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  color: 'var(--neon-cyan)',
                  textShadow: '0 0 5px rgba(0, 243, 255, 0.4)',
                }}
              >
                NEXUS INTEL HUD
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Settings Gear */}
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: settingsOpen ? 'var(--neon-magenta)' : 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s',
                }}
                className={settingsOpen ? 'animate-spin' : ''}
                title="AI Engine Configuration"
              >
                <Settings size={16} />
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Settings Drawer Panel */}
          {settingsOpen && (
            <div
              style={{
                position: 'absolute',
                top: '45px',
                left: 0,
                right: 0,
                background: 'rgba(5, 5, 18, 0.95)',
                borderBottom: '1px solid var(--neon-magenta)',
                padding: '15px',
                zIndex: 100,
                animation: 'fadeInSlide 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <h4 style={{ fontSize: '10px', color: 'var(--neon-magenta)', margin: 0, letterSpacing: '1px' }}>
                SYSTEM ENGINE CONFIG
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-header)' }}>
                  COGNITIVE AI CORE:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: '1px solid rgba(0, 243, 255, 0.3)',
                    padding: '6px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-body)',
                    borderRadius: '3px',
                    outline: 'none',
                  }}
                >
                  <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (OpenRouter Free-Link)</option>
                  <option value="openrouter/free">Auto Free router (OpenRouter)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Direct API)</option>
                  <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (OpenRouter)</option>
                  <option value="openai/gpt-4o">GPT-4o (OpenRouter)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  Voice Fallback: Active (HTML5 Rec)
                </span>
                <button
                  onClick={() => setSettingsOpen(false)}
                  style={{
                    background: 'rgba(255,0,255,0.1)',
                    border: '1px solid var(--neon-magenta)',
                    color: '#fff',
                    padding: '3px 8px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-header)',
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}

          {/* Messages Display Box */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'rgba(3, 3, 10, 0.3)',
              zIndex: 15,
            }}
          >
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Sender Tag */}
                  <span
                    style={{
                      fontSize: '8px',
                      color: isUser ? 'var(--neon-magenta)' : 'var(--neon-cyan)',
                      fontFamily: 'var(--font-header)',
                      marginBottom: '3px',
                      letterSpacing: '1px',
                    }}
                  >
                    {isUser ? 'HUMAN COORD' : 'NEXUS ADVISOR'}
                  </span>

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: isUser ? 'rgba(255, 0, 255, 0.05)' : 'rgba(0, 243, 255, 0.04)',
                      border: isUser ? '1px solid rgba(255, 0, 255, 0.3)' : '1px solid rgba(0, 243, 255, 0.3)',
                      boxShadow: isUser 
                        ? '0 0 8px rgba(255, 0, 255, 0.1)' 
                        : '0 0 8px rgba(0, 243, 255, 0.1)',
                      borderRadius: '4px',
                      padding: '10px 12px',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      color: 'var(--text-main)',
                      whiteSpace: 'pre-wrap',
                    }}
                    className="message-markdown"
                  >
                    {/* Basic Markdown rendering helper */}
                    {m.text.split('\n').map((line, i) => {
                      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                        return <li key={i}>{line.trim().substring(2)}</li>;
                      }
                      // Replace bold formatting
                      if (line.includes('**')) {
                        const parts = line.split('**');
                        return (
                          <p key={i}>
                            {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: '#fff' }}>{p}</strong> : p)}
                          </p>
                        );
                      }
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}

            {/* AI Response Loading/Thinking Ticker */}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '8px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-header)', letterSpacing: '1px' }}>
                  NEXUS ANALYZING...
                </span>
                <div
                  style={{
                    background: 'rgba(0, 243, 255, 0.04)',
                    border: '1px solid rgba(0, 243, 255, 0.2)',
                    borderRadius: '4px',
                    padding: '10px 12px',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)' }} className="animate-pulse" />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', animationDelay: '0.2s' }} className="animate-pulse" />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)', animationDelay: '0.4s' }} className="animate-pulse" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Dismissible Error Indicator Banner */}
          {apiError && (
            <div
              style={{
                background: 'rgba(255, 51, 51, 0.15)',
                borderTop: '1px solid var(--neon-red)',
                borderBottom: '1px solid var(--neon-red)',
                padding: '8px 12px',
                fontSize: '11px',
                color: '#ff9999',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px',
                zIndex: 25,
              }}
            >
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <AlertTriangle size={14} style={{ color: 'var(--neon-red)', flexShrink: 0 }} />
                <span>{apiError}</span>
              </div>
              <button
                onClick={() => setApiError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff9999',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Audio Input Fallback Duration / Wave Banner */}
          {(isInitializing || isListening || isRecording) && (
            <div
              style={{
                background: isInitializing 
                  ? 'rgba(255, 170, 0, 0.15)'
                  : isRecording 
                    ? 'rgba(255, 0, 255, 0.15)' 
                    : 'rgba(0, 243, 255, 0.15)',
                borderTop: isInitializing
                  ? '1px solid #ffaa00'
                  : isRecording 
                    ? '1px solid var(--neon-magenta)' 
                    : '1px solid var(--neon-cyan)',
                borderBottom: isInitializing
                  ? '1px solid #ffaa00'
                  : isRecording 
                    ? '1px solid var(--neon-magenta)' 
                    : '1px solid var(--neon-cyan)',
                padding: '6px 12px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 25,
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isInitializing
                      ? '#ffaa00'
                      : isRecording 
                        ? 'var(--neon-magenta)' 
                        : 'var(--neon-cyan)',
                    boxShadow: isInitializing
                      ? '0 0 8px #ffaa00'
                      : isRecording 
                        ? '0 0 8px var(--neon-magenta)' 
                        : '0 0 8px var(--neon-cyan)',
                  }}
                  className="animate-pulse"
                />
                <span>
                  {isInitializing 
                    ? 'Initializing voice engine... Please allow mic access if prompted.' 
                    : isListening 
                      ? 'Web Speech API active... speak now.' 
                      : `Voice recorder fallback active... (${recordingDuration}s / 15s)`
                  }
                </span>
              </div>
              <button
                onClick={stopSpeechInput}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '3px',
                  color: '#fff',
                  padding: '2px 6px',
                  fontSize: '9px',
                  cursor: 'pointer',
                }}
              >
                STOP
              </button>
            </div>
          )}

          {/* Bottom Chat Input Form Bar */}
          <form
            onSubmit={handleChatSubmit}
            style={{
              padding: '10px 15px',
              borderTop: '1px solid rgba(0, 243, 255, 0.2)',
              background: 'rgba(5, 5, 18, 0.9)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 20,
            }}
          >
            {/* Audio Toggle Button */}
            <button
              type="button"
              onClick={toggleSpeechInput}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '4px',
                background: isInitializing
                  ? 'rgba(255, 170, 0, 0.2)'
                  : isListening 
                    ? 'rgba(0, 243, 255, 0.2)' 
                    : isRecording 
                      ? 'rgba(255, 0, 255, 0.2)' 
                      : 'rgba(255, 255, 255, 0.04)',
                border: isInitializing
                  ? '1px solid #ffaa00'
                  : isListening 
                    ? '1px solid var(--neon-cyan)' 
                    : isRecording 
                      ? '1px solid var(--neon-magenta)' 
                      : '1px solid rgba(255,255,255,0.15)',
                color: isInitializing
                  ? '#ffaa00'
                  : isListening 
                    ? 'var(--neon-cyan)' 
                    : isRecording 
                      ? 'var(--neon-magenta)' 
                      : 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isInitializing
                  ? '0 0 8px #ffaa00'
                  : (isListening || isRecording) 
                    ? '0 0 8px currentColor' 
                    : 'none',
              }}
              title="Voice Dictation Command"
            >
              {isInitializing ? (
                <Mic size={16} className="animate-pulse" style={{ color: '#ffaa00' }} />
              ) : (isListening || isRecording) ? (
                <MicOff size={16} />
              ) : (
                <Mic size={16} />
              )}
            </button>

            {/* Main Command Input box */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask advisor or dict command..."
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(0, 243, 255, 0.2)',
                borderRadius: '3px',
                padding: '8px 10px',
                fontSize: '12px',
                color: '#fff',
                fontFamily: 'var(--font-body)',
                outline: 'none',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--neon-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 243, 255, 0.2)'}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '4px',
                background: 'rgba(0, 243, 255, 0.1)',
                border: '1px solid var(--neon-cyan)',
                color: 'var(--neon-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
                opacity: (!input.trim() || isLoading) ? 0.4 : 1,
                transition: 'all 0.2s',
                boxShadow: (!input.trim() || isLoading) ? 'none' : '0 0 8px rgba(0, 243, 255, 0.3)',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
