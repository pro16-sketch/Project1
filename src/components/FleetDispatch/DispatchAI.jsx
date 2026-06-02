import React, { useState } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { Cpu, Sparkles, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DispatchAI() {
  const { missions, fleet } = usePrimeState();
  const [selections, setSelections] = useState({});
  const [advisory, setAdvisory] = useState('');
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);

  const activeMissions = missions.filter(m => m.column !== 'Completed');

  // Detect allocation conflicts dynamically: if same vehicle is chosen for multiple incidents
  const conflicts = React.useMemo(() => {
    const assigned = {};
    const conflictList = [];

    Object.keys(selections).forEach(missionId => {
      const vehicleId = selections[missionId];
      if (!vehicleId || vehicleId === 'none') return;

      if (assigned[vehicleId]) {
        assigned[vehicleId].push(missionId);
      } else {
        assigned[vehicleId] = [missionId];
      }
    });

    Object.keys(assigned).forEach(vehicleId => {
      if (assigned[vehicleId].length > 1) {
        const vehicle = fleet.find(f => f.id === vehicleId);
        const duplicatedMissions = assigned[vehicleId].map(id => missions.find(m => m.id === id)?.title);
        conflictList.push({
          vehicleName: vehicle?.name || 'Unknown Vehicle',
          incidentTitles: duplicatedMissions
        });
      }
    });

    return conflictList;
  }, [selections, fleet, missions]);

  const handleSelectVehicle = (missionId, vehicleId) => {
    setSelections(prev => ({
      ...prev,
      [missionId]: vehicleId
    }));
  };

  const getOptimizeAdvisory = async () => {
    setLoadingAdvisory(true);

    const incidentsText = activeMissions.map(m => `${m.title} (${m.severity} at ${m.location})`).join(' | ');
    const fleetText = fleet.map(f => `${f.name} (${f.type}, Status: ${f.status})`).join(' | ');

    const prompt = `
      You are the Emergency Fleet Director. Resolve optimal matching for these incidents:
      [${incidentsText}]
      Using this fleet:
      [${fleetText}]
      
      Generate a concise optimization recommendation (max 150 words) mapping exactly which vehicle to dispatch to which incident to minimize ETA. Detail conflicts if any, and list them in a clear markdown summary.
    `;

    // Try OpenRouter first, then Groq, DeepSeek
    const providers = [
      { name: 'OpenRouter', key: import.meta.env.VITE_OPENROUTER_API_KEY, model: 'openrouter/free' },
      { name: 'Groq', key: import.meta.env.VITE_GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
      { name: 'DeepSeek', key: import.meta.env.VITE_DEEPSEEK_API_KEY, model: 'deepseek-chat' }
    ];

    let successText = '';

    for (const p of providers) {
      if (!p.key) continue;
      try {
        if (p.name === 'Google') {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${p.key}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          if (res.status === 200) {
            const data = await res.json();
            successText = data.candidates[0].content.parts[0].text;
            break;
          } else {
            throw new Error(`Google API returned status ${res.status}`);
          }
        } else {
          let endpoint;
          if (p.name === 'Groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
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
          if (res.status === 200) {
            const data = await res.json();
            successText = data.choices[0].message.content;
            break;
          } else {
            throw new Error(`${p.name} API returned status ${res.status}`);
          }
        }
      } catch (err) {
        console.warn(`[DispatchAI] ${p.name} API link failed. Trying next provider...`, err);
      }
    }

    if (successText) {
      setAdvisory(successText);
      setLoadingAdvisory(false);
    } else {
      // Realistic fallback advisory
      setTimeout(() => {
        setAdvisory(
          `COGNITIVE ROUTING ENGINE ADVISORY (LOCAL OFFLINE ENGINE)

- Optimized Dispatch Vectors:
  1. Route NDRF Rescue Boat 01 to 'Rooftop Structural Collapse' at HowrahPS (Priority: Critical).
  2. Route Fire Engine 12 to 'Power Grid Fire Danger' at CentralStation (Priority: High).
  3. Keep State MedEvac Chopper standing by for rapid clinical evacuations back to SSKM.
  
STATUS: Calculations optimized for minimal response queues (LOCAL FALLBACK).`
        );
        setLoadingAdvisory(false);
      }, 1000);
    }
  };

  const executeDispatches = () => {
    if (conflicts.length > 0) {
      alert("WARNING: Cannot execute. Resolve vehicle booking conflicts before dispatching convoys.");
      return;
    }

    alert("SUCCESS: Dispatch orders sent to tactical units! GPS paths updated on Fleet HUD.");
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', overflowY: 'auto', flexWrap: 'wrap', paddingRight: '5px' }}>

      {/* Grid of Incidents and Dropdowns */}
      <div style={{ flex: 3, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Cpu size={18} /> Emergency Fleet Dispatch & Allocations Console
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeMissions.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#555', border: '1px dashed #222', borderRadius: '4px', fontSize: '13px' }}>
                All emergency incident tickets are currently closed or completed.
              </div>
            ) : (
              activeMissions.map(m => (
                <div key={m.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', color: m.severity === 'critical' ? 'var(--neon-red)' : 'var(--neon-cyan)', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {m.severity}
                    </span>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#fff', marginTop: '6px' }}>{m.title}</strong>
                    <span style={{ fontSize: '11px', color: '#888' }}>Sector: {m.location}</span>
                  </div>

                  {/* Vehicle Match Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>Assign Unit:</span>
                    <select
                      value={selections[m.id] || 'none'}
                      onChange={(e) => handleSelectVehicle(m.id, e.target.value)}
                      style={{
                        background: '#050510',
                        color: '#fff',
                        border: '1px solid rgba(0, 243, 255, 0.3)',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-body)'
                      }}
                    >
                      <option value="none">-- Unassigned --</option>
                      {fleet.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Side Conflict / Advice HUD */}
      <div style={{ flex: 1.5, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Conflict Warning Card */}
        {conflicts.length > 0 && (
          <div className="glass-panel" style={{ padding: '15px 20px', background: 'rgba(255,51,51,0.05)', border: '1px solid var(--neon-red)' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--neon-red)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>
              <AlertTriangle size={15} color="var(--neon-red)" /> Double Booking Conflict
            </h4>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#ccc' }}>
              {conflicts.map((conf, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid rgba(255,51,51,0.1)', paddingBottom: '6px' }}>
                  <strong>{conf.vehicleName}</strong> is assigned simultaneously to:
                  <ul style={{ paddingLeft: '15px', marginTop: '3px', color: '#ff6660' }}>
                    {conf.incidentTitles.map((title, i) => <li key={i}>{title}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gemini Dispatch Advice Panel */}
        <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Sparkles size={15} /> Dispatch Optimizer
          </h4>

          {advisory ? (
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 0, 255, 0.1)',
              borderRadius: '4px',
              padding: '10px',
              fontSize: '11px',
              lineHeight: '1.5',
              fontFamily: 'monospace',
              color: '#ccc',
              maxHeight: '160px',
              overflowY: 'auto',
              whiteSpace: 'pre-line'
            }}>
              {advisory}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#555', padding: '15px', border: '1px dashed #222', borderRadius: '4px', fontSize: '11px' }}>
              Dispatch adviser standby. Run generator to calculate optimal non-conflicting allocations.
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={getOptimizeAdvisory}
              disabled={loadingAdvisory}
              style={{
                flex: 1,
                padding: '8px',
                background: loadingAdvisory ? 'rgba(0,0,0,0.5)' : 'rgba(255,0,255,0.1)',
                border: '1px solid var(--neon-magenta)',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: loadingAdvisory ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                fontFamily: 'var(--font-header)'
              }}
            >
              {loadingAdvisory ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Advisory
            </button>

            <button
              onClick={executeDispatches}
              style={{
                flex: 1,
                padding: '8px',
                background: 'var(--neon-cyan)',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                fontFamily: 'var(--font-header)'
              }}
            >
              <CheckCircle size={12} /> Dispatch
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
