import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bluetooth, Cpu, RefreshCw, Send, Check } from 'lucide-react';

export default function RequestsTab() {
  const [requests, setRequests] = useState(() => {
    const saved = sessionStorage.getItem('disaster_requests');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [simActive, setSimActive] = useState(false);
  const [simStage, setSimStage] = useState(0);

  // Poll state from sessionStorage for real-time tab synchrony
  useEffect(() => {
    const syncSession = () => {
      const active = sessionStorage.getItem('sim_active') === 'true';
      const stage = parseInt(sessionStorage.getItem('sim_active_stage') || '0');
      setSimActive(active);
      setSimStage(stage);

      const saved = sessionStorage.getItem('disaster_requests');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRequests(prev => {
            if (JSON.stringify(prev) !== saved) {
              return parsed;
            }
            return prev;
          });
        } catch (e) {
          console.error("Failed to parse disaster_requests in RequestsTab", e);
        }
      }
    };

    syncSession();
    const interval = setInterval(syncSession, 200);
    return () => clearInterval(interval);
  }, []);

  // Save requests to sessionStorage only when they change locally
  useEffect(() => {
    const saved = sessionStorage.getItem('disaster_requests');
    const currentStr = JSON.stringify(requests);
    if (saved !== currentStr) {
      sessionStorage.setItem('disaster_requests', currentStr);
    }
  }, [requests]);

  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', disease: '', resource: 'Immediate Saline', priority: '2', location: 'Howrah'
  });
  const [btStatus, setBtStatus] = useState('Disconnected');
  const [aiStatus, setAiStatus] = useState('Standby');

  const callAiTriage = async (condition) => {
    if (!condition || condition.length < 3) return null;

    const prompt = `
      Analyze this disaster victim condition: "${condition}"
      1. Assign Priority: 1 (Critical/Life-threatening), 2 (High/Dangerous), or 3 (Moderate/Standard).
      2. Suggest Resource: Choose from [Immediate Saline, Medical Rations, Rescue Boat, Shelter Kit, Potable Water, First Aid Kit].
      3. Brief Analysis: 1 sentence explaining the risk.
      Return ONLY a JSON object: {"priority": "1|2|3", "resource": "Name", "analysis": "Text"}
    `;

    // Priority: OpenRouter -> Groq -> DeepSeek
    const providers = [
      { name: 'OpenRouter', key: import.meta.env.VITE_OPENROUTER_API_KEY, model: 'openrouter/free' },
      { name: 'Groq', key: import.meta.env.VITE_GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
      { name: 'DeepSeek', key: import.meta.env.VITE_DEEPSEEK_API_KEY, model: 'deepseek-chat' }
    ];

    for (const p of providers) {
      if (!p.key) continue;
      try {
        let result;
        if (p.name === 'Google') {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${p.key}`;
          console.log(`[Triage] Calling Gemini: ${url.split('?')[0]}`);
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const data = await res.json();
          result = data.candidates[0].content.parts[0].text;
        } else {
          let endpoint;
          if (p.name === 'OpenAI') endpoint = 'https://api.openai.com/v1/chat/completions';
          else if (p.name === 'Groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
          else if (p.name === 'DeepSeek') endpoint = 'https://api.deepseek.com/chat/completions';
          else if (p.name === 'OpenRouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${p.key}`,
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'Nexus Disaster Dashboard'
            },
            body: JSON.stringify({ model: p.model, messages: [{ role: 'user', content: prompt }] })
          });
          const data = await res.json();
          result = data.choices[0].message.content;
        }

        const cleanJson = result.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (err) {
        console.warn(`${p.name} triage link failed. Trying next provider...`);
      }
    }
    return null;
  };

  useEffect(() => {
    if (!formData.disease) {
      setAiStatus('Standby');
      return;
    }

    const timeout = setTimeout(async () => {
      setAiStatus('Neural Scanning...');
      const result = await callAiTriage(formData.disease);

      if (result) {
        setFormData(prev => ({
          ...prev,
          priority: result.priority,
          resource: result.resource || prev.resource
        }));
        setAiStatus('Triage Optimized');
      } else {
        setAiStatus('Offline Mode');
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [formData.disease]);

  const handleConnectBluetooth = async () => {
    try {
      if (!navigator.bluetooth) {
        setBtStatus('Bluetooth not supported on this device/browser.');
        return;
      }
      setBtStatus('Pairing...');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true
      });
      setBtStatus(`Connected: ${device.name || 'Unknown Device'}`);
    } catch (err) {
      setBtStatus(`Connection Failed: ${err.message}`);
    }
  };

  const generateAiDescription = (condition, priority) => {
    if (!condition) return "Awaiting telemetry for detailed analysis.";
    if (priority === '1') {
      return `Critical trauma detected: "${condition}" presents a high life-risk. Immediate intervention required.`;
    } else if (priority === '2') {
      return `Significant physiological stress: "${condition}" requires clinical monitoring to prevent deterioration.`;
    }
    return `Stable condition: "${condition}" is suitable for standard resource distribution.`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;

    const newReq = {
      id: Date.now(),
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      disease: formData.disease,
      resource: formData.resource,
      priority: parseInt(formData.priority),
      description: generateAiDescription(formData.disease, formData.priority),
      status: 'pending',
      rescueTimeLimit: formData.priority === '1' ? 20 : formData.priority === '2' ? 40 : 60,
      time: Date.now(),
      location: formData.location
    };

    setRequests(prev => [...prev, newReq]);
    setFormData({ name: '', age: '', gender: 'Male', disease: '', resource: 'Immediate Saline', priority: '2', location: 'Howrah' });
  };

  const handleResolve = (id) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  // Auto-Resolve Logic for Dispatched Units
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRequests(prev => {
        let changed = false;
        const filtered = prev.filter(req => {
          if (req.status === 'dispatched' && req.rescueTimeLimit) {
            const elapsed = (now - req.dispatchTime) / 1000;
            if (elapsed >= req.rescueTimeLimit) {
              changed = true;
              return false; // Auto-resolve: remove from queue
            }
          }
          return true;
        });
        return changed ? filtered : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedRequests = [...requests].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority; // Lower number means higher priority (1 before 2)
    }
    return a.time - b.time; // If same priority, older request comes first (FCFS)
  });

  return (
    <div style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '10px 20px', display: 'flex', gap: '30px' }}>

      {/* Request Form */}
      <div className="glass-panel" style={{ flex: 1, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '20px' }}>Victim Registration</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--neon-cyan)', marginBottom: '5px' }}>Full Name</label>
            <input type="text" placeholder="Enter victim's name"
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', padding: '10px', borderRadius: '4px' }} required />
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--neon-cyan)', marginBottom: '5px' }}>Age</label>
              <input type="number" placeholder="Age"
                value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', padding: '10px', borderRadius: '4px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--neon-cyan)', marginBottom: '5px' }}>Gender</label>
              <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', padding: '10px', borderRadius: '4px' }}>
                <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '12px', color: 'var(--neon-cyan)' }}>Disease / Condition</label>
              <div style={{ fontSize: '10px', color: aiStatus === 'Triage Optimized' ? 'var(--neon-lime)' : 'var(--neon-magenta)', border: `1px solid ${aiStatus === 'Triage Optimized' ? 'var(--neon-lime)' : 'var(--neon-magenta)'}`, padding: '2px 6px', borderRadius: '4px' }}>
                Neural Triage: {aiStatus}
              </div>
            </div>
            <input type="text" placeholder="e.g. Typhoid, Dislocated collar bone"
              value={formData.disease} onChange={e => setFormData({ ...formData, disease: e.target.value })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', padding: '10px', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--neon-cyan)', marginBottom: '5px' }}>Resources Required</label>
            <select value={formData.resource} onChange={e => setFormData({ ...formData, resource: e.target.value })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', padding: '10px', borderRadius: '4px' }}>
              <option value="Immediate Saline">Immediate Saline</option>
              <option value="Medical Rations">Medical Rations</option>
              <option value="Rescue Boat">Rescue Boat</option>
              <option value="Shelter Kit">Shelter Kit</option>
              <option value="Potable Water">Potable Water</option>
              <option value="First Aid Kit">First Aid Kit</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--neon-cyan)', marginBottom: '5px' }}>Location Details (Zone)</label>
            <select value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', padding: '10px', borderRadius: '4px' }} required>
              <option value="Howrah">Howrah</option>
              <option value="Sector 4 Area">Sector 4 Area</option>
              <option value="North Avenue">North Avenue</option>
              <option value="Central Station">Central Station</option>
              <option value="Salt Lake">Salt Lake</option>
              <option value="New Town">New Town</option>
              <option value="South City">South City</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--neon-cyan)', marginBottom: '5px' }}>Severity (Priority)</label>
            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}
              style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', padding: '10px', borderRadius: '4px' }}>
              <option value="1">Extreme (CRITICAL)</option>
              <option value="2">Dangerous (HIGH)</option>
              <option value="3">Moderate (STANDARD)</option>
            </select>
          </div>
          <button type="submit" style={{ marginTop: '10px', padding: '12px', background: 'rgba(0, 243, 255, 0.2)', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)', cursor: 'pointer', fontFamily: 'var(--font-header)', letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.3s' }}>
            Submit Registration
          </button>
        </form>

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(0, 243, 255, 0.2)' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>External Device Connectivity</h3>
          <button type="button" onClick={handleConnectBluetooth}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed var(--neon-magenta)', color: 'var(--neon-magenta)', cursor: 'pointer', fontFamily: 'var(--font-header)' }}>
            Initialize Web Bluetooth Link
          </button>
          <div style={{ marginTop: '10px', fontSize: '12px', color: btStatus.includes('Failed') || btStatus.includes('supported') ? 'var(--neon-red)' : 'var(--neon-lime)', textAlign: 'center' }}>
            System Status: [{btStatus}]
          </div>
        </div>
      </div>

      {/* Active Queue */}
      <div className="glass-panel" style={{ flex: 1.5, padding: '25px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Active Operations Queue</h2>
          <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--neon-cyan)', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', color: 'var(--neon-cyan)' }}>
            {requests.length} TICKETS OPEN
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', paddingRight: '5px' }}>
          {sortedRequests.map((req, index) => {
            const isTop = index === 0;
            const priorityColor = req.priority === 1 ? 'var(--neon-red)' : req.priority === 2 ? 'var(--neon-amber)' : 'var(--neon-lime)';
            return (
              <div key={req.id} style={{
                padding: '15px',
                borderLeft: `4px solid ${priorityColor}`,
                background: isTop && req.priority === 1 ? 'rgba(255, 51, 51, 0.1)' : 'rgba(0,0,0,0.4)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{req.name}</span>
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>({req.age}, {req.gender})</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '13px', color: '#aaa', marginBottom: '10px' }}>
                    <div><strong style={{ color: '#ccc' }}>Condition:</strong> {req.disease || 'N/A'}</div>
                    <div><strong style={{ color: '#ccc' }}>Location:</strong> {req.location}</div>
                    <div style={{ gridColumn: '1 / span 2' }}><strong style={{ color: '#ccc' }}>Needs:</strong> {req.resource || 'N/A'}</div>
                  </div>

                  {/* AI Description Block */}
                  <div style={{ background: 'rgba(0, 243, 255, 0.05)', borderLeft: '2px solid var(--neon-cyan)', padding: '10px', borderRadius: '0 4px 4px 0' }}>
                    <div style={{ fontSize: '10px', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: '5px' }}>Neural Analysis</div>
                    <div style={{ fontSize: '12px', fontStyle: 'italic', lineHeight: '1.4' }}>{req.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: '120px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px',
                    background: req.status === 'dispatched' ? 'rgba(255,255,255,0.1)' : `rgba(${priorityColor === 'var(--neon-red)' ? '255,51,51' : priorityColor === 'var(--neon-amber)' ? '255,176,0' : '57,255,20'}, 0.2)`,
                    color: req.status === 'dispatched' ? '#888' : priorityColor
                  }}>
                    {req.status === 'dispatched' ? 'DISPATCHED' : (req.priority === 1 ? 'EXTREME' : req.priority === 2 ? 'DANGEROUS' : 'MODERATE')}
                  </span>

                  {req.status === 'dispatched' ? (
                    <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--neon-cyan)', padding: '10px', textAlign: 'center', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--neon-cyan)' }}>Rescue ETA</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{Math.max(0, Math.ceil(req.rescueTimeLimit - (Date.now() - req.dispatchTime) / 1000))}s</div>
                    </div>
                  ) : (
                    <button onClick={() => handleResolve(req.id)} style={{ padding: '8px 15px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', transition: 'all 0.2s' }}>
                      Resolve Case
                    </button>
                  )}
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>{new Date(req.time).toLocaleTimeString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bluetooth BLE Pairing Overlay Modal */}
      {simActive && simStage === 5 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 2, 8, 0.92)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '550px',
            border: '2px solid var(--neon-lime)',
            boxShadow: '0 0 30px rgba(57, 255, 20, 0.25)',
            padding: '30px',
            position: 'relative',
            background: 'rgba(5, 5, 20, 0.95)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(57, 255, 20, 0.3)', paddingBottom: '15px' }}>
              <Bluetooth style={{ color: 'var(--neon-lime)' }} size={20} />
              <h3 style={{ fontSize: '15px', color: 'var(--neon-lime)', fontFamily: 'var(--font-header)', letterSpacing: '1px', textShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}>
                BLE TRIAGE BEACON CONNECTIVITY HUD
              </h3>
            </div>

            <p style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.4' }}>
              Science City Mega Shelter local gate node has identified bluetooth emergency beacon broadcast patterns from incoming NDRF extraction craft. Logging patient biological telemetry into primary triage databases...
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Amina Bibi */}
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>Amina Bibi (42F)</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--neon-lime)' }}>MAC: 00:1A:7D:DA:71:11</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', marginBottom: '4px' }}>
                  <span>DEVICE: SM-A420F-BLE</span>
                  <span>STATUS: HANDSHAKE SUCCESSFUL</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div className="ble-progress-1" style={{ height: '100%', background: 'var(--neon-lime)', boxShadow: '0 0 8px var(--neon-lime)' }} />
                </div>
              </div>

              {/* Subir Roy */}
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>Subir Roy (35M)</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--neon-lime)' }}>MAC: 00:1A:7D:DA:71:12</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', marginBottom: '4px' }}>
                  <span>DEVICE: SM-S350M-BLE</span>
                  <span>STATUS: SYNCING TELEMETRY...</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div className="ble-progress-2" style={{ height: '100%', background: 'var(--neon-lime)', boxShadow: '0 0 8px var(--neon-lime)' }} />
                </div>
              </div>

              {/* Rajesh Kisku */}
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>Rajesh Kisku (28M)</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--neon-lime)' }}>MAC: 00:1A:7D:DA:71:13</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#888', marginBottom: '4px' }}>
                  <span>DEVICE: SM-R280M-BLE</span>
                  <span>STATUS: INITIALIZING PAIRING...</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div className="ble-progress-3" style={{ height: '100%', background: 'var(--neon-lime)', boxShadow: '0 0 8px var(--neon-lime)' }} />
                </div>
              </div>
            </div>

            {/* Custom CSS for BLE progress bars injected inline */}
            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes fillBle1 {
                0% { width: 0%; }
                100% { width: 100%; }
              }
              @keyframes fillBle2 {
                0% { width: 0%; }
                30% { width: 0%; }
                100% { width: 100%; }
              }
              @keyframes fillBle3 {
                0% { width: 0%; }
                60% { width: 0%; }
                100% { width: 100%; }
              }
              .ble-progress-1 {
                animation: fillBle1 4s forwards cubic-bezier(0.4, 0, 0.2, 1);
              }
              .ble-progress-2 {
                animation: fillBle2 6s forwards cubic-bezier(0.4, 0, 0.2, 1);
              }
              .ble-progress-3 {
                animation: fillBle3 8s forwards cubic-bezier(0.4, 0, 0.2, 1);
              }
            `}} />
          </div>
        </div>
      )}
    </div>
  );
}
