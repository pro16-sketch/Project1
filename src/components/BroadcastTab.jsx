import React, { useState, useEffect } from 'react';
import { Send, Globe, Radio, BellRing, ShieldAlert, Smartphone, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const SECTORS = [
  { id: 'nw', name: 'Bally Sector', nodes: 28400 },
  { id: 'w', name: 'Howrah Sector', nodes: 54100 },
  { id: 'sw', name: 'Sankrail Sector', nodes: 18900 },
  { id: 'n', name: 'North Avenue', nodes: 31200 },
  { id: 'c', name: 'Central Station', nodes: 47600 },
  { id: 's', name: 'South City', nodes: 39500 },
  { id: 'e', name: 'Salt Lake', nodes: 61200 },
  { id: 'se', name: 'Sector 4 Area', nodes: 44800 }
];

export default function BroadcastTab() {
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  const [warningMessage, setWarningMessage] = useState('Severe flood warning for sector. Water level expected to rise 2 meters in the next 30 minutes. Evacuate immediately.');
  const [translating, setTranslating] = useState(false);
  const [translations, setTranslations] = useState(null);
  
  const [broadcasting, setBroadcasting] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  
  const [toast, setToast] = useState(null);
  const [logs, setLogs] = useState([]);

  // Simulation Session States
  const [simActive, setSimActive] = useState(false);
  const [simStage, setSimStage] = useState(0);
  const [authorized, setAuthorized] = useState(false);

  // Sync with Simulation state
  useEffect(() => {
    const syncSim = () => {
      const active = sessionStorage.getItem('sim_active') === 'true';
      const stage = parseInt(sessionStorage.getItem('sim_active_stage') || '0');
      const auth = sessionStorage.getItem('sachet_authorized') === 'true';
      
      setSimActive(active);
      setSimStage(stage);
      setAuthorized(auth);

      // Check if simulator set the siren-pending flag and play it
      if (sessionStorage.getItem('sachet_siren_pending') === 'true') {
        sessionStorage.setItem('sachet_siren_pending', 'false');
        if (window.NexusSimulator && typeof window.NexusSimulator.playSiren === 'function') {
          try { window.NexusSimulator.playSiren(); } catch (e) {}
        }
      }

      if (active) {
        // Sequentially populate alert content
        if (stage >= 1 && warningMessage.startsWith('Severe flood warning')) {
          setWarningMessage('EMERGENCY ALERT: River flooding advancing North-to-South. Bally, Howrah, and Central sectors under extreme threat. Evacuate immediately to Science City Mega Shelter.');
        }
        
        if (stage >= 2 && !translations) {
          setTranslations({
            hindi: "अत्यंत आवश्यक सूचना: उत्तर-से-दक्षिण बाढ़ का कहर। बल्ली और हावड़ा क्षेत्रों में जलस्तर 2 मीटर बढ़ रहा है। कृपया तुरंत साइंस सिटी शेल्टर में जाएँ।",
            bengali: "জরুরী সতর্কতা: উত্তর-থেকে-দক্ষিণ বন্যার প্রবল প্লাবন। বালি এবং হাওড়া এলাকা ২ মিটার প্লাবিত। অবিলম্বে সায়েন্স সিটি সেন্টারে আশ্রয় নিন।",
            tamil: "அவசர எச்சரிக்கை: வடக்கிலிருந்து தெற்கு வெள்ள அபாயம். பாலி மற்றும் ஹவுரா பகுதிகள் 2 மீட்டர் வெள்ளத்தில் மூழ்கியுள்ளன. உடனடியாக வெளியேறவும்."
          });
        }

        if (auth && !activeAlert) {
          setActiveAlert({
            sector: { name: 'High-Threat Geofence (North-to-South Ingress)', nodes: 154800 },
            eng: 'EMERGENCY ALERT: River flooding advancing North-to-South. Bally, Howrah, and Central sectors under extreme threat. Evacuate immediately to Science City Mega Shelter.',
            bengali: "জরুরী সতর্কতা: উত্তর-থেকে-দক্ষিণ বন্যার প্রবল প্লাবন। বালি এবং হাওড়া এলাকা ২ মিটার প্লাবিত। অবিলম্বে সায়েন্স সিটি সেন্টারে আশ্রয় নিন।",
            hindi: "अत्यंत आवश्यक सूचना: उत्तर-से-दक्षिण बाढ़ का कहर। बल्ली और हावड़ा क्षेत्रों में जलस्तर 2 मीटर बढ़ रहा है। कृपया तुरंत साइंस सिटी शेल्टर में जाएँ।",
            tamil: "அவசர எச்சரிக்கை: வடக்கிலிருந்து தெற்கு வெள்ள அபாயம். பாலி மற்றும் ஹவுரா பகுதிகள் 2 மீட்டர் வெள்ளத்தில் மூழ்கியுள்ளன. உடனடியாக வெளியேறவும்."
          });
        }
      } else {
        // Clear all states if simulation is not active
        setActiveAlert(null);
        setTranslations(null);
        setWarningMessage('Severe flood warning for sector. Water level expected to rise 2 meters in the next 30 minutes. Evacuate immediately.');
      }
    };

    syncSim();
    const interval = setInterval(syncSim, 1000);
    return () => clearInterval(interval);
  }, [warningMessage, translations, activeAlert]);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTranslate = async () => {
    if (!warningMessage.trim()) {
      setToast({ type: 'warning', text: 'Please input an English warning message first.' });
      return;
    }

    setTranslating(true);
    setTranslations(null);

    const prompt = `
      Translate this critical river flooding warning into Hindi, Bengali, and Tamil.
      Use formal, high-authority, and urgent civil defense terminology.
      Warning Message: "${warningMessage}"
      Return ONLY a raw JSON object with the following exact keys (no markdown, just JSON):
      {"hindi": "Hindi translation", "bengali": "Bengali translation", "tamil": "Tamil translation"}
    `;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const resultText = data.candidates[0].content.parts[0].text;
      const cleanJson = resultText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      setTranslations(parsed);
      setToast({ type: 'success', text: 'Multilingual warning translations compiled.' });
    } catch (err) {
      console.warn("Translation failed, applying high-fidelity fallbacks:", err);

      const fallback = {
        hindi: `अत्यंत आवश्यक सूचना: ${selectedSector.name} में बाढ़ का गंभीर खतरा है। अगले 30 मिनट में जल स्तर 2 मीटर बढ़ने की आशंका है। कृपया तुरंत सुरक्षित आश्रय में जाएं।`,
        bengali: `জরুরী সতর্কতা: ${selectedSector.name} এলাকায় প্রবল বন্যার আশঙ্কা। আগামী ৩০ মিনিটে জলের স্তর ২ মিটার বৃদ্ধি পেতে পারে। অবিলম্বে নিরাপদ স্থানে আশ্রয় নিন।`,
        tamil: `அவசர எச்சரிக்கை: ${selectedSector.name} பகுதியில் கடுமையான வெள்ள அபாயம். அடுத்த 30 நிமிடங்களில் நீர்மட்டம் 2 மீட்டர் உயரக்கூடும். உடனடியாக வெளியேறவும்.`
      };

      setTranslations(fallback);
      setToast({ type: 'warning', text: 'Applying localized translation fallbacks.' });
    } finally {
      setTranslating(false);
    }
  };

  const handleBroadcast = () => {
    if (!translations) {
      setToast({ type: 'warning', text: 'Please compile regional translations before broadcasting.' });
      return;
    }

    setBroadcasting(true);
    if (window.NexusSimulator) {
      window.NexusSimulator.playSiren();
    }

    setTimeout(() => {
      setActiveAlert({
        sector: selectedSector,
        eng: warningMessage,
        ...translations
      });

      // Register authorization globally for the drill
      sessionStorage.setItem('sachet_authorized', 'true');
      sessionStorage.setItem('sachet_active_alert', JSON.stringify({
        eng: warningMessage,
        bengali: translations.bengali,
        hindi: translations.hindi
      }));

      setLogs(prev => [
        {
          time: new Date().toLocaleTimeString(),
          sector: selectedSector.name,
          nodes: selectedSector.nodes,
          status: 'DELIVERED (100%)'
        },
        ...prev
      ]);

      setBroadcasting(false);
      setToast({ type: 'success', text: `SACHET Broadcast sent to ${selectedSector.nodes.toLocaleString()} citizens!` });
    }, 1500);
  };

  const clearActiveAlert = () => {
    setActiveAlert(null);
    sessionStorage.setItem('sachet_authorized', 'false');
    sessionStorage.setItem('sachet_active_alert', 'null');
  };

  return (
    <div style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '10px 20px', position: 'relative' }}>
      
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          background: 'rgba(5, 5, 20, 0.95)',
          border: `1px solid ${toast.type === 'success' ? 'var(--neon-lime)' : 'var(--neon-amber)'}`,
          boxShadow: `0 0 15px ${toast.type === 'success' ? 'rgba(57, 255, 20, 0.4)' : 'rgba(255, 176, 0, 0.4)'}`,
          padding: '15px 25px',
          borderRadius: '4px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div className="pulse" style={{ width: '8px', height: '8px', background: toast.type === 'success' ? 'var(--neon-lime)' : 'var(--neon-amber)' }} />
          <span style={{ fontSize: '13px', fontFamily: 'var(--font-header)', letterSpacing: '1px' }}>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', paddingBottom: '10px' }}>
        <Radio style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} size={24} />
        <h2>SACHET Cellular Geofenced Broadcast HUD</h2>
      </div>

      {/* Unified Simulated Flow (Always Visible) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '30px', marginBottom: '50px' }}>
        
        {/* Operator Alerts Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Banner based on simulation state */}
          {!simActive ? (
            <div style={{
              background: 'rgba(0, 243, 255, 0.05)',
              border: '1px solid rgba(0, 243, 255, 0.2)',
              borderRadius: '4px',
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 0 10px rgba(0, 243, 255, 0.05)'
            }}>
              <Radio className="animate-pulse" size={20} color="var(--neon-cyan)" />
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--neon-cyan)' }}>SYSTEM STATUS: STANDBY MONITORING</strong>
                <p style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>All cellular geofences secure. Standing by. Trigger "Simulate" on Simulation Deck to start drill.</p>
              </div>
            </div>
          ) : (
            <div className="glow-critical" style={{ background: 'rgba(255, 51, 51, 0.1)', border: '1px solid var(--neon-red)', borderRadius: '4px', padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle color="var(--neon-red)" size={20} className="animate-pulse" />
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--neon-red)' }}>DISASTER DETECTED: sequence active</strong>
                <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>River flooding direction: North-to-South. Geofenced cell broadcasting prioritized.</p>
              </div>
            </div>
          )}

          {/* Target Geofence Zone and Alert Editor */}
          <div className="glass-panel" style={{ padding: '25px', border: '1px solid rgba(0, 243, 255, 0.2)', opacity: simActive ? 1 : 0.75, transition: 'opacity 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-cyan)', marginBottom: '15px' }}>
              <Radio size={20} style={{ filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} />
              <h3 style={{ fontSize: '14px', textShadow: '0 0 8px rgba(0,243,255,0.4)' }}>Geofence Target & Warning Matrix</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#aaa', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Target Sector</label>
                <select
                  value={selectedSector.id}
                  disabled={!simActive}
                  onChange={(e) => setSelectedSector(SECTORS.find(s => s.id === e.target.value))}
                  style={{ width: '100%', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(0, 243, 255, 0.3)', color: simActive ? '#fff' : '#888', fontSize: '11px', padding: '10px', borderRadius: '4px', outline: 'none', cursor: simActive ? 'pointer' : 'not-allowed' }}
                >
                  <option value="all">High-Threat Geofence (154,800 active nodes)</option>
                  {SECTORS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.nodes.toLocaleString()} active nodes)</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '10px', color: '#aaa', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Node Count</label>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', border: '1px solid rgba(0, 243, 255, 0.1)', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>
                  154,800 target Handsets
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '10px', color: '#aaa', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>Warning Message</label>
              <textarea
                value={warningMessage}
                disabled={!simActive}
                onChange={(e) => setWarningMessage(e.target.value)}
                style={{ width: '100%', height: '85px', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(0, 243, 255, 0.3)', color: simActive ? '#fff' : '#888', fontSize: '11px', padding: '10px', borderRadius: '4px', outline: 'none', resize: 'none', lineHeight: '1.4', cursor: simActive ? 'text' : 'not-allowed' }}
              />
            </div>

            {simActive && simStage === 1 && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0, 243, 255, 0.1)',
                  border: '1px solid var(--neon-cyan)',
                  color: 'var(--neon-cyan)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Globe size={13} className={translating ? 'animate-spin' : ''} />
                {translating ? 'Synthesizing with Gemini...' : 'Compile Regional Translations'}
              </button>
            )}

            {!simActive && (
              <div style={{
                textAlign: 'center',
                fontSize: '10px',
                color: '#666',
                fontFamily: 'monospace',
                border: '1px dashed rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '4px'
              }}>
                [MATRIX CONTROL LOCKED UNTIL CRISIS ACTIVATION]
              </div>
            )}
          </div>

          {/* Multilingual translations */}
          {translations && (
            <div className="glass-panel" style={{ padding: '25px', border: '1px solid rgba(255, 0, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-magenta)' }}>
                <Globe size={20} style={{ filter: 'drop-shadow(0 0 5px var(--neon-magenta))' }} />
                <h3 style={{ fontSize: '14px', textShadow: '0 0 8px rgba(255,0,255,0.4)' }}>Multilingual Emergency Alert Centers</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Hindi (Authority)</div>
                  <p style={{ fontSize: '10px', lineHeight: '1.4', color: '#e0e0ff' }}>{translations.hindi}</p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--neon-lime)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Bengali (Regional)</div>
                  <p style={{ fontSize: '10px', lineHeight: '1.4', color: '#e0e0ff' }}>{translations.bengali}</p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--neon-amber)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Tamil (Coastal)</div>
                  <p style={{ fontSize: '10px', lineHeight: '1.4', color: '#e0e0ff' }}>{translations.tamil}</p>
                </div>
              </div>

              {!authorized && (
                <button
                  onClick={handleBroadcast}
                  disabled={broadcasting}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(90deg, rgba(255, 0, 0, 0.3) 0%, rgba(255, 0, 255, 0.3) 100%)',
                    border: '2px solid var(--neon-red)',
                    color: '#fff',
                    fontFamily: 'var(--font-header)',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 15px rgba(255, 51, 51, 0.4)',
                    animation: 'pulse 1.5s infinite'
                  }}
                >
                  <Radio size={13} className={broadcasting ? 'animate-pulse' : ''} />
                  {broadcasting ? 'TRANSMITTING SIGNAL...' : 'Authorize SACHET Cell Broadcast'}
                </button>
              )}
            </div>
          )}

          {/* Broadcast Propagation Logs */}
          {logs.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(57, 255, 20, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-lime)', marginBottom: '12px' }}>
                <CheckCircle size={16} />
                <h4 style={{ fontSize: '12px' }}>Cellular Alert Propagation Logs</h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                {logs.map((log, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '4px' }}>
                    <span style={{ color: '#888' }}>{log.time}</span>
                    <span style={{ fontWeight: 'bold' }}>{log.sector}</span>
                    <span style={{ color: 'var(--neon-cyan)' }}>{log.nodes.toLocaleString()} Handsets</span>
                    <span style={{ color: 'var(--neon-lime)', fontWeight: 'bold' }}>{log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Smartphone Simulator Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ position: 'relative', width: '310px', height: '600px', background: '#050510', border: '8px solid #222', borderRadius: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 243, 255, 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '22px', background: '#222', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', zIndex: 100 }}></div>
            
            <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(135deg, #090920 0%, #15092a 100%)', padding: '40px 20px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', fontFamily: 'monospace', zIndex: 10 }}>
                <span>SENTINEL CELL NET</span>
                <span>100% [🔋]</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {authorized && activeAlert ? (
                  <div className="glow-critical" style={{ 
                    background: 'rgba(255, 51, 51, 0.95)', 
                    border: '2px solid #fff', 
                    borderRadius: '12px', 
                    padding: '20px 15px', 
                    textAlign: 'center',
                    boxShadow: '0 0 35px rgba(255,51,51,0.9)',
                    zIndex: 90,
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fff', fontWeight: 'bold', fontSize: '13px', fontFamily: 'var(--font-header)', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '8px', marginBottom: '10px' }}>
                      <BellRing size={16} className="animate-pulse" /> EMERGENCY ALERT
                    </div>
                    
                    <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '11px', color: '#fff', lineHeight: '1.4', fontFamily: 'sans-serif' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>English:</strong>
                        {activeAlert.eng}
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '6px' }}>
                        <strong style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>বাংলা (Bengali):</strong>
                        {activeAlert.bengali}
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '6px' }}>
                        <strong style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>हिन्दी (Hindi):</strong>
                        {activeAlert.hindi}
                      </div>
                    </div>

                    <button
                      onClick={clearActiveAlert}
                      style={{
                        marginTop: '15px',
                        width: '100%',
                        padding: '8px',
                        background: '#fff',
                        border: 'none',
                        color: 'red',
                        fontFamily: 'var(--font-header)',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        textTransform: 'uppercase'
                      }}
                    >
                      Acknowledge
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 10 }}>
                    {/* Cyberpunk home screen wallpaper decoration */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(0,243,255,0.2) 0%, rgba(255,0,255,0.02) 70%)',
                      border: '1px dashed rgba(0, 243, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 15px rgba(0,243,255,0.1)',
                      marginBottom: '10px'
                    }}>
                      <Smartphone size={36} style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 8px rgba(0,243,255,0.5))' }} />
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '28px', color: '#fff', fontFamily: 'var(--font-header)', letterSpacing: '2px', fontWeight: 'bold' }}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '3px', textTransform: 'uppercase' }}>
                        {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    <div style={{
                      width: '90%',
                      background: 'rgba(5, 5, 20, 0.75)',
                      border: '1px solid rgba(0, 243, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '12px 10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <span style={{ fontSize: '9px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-header)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        <div className="pulse" style={{ width: '4px', height: '4px', background: 'var(--neon-cyan)' }}></div>
                        Geofence Node Safe
                      </span>
                      <p style={{ fontSize: '9px', color: '#666', marginTop: '5px', lineHeight: '1.3' }}>
                        No active warning broadcasts. Sentinel emergency channels are monitoring.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ width: '40px', height: '4px', background: '#333', borderRadius: '2px', alignSelf: 'center', zIndex: 10 }}></div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
