import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, Radio, Camera, Ship, ShieldAlert, Cpu, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';

const STAGES = [
  { id: 0, name: 'System Standby', desc: 'Pre-crisis monitoring active. All channels silent.' },
  { id: 1, name: 'Flood Ingress', desc: 'Monsoon inundation surges from North to South sectors.' },
  { id: 2, name: 'EAS Alert Push', desc: 'AI geofence translation compiles. Authorize cell broadcast.' },
  { id: 3, name: 'Drone Recon Sweep', desc: 'Search UAVs deploy to scan coordinates for survivors.' },
  { id: 4, name: 'Tactical Boat Dispatch', desc: 'Active rescue boat fleet departs to extract stranded victims across all flooded sectors.' },
  { id: 5, name: 'BLE Handshake Check-In', desc: 'Camp arrival node pairing registers citizens.' },
  { id: 6, name: 'Analytics Spike', desc: 'Emergency resource triage prioritizes hospital queues.' },
  { id: 7, name: 'Logistics Supply Audit', desc: 'Resource reserves deplete. Trigger truck replenishment.' }
];

const SECTORS_SEQUENCE = [
  { id: 'nw', name: 'Bally Sector', type: 'north', initialSev: 0.85 },
  { id: 'n', name: 'North Avenue', type: 'north', initialSev: 0.80 },
  { id: 'w', name: 'Howrah Sector', type: 'center', initialSev: 0.95 },
  { id: 'c', name: 'Central Station', type: 'center', initialSev: 0.70 },
  { id: 'sw', name: 'Sankrail Sector', type: 'south', initialSev: 0.90 },
  { id: 's', name: 'South City', type: 'south', initialSev: 0.75 }
];

const PATH_COORDS = {
  base: [22.5400, 88.3960], // Science City Mega Shelter
  target: [22.5726, 88.3139] // Howrah sector victim coordinates
};

const DEFAULT_INVENTORY = {
  'Salt Lake Stadium Relief Camp': { name: 'Stadium Relief Camp', water: 450, medical: 120, rations: 300, shelter: 80, maxWater: 1000, maxMedical: 500, maxRations: 1000, maxShelter: 200 },
  'Science City Mega Shelter': { name: 'Science City Mega Shelter', water: 1200, medical: 500, rations: 800, shelter: 200, maxWater: 2000, maxMedical: 1000, maxRations: 2000, maxShelter: 500 },
  'Rajarhat Evac Center': { name: 'Rajarhat Evac Center', water: 850, medical: 350, rations: 600, shelter: 150, maxWater: 1500, maxMedical: 800, maxRations: 1500, maxShelter: 300 },
  'New Town Action Area I Shelter': { name: 'New Town Action Area I Shelter', water: 900, medical: 400, rations: 700, shelter: 180, maxWater: 1500, maxMedical: 800, maxRations: 1500, maxShelter: 350 },
  'Jadavpur University Relief Camp': { name: 'Jadavpur University Relief Camp', water: 350, medical: 90, rations: 200, shelter: 50, maxWater: 800, maxMedical: 300, maxRations: 800, maxShelter: 150 }
};

export default function SimulationTab() {
  const [activeStage, setActiveStage] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), text: 'System Initialized. All sectors quiet. Pre-crisis standby.' }
  ]);
  const [authorizedAlert, setAuthorizedAlert] = useState(false);
  const [bleSynced, setBleSynced] = useState(false);
  const [boatPercent, setBoatPercent] = useState(0);

  const logsEndRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // High-frequency polling effect to keep local UI elements in sync with background engine
  useEffect(() => {
    const syncSimulationState = () => {
      const active = sessionStorage.getItem('sim_active') === 'true';
      const running = sessionStorage.getItem('sim_is_running') === 'true';
      const stage = parseInt(sessionStorage.getItem('sim_active_stage') || '0');
      const authAlert = sessionStorage.getItem('sim_authorized_alert') === 'true';
      const ble = sessionStorage.getItem('ble_synced') === 'true';
      const percent = parseInt(sessionStorage.getItem('sim_boat_percent') || '0');

      setIsRunning(running);
      setActiveStage(stage);
      setAuthorizedAlert(authAlert);
      setBleSynced(ble);
      setBoatPercent(percent);

      try {
        const savedLogs = sessionStorage.getItem('sim_logs');
        if (savedLogs) {
          setLogs(prev => {
            if (JSON.stringify(prev) !== savedLogs) {
              return JSON.parse(savedLogs);
            }
            return prev;
          });
        } else {
          const defaultLog = { time: new Date().toLocaleTimeString(), text: 'System Initialized. All sectors quiet. Pre-crisis standby.' };
          setLogs(prev => {
            if (prev.length !== 1 || prev[0].text !== defaultLog.text) {
              return [defaultLog];
            }
            return prev;
          });
        }
      } catch (e) {
        console.error("Failed to parse background sim logs", e);
      }
    };

    syncSimulationState();
    const interval = setInterval(syncSimulationState, 200); // 5Hz sync
    return () => clearInterval(interval);
  }, []);

  // Reset System State via global simulator
  const resetSystem = () => {
    if (window.NexusSimulator) {
      window.NexusSimulator.reset();
    }
  };

  // Launch Master Simulation via global simulator
  const startSimulation = () => {
    if (window.NexusSimulator) {
      window.NexusSimulator.start();
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 20px', overflowY: 'auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', paddingBottom: '10px' }}>
        <Cpu style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} size={24} />
        <h2>Emergency Simulation Deck</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', flex: 1, minHeight: 0 }}>
        
        {/* Left Control Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Master Controller panel */}
          <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3>Crisis Orchestrator</h3>
              <p style={{ fontSize: '11px', color: '#888', marginTop: '5px', lineHeight: '1.4' }}>
                Launch a fully automated, high-fidelity simulated disaster event to verify dynamic cross-tab synchronization and neural logic models.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={startSimulation}
                disabled={isRunning}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: isRunning ? 'rgba(57,255,20,0.05)' : 'rgba(0, 243, 255, 0.1)',
                  border: `1px solid ${isRunning ? '#39ff14' : 'var(--neon-cyan)'}`,
                  color: isRunning ? '#39ff14' : 'var(--neon-cyan)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '12px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  boxShadow: isRunning ? 'none' : '0 0 12px rgba(0, 243, 255, 0.2)',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Play size={14} className={isRunning ? 'animate-pulse' : ''} />
                {isRunning ? 'Drill Processing' : 'Simulate'}
              </button>

              <button
                onClick={resetSystem}
                style={{
                  padding: '14px 20px',
                  background: 'rgba(255,51,51,0.05)',
                  border: '1px solid var(--neon-red)',
                  color: 'var(--neon-red)',
                  fontFamily: 'var(--font-header)',
                  fontSize: '12px',
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>

            {isRunning && (
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,243,255,0.2)', padding: '15px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', textTransform: 'uppercase', color: 'var(--neon-cyan)', marginBottom: '8px' }}>
                  <span>Sim Progress</span>
                  <span>Active</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(activeStage / 7) * 100}%`, height: '100%', background: 'var(--neon-cyan)', boxShadow: '0 0 8px var(--neon-cyan)', transition: 'width 0.8s ease' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Stepper Widget */}
          <div className="glass-panel" style={{ padding: '25px', flex: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '12px', color: '#888', letterSpacing: '1px', marginBottom: '20px' }}>Simulation Timeline Stages</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {STAGES.map(s => {
                const isCompleted = activeStage > s.id;
                const isCurrent = activeStage === s.id;
                
                let stepColor = '#333';
                if (isCompleted) stepColor = 'var(--neon-lime)';
                else if (isCurrent) stepColor = 'var(--neon-cyan)';

                return (
                  <div key={s.id} style={{ display: 'flex', gap: '15px', opacity: isCompleted || isCurrent ? 1 : 0.3, transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        border: `2px solid ${stepColor}`,
                        background: isCurrent ? 'rgba(0,243,255,0.1)' : isCompleted ? 'rgba(57,255,20,0.1)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: stepColor, fontSize: '10px', fontWeight: 'bold'
                      }}>
                        {isCompleted ? <CheckCircle2 size={12} color="var(--neon-lime)" /> : s.id}
                      </div>
                      {s.id < 7 && <div style={{ width: '2px', flex: 1, background: isCompleted ? 'var(--neon-lime)' : '#222', minHeight: '20px', marginTop: '5px' }}></div>}
                    </div>

                    <div style={{ flex: 1, paddingBottom: '10px' }}>
                      <h4 style={{ fontSize: '12px', color: isCurrent ? 'var(--neon-cyan)' : '#fff', textShadow: isCurrent ? '0 0 5px rgba(0,243,255,0.4)' : 'none' }}>{s.name}</h4>
                      <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', lineHeight: '1.3' }}>{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Log chatter Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tactical Terminal Console */}
          <div className="glass-panel" style={{ flex: 1.5, padding: '25px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', marginBottom: '15px', borderBottom: '1px solid rgba(0,243,255,0.1)', paddingBottom: '10px' }}>
              <Activity size={18} className={isRunning ? 'animate-pulse' : ''} />
              <h3 style={{ fontSize: '13px' }}>Sentinel-Nexus Integrated Control Feed</h3>
            </div>

            <div style={{
              flex: 1,
              background: '#020208',
              border: '1px solid rgba(0, 243, 255, 0.1)',
              borderRadius: '4px',
              padding: '20px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'var(--neon-lime)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
              lineHeight: '1.5'
            }}>
              {logs.map((l, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(57,255,20,0.03)', paddingBottom: '5px' }}>
                  <span style={{ color: '#00f3ff', opacity: 0.8 }}>[{l.time}]</span>
                  <span style={{ color: l.text.includes('CRITICAL') || l.text.includes('FAIL') ? 'var(--neon-red)' : l.text.includes('SUCCESS') ? 'var(--neon-lime)' : '#e0e0ff' }}>
                    {l.text}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Stage 4/5 Quick Visual HUD */}
          {activeStage >= 4 && (
            <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255,0,255,0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-magenta)' }}>
                <Ship size={16} />
                <h4 style={{ fontSize: '11px' }}>Active Fleet Live Track HUD (6 Units)</h4>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '11px', color: '#aaa' }}>Bases</span>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${boatPercent}%`, height: '100%', background: 'var(--neon-magenta)', boxShadow: '0 0 5px var(--neon-magenta)', transition: 'width 0.1s linear' }}></div>
                  <div style={{ left: '50%', transform: 'translateX(-50%)', position: 'absolute', top: '-1px', width: '6px', height: '10px', background: '#fff', borderRadius: '1px' }}></div>
                </div>
                <span style={{ fontSize: '11px', color: '#aaa' }}>Targets</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888' }}>
                <span>Docked Shelters (Safe Bases)</span>
                <span>Inundated Sectors (Disasters)</span>
              </div>
              <div style={{ fontSize: '9px', color: '#777', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '2px' }}>
                Active routes: Bally, Howrah, Sankrail, North Ave, Central, South City
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
