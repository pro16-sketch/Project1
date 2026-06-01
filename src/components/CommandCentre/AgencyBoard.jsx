import React, { useState } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { Shield, Sparkles, RefreshCw, PhoneCall, Radio } from 'lucide-react';

export default function AgencyBoard() {
  const { agencies } = usePrimeState();
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [briefingText, setBriefingText] = useState('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const getSmeacBriefing = async (agency) => {
    setSelectedAgency(agency);
    setLoadingBriefing(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      // Local fallback SMEAC briefing
      setTimeout(() => {
        setBriefingText(
          `MILITARY-GRADE TACTICAL SMEAC BRIEFING FOR ${agency.name.toUpperCase()}

1. SITUATION: Severe category-3 monsoon inundation active in Hooghly Basin. Ingress has flooded low-lying corridors including Bally and Howrah up to 2.3m. Low structural scours and roof inundation logged.
2. MISSION: Deploy units to targeted coordinates to extract civilians Amina Bibi, Subir Roy, and Rajesh Kisku, and transport them to the Jadavpur University or Science City Mega Shelters.
3. EXECUTION: Launch rescue marine flotillas immediately from offsets. Maintain speed at <25 knots to navigate strong river scours. Coordinate with air support for infrared sweeps.
4. ADMINISTRATION: Medical triage posts active at SSKM and Apollo. Rations and fresh water drawdowns pre-staged at Science City.
5. COMMAND & CONTROL: Incident Commander R. S. Negi in command. Primary communications channeled on ${agency.comms}. Backup communication on Mesh Nodes.`
        );
        setLoadingBriefing(false);
      }, 1000);
      return;
    }

    const prompt = `
      You are the emergency dispatch director. Generate a professional military-style SMEAC (Situation, Mission, Execution, Administration, Command) briefing document for:
      Agency: ${agency.name} (Units: ${agency.units}, Leader: ${agency.leader}, Comms: ${agency.comms}).
      Disaster: Severe River Flooding.
      Format exactly with the five traditional sections (1. SITUATION, 2. MISSION, 3. EXECUTION, 4. ADMINISTRATION, 5. COMMAND & CONTROL) with professional operational terminology. Max 180 words.
    `;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      setBriefingText(text);
    } catch (err) {
      setBriefingText("Error: Failed to secure communication loop with Cognitive Briefing Service.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Active') return 'var(--neon-lime)';
    if (status === 'En Route') return 'var(--neon-cyan)';
    return 'var(--neon-amber)';
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', overflowY: 'auto', flexWrap: 'wrap', paddingRight: '5px' }}>
      
      {/* Agencies Status Grid */}
      <div style={{ flex: 3, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Shield size={18} /> Active Disaster Agencies Dispatch Board
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0, 243, 255, 0.2)', color: '#888' }}>
                  <th style={{ padding: '10px' }}>Agency</th>
                  <th style={{ padding: '10px' }}>Units Deployed</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Last Ping</th>
                  <th style={{ padding: '10px' }}>Comms Loop</th>
                  <th style={{ padding: '10px' }}>Briefing</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map(agency => (
                  <tr key={agency.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle', transition: 'all 0.2s' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{agency.name}</td>
                    <td style={{ padding: '12px 10px', color: '#ccc' }}>{agency.units}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ 
                        color: getStatusColor(agency.status), 
                        background: `${getStatusColor(agency.status)}15`, 
                        border: `1px solid ${getStatusColor(agency.status)}33`,
                        padding: '2px 8px', 
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {agency.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#888' }}>{agency.ping}</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Radio size={12} color="var(--neon-cyan)" /> {agency.comms}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <button
                        onClick={() => getSmeacBriefing(agency)}
                        style={{
                          background: 'rgba(0, 243, 255, 0.1)',
                          border: '1px solid var(--neon-cyan)',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontFamily: 'var(--font-header)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.3s'
                        }}
                      >
                        <Sparkles size={10} /> SMEAC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SMEAC Generator Side-panel */}
      {selectedAgency && (
        <div className="glass-panel" style={{ flex: 1.5, minWidth: '280px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ borderBottom: '1px solid rgba(255, 0, 255, 0.2)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '13px', color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sparkles size={16} /> SMEAC Tactical Briefing
            </h3>
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '3px', color: '#888' }}>
              {selectedAgency.leader}
            </span>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            {loadingBriefing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '15px', color: '#666' }}>
                <RefreshCw size={24} className="animate-spin" color="var(--neon-magenta)" />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-header)', letterSpacing: '1px' }}>SYNTHESIZING Tactical Briefing...</span>
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,0,255,0.1)', 
                padding: '15px', 
                borderRadius: '4px', 
                fontSize: '12px', 
                lineHeight: '1.6', 
                color: '#ddd', 
                height: '100%',
                maxHeight: '360px',
                overflowY: 'auto',
                whiteSpace: 'pre-line',
                fontFamily: 'monospace'
              }}>
                {briefingText}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button
              onClick={() => getSmeacBriefing(selectedAgency)}
              style={{
                flex: 1, padding: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff',
                border: '1px solid var(--neon-magenta)', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
              }}
            >
              <RefreshCw size={12} /> Regenerate
            </button>
            <button
              onClick={() => alert(`Radio link established with ${selectedAgency.leader} via ${selectedAgency.comms}`)}
              style={{
                flex: 1, padding: '8px', background: 'var(--neon-magenta)', color: '#000',
                border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
              }}
            >
              <PhoneCall size={12} /> Hot-Comms Loop
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
