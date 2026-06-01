import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Cpu, Zap, Settings, ChevronDown, Mic } from 'lucide-react';

// API Configuration
const API_KEYS = {
  GOOGLE: import.meta.env.VITE_GEMINI_API_KEY || "",
  OPENAI: import.meta.env.VITE_OPENAI_API_KEY || "",
  DEEPSEEK: import.meta.env.VITE_DEEPSEEK_API_KEY || "",
  GROQ: import.meta.env.VITE_GROQ_API_KEY || "",
  OPENROUTER: import.meta.env.VITE_OPENROUTER_API_KEY || ""
};

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'openrouter/free', name: 'Neural Free-Link', provider: 'OpenRouter' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 (Free)', provider: 'OpenRouter' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
];

export default function NexusChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [activeProvider, setActiveProvider] = useState('System');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Nexus Intelligence Multi-Link active. OpenRouter Hub connected for redundant free-tier backup.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const micStatusRef = useRef('idle'); // 'idle', 'recording', 'processing'
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const toggleListen = async () => {
    if (micStatusRef.current === 'recording') {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    if (micStatusRef.current === 'processing') {
      return; // Wait for Gemini to finish
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        micStatusRef.current = 'processing';
        setIsListening(false);
        setInput('Neural Audio Processing...');

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          try {
            const apiKey = API_KEYS.GOOGLE;
            if (!apiKey) throw new Error("Missing Gemini API Key");

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: "You are a highly advanced multilingual transcriber. Listen to the audio and transcribe the exact words spoken. You must output the text in the NATIVE SCRIPT of the spoken language (e.g., use Tamil script for Tamil, Bengali script for Bengali, Devanagari for Hindi, etc.). Do not transliterate into English. Return ONLY the final transcribed text without any quotes, preambles, or explanations. If there is no speech, return nothing." },
                    { inlineData: { mimeType: "audio/webm", data: base64Audio } }
                  ]
                }]
              })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);

            const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            setInput(transcript);
          } catch (err) {
            console.error("Transcription failed:", err);
            setInput('Error transcribing audio.');
          }
          micStatusRef.current = 'idle';
        };
      };

      mediaRecorder.start();
      micStatusRef.current = 'recording';
      setIsListening(true);
      setInput('Recording... (Click Mic to stop)');

    } catch (e) {
      console.error("Microphone access failed:", e);
      alert("Microphone hardware access denied! Check Chrome URL bar.");
      micStatusRef.current = 'idle';
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const callAI = async (userPrompt, context) => {
    const systemPrompt = `
      You are "Nexus", the Autonomous Disaster Response Intelligence for the monsoonal flood simulation in Kolkata.
      ROLE: Crisis Management Specialist. Analyze real-time disaster simulation data to assist operators.
      
      STRICT SCOPE:
      - This system operates exclusively for monsoonal flood response and aquatic search-and-rescue.
      - YOU ARE STRICTLY FORBIDDEN FROM MENTIONING fire, earthquake, concrete collapse, structural collapse, or any other non-flood hazards.
      - Enforce an exclusive focus on monsoonal flooding metrics, water levels, rapid water rescue, storm surge, boat dispatching, drone water scans, and flood relief supply chains.
      
      LIVE SIMULATION METRICS:
      - Simulation Active: ${context.simActive ? "YES" : "NO"}
      - Current Stage: Stage ${context.simStage}
        * Stage 1: Risk Assessment & Alert Mobilization
        * Stage 2: Sachet Broadcast Alerts sent to phones
        * Stage 3: Drones scan water zones for victims
        * Stage 4: Rescue Boats dispatched & gliding to coordinates
        * Stage 5: Bluetooth BLE survivor check-in & priority triage
        * Stage 6: Data Analytics queue processing
        * Stage 7: Predictive Supply Chain drawdown & relief distribution
      - Rescue Boat Telemetry:
        * Coordinates: ${context.boatPosition ? JSON.stringify(context.boatPosition) : "Not Dispatched"}
        * Transit Progress: ${context.boatTransitPercent}%
      - Risk Zones (Sector Severities):
        * ${context.mapZones ? JSON.stringify(context.mapZones) : "No active flooded sectors detected"}
      - Active Mobile Geofence Alert:
        * ${context.activeAlert ? JSON.stringify(context.activeAlert) : "None"}
      - Shelter Inventories (Relief Supplies):
        * ${context.shelterInventory ? JSON.stringify(context.shelterInventory) : "100% stocked"}
      - Active Survivor Requests:
        * Total Victims in Queue: ${context.totalCount}
        * High-Priority Critical Cases: ${context.criticalCount}
        * Survivor Details: ${JSON.stringify(context.requests)}
        
      Instructions:
      - Answer queries with technical accuracy, maintaining the persona of a high-performance cybernetic coordinator.
      - If simulation is inactive, emphasize that the drone fleet, mapping grid, and rescue vessels are in standby monitoring mode, awaiting manual initialization via the master "Simulate" command.
      - Reference specific live details like victim names (e.g. Amina Bibi, Rajesh Kisku, Subir Roy), current coordinates, or inventory drawdowns if they pertain to the operator's query.
    `;

    // Try Primary Model (Selected by user)
    try {
      return await executeRequest(selectedModel, systemPrompt, userPrompt);
    } catch (err) {
      console.warn(`Primary model (${selectedModel.name}) failed. Attempting OpenRouter failover...`);

      // Fallback Chain: Selected -> OpenRouter Free -> DeepSeek
      const fallbackChain = [MODELS[1], MODELS[2]];

      for (const model of fallbackChain) {
        if (model.id === selectedModel.id) continue;
        try {
          if (API_KEYS.OPENROUTER) {
            return await executeRequest(model, systemPrompt, userPrompt);
          }
        } catch (errInner) {
          console.warn(`Failover to ${model.name} failed.`);
        }
      }
      return `CRITICAL FAILURE: Neural Link severed across all providers. Check your API keys.`;
    }
  };

  const executeRequest = async (model, system, user) => {
    const apiKey = API_KEYS[model.provider.toUpperCase()];
    if (!apiKey) throw new Error(`Missing ${model.provider} API Key`);

    setActiveProvider(model.provider);

    if (model.provider === 'Google') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`;
      console.log(`[Triage] Calling Gemini: ${url.split('?')[0]}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: system + "\n\nUser Query: " + user }] }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates[0].content.parts[0].text;
    } else {
      let endpoint;
      if (model.provider === 'OpenAI') endpoint = 'https://api.openai.com/v1/chat/completions';
      else if (model.provider === 'Groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      else if (model.provider === 'DeepSeek') endpoint = 'https://api.deepseek.com/chat/completions';
      else if (model.provider === 'OpenRouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173', // For OpenRouter
          'X-Title': 'Nexus Disaster Dashboard' // For OpenRouter
        },
        body: JSON.stringify({
          model: model.id,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || data.error);
      return data.choices[0].message.content;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    const savedRequests = sessionStorage.getItem('disaster_requests');
    const requests = savedRequests ? JSON.parse(savedRequests) : [];
    
    const active = sessionStorage.getItem('sim_active') === 'true';
    const stage = parseInt(sessionStorage.getItem('sim_active_stage') || '0');
    
    const boatPosSaved = sessionStorage.getItem('sim_boat_pos');
    const boatPos = boatPosSaved ? JSON.parse(boatPosSaved) : null;
    
    const boatPct = sessionStorage.getItem('sim_boat_percent') || '0';
    
    const savedInventory = sessionStorage.getItem('shelter_inventory');
    const shelterInventory = savedInventory ? JSON.parse(savedInventory) : null;
    
    const savedZones = sessionStorage.getItem('map_zones');
    const mapZones = savedZones ? JSON.parse(savedZones) : null;
    
    const sachetAlert = sessionStorage.getItem('sachet_active_alert');
    const sachetAlertParsed = sachetAlert ? JSON.parse(sachetAlert) : null;

    const context = {
      requests,
      criticalCount: requests.filter(r => r.priority === 1).length,
      totalCount: requests.length,
      simActive: active,
      simStage: stage,
      boatPosition: boatPos,
      boatTransitPercent: boatPct,
      shelterInventory,
      mapZones,
      activeAlert: sachetAlertParsed
    };

    const responseText = await callAI(currentInput, context);
    setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    setIsTyping(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'rgba(5, 5, 16, 0.9)', border: '1px solid var(--neon-cyan)',
          color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: 'var(--border-glow)', zIndex: 1000,
          transition: 'all 0.3s'
        }}
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>

      {isOpen && (
        <div className="glass-panel" style={{
          position: 'fixed', bottom: '100px', right: '30px',
          width: '450px', height: '600px', display: 'flex', flexDirection: 'column',
          zIndex: 1000, border: '1px solid var(--neon-cyan)', overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{ padding: '15px', borderBottom: '1px solid rgba(0,243,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 243, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-cyan)' }}>
              <Cpu size={20} className={isTyping ? 'animate-pulse' : ''} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-header)', fontSize: '12px', letterSpacing: '1px' }}>Nexus Multi-Link</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Active: {activeProvider}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Settings size={18} style={{ cursor: 'pointer', opacity: showSettings ? 1 : 0.6 }} onClick={() => setShowSettings(!showSettings)} />
            </div>
          </div>

          {/* Settings / Model Selector */}
          {showSettings && (
            <div style={{ padding: '15px', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid var(--neon-cyan)' }}>
              <div style={{ fontSize: '10px', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: '10px' }}>Select Neural Engine</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MODELS.map(m => (
                  <div
                    key={m.id}
                    onClick={() => { setSelectedModel(m); setShowSettings(false); }}
                    style={{
                      padding: '8px 12px', background: selectedModel.id === m.id ? 'rgba(0,243,255,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${selectedModel.id === m.id ? 'var(--neon-cyan)' : 'transparent'}`,
                      borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', justifyContent: 'space-between'
                    }}
                  >
                    <span>{m.name}</span>
                    <span style={{ opacity: 0.5, fontSize: '10px' }}>{m.provider}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(0,0,0,0.4)' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'rgba(255,0,255,0.08)' : 'rgba(0,243,255,0.05)',
                border: `1px solid ${m.role === 'user' ? 'var(--neon-magenta)' : 'var(--neon-cyan)'}`,
                padding: '12px 16px',
                borderRadius: '4px', fontSize: '13px', lineHeight: '1.6',
                color: m.role === 'user' ? '#fff' : 'var(--text-main)',
                boxShadow: `0 0 10px ${m.role === 'user' ? 'rgba(255,0,255,0.1)' : 'rgba(0,243,255,0.1)'}`
              }}>
                <div style={{ fontSize: '10px', marginBottom: '6px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                  {m.role === 'user' ? 'Operator' : `Nexus (${selectedModel.provider})`}
                </div>
                {m.content}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', paddingLeft: '5px' }}>
                <Loader2 size={14} className="animate-spin" /> {activeProvider} Processing...
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div style={{ padding: '15px', borderTop: '1px solid rgba(0,243,255,0.2)', background: 'rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={`Query ${selectedModel.name}...`}
                style={{
                  flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,243,255,0.3)',
                  color: '#fff', padding: '12px', borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '13px'
                }}
              />
              <button
                onClick={toggleListen}
                title="Voice Command"
                style={{
                  background: isListening ? 'rgba(255,0,255,0.2)' : 'rgba(0,243,255,0.1)',
                  color: isListening ? 'var(--neon-magenta)' : 'var(--neon-cyan)',
                  border: `1px solid ${isListening ? 'var(--neon-magenta)' : 'var(--neon-cyan)'}`,
                  borderRadius: '4px', padding: '0 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
              </button>
              <button
                onClick={handleSend} disabled={isTyping || !input.trim()}
                style={{
                  background: 'rgba(0,243,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid var(--neon-cyan)',
                  borderRadius: '4px', padding: '0 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: (isTyping || !input.trim()) ? 0.5 : 1
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
