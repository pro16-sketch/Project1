import React, { useState } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { Activity, Clock, Navigation, CheckCircle } from 'lucide-react';

const DRILL_MILESTONES = [
  { stage: 1, title: "Drill Ingress Initiated", time: "00:00", description: "Simulation monsoon drill launched. Heavy precipitation radars activated across Hooghly river basin." },
  { stage: 2, title: "Multilingual Emergency Authorized", time: "00:10", description: "SACHET Cell Broadcast authorized. Broad waves pushed to 317,200 civilian smartphones." },
  { stage: 3, title: "Drone Recon Sweep Sweeps", time: "00:20", description: "Thermal sensor scan locking onto structural scour. Isolated survivors logged at Howrah rooftop." },
  { stage: 4, title: "Tactical Flotilla Dispatch", time: "00:30", description: "Marine squads activated from safe docked offset points. Six vessels navigating fast currents." },
  { stage: 5, title: "BLE Handshake Verification", time: "00:50", description: "Vessels docked. Bluetooth handshakes executed to register casualties Amina, Subir, and Rajesh." },
  { stage: 6, title: "Analytics Propagations Synced", time: "01:00", description: "Triage metrics propagated to EOC central databases. Resource drawdown charts updated." },
  { stage: 7, title: "Logistics Audit Completed", time: "01:10", description: "Advisory compiled. Medical reserves depletion yellow indices recorded at Science City." }
];

export default function EventTimeline() {
  const { simStage, simActive } = usePrimeState();
  const [scrubStage, setScrubStage] = useState(1);

  const activeStage = simActive ? simStage : scrubStage;

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(0, 243, 255, 0.1)', paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Clock size={18} /> Emergency Incident scrubbing & Event Replayer
        </h3>
        <p style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
          {simActive ? "LIVE MODE: Synchronizing to active simulation telemetry" : "ANALYSIS MODE: Drag slider to scrub history"}
        </p>
      </div>

      {/* Range Slider Scrubber */}
      <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,243,255,0.1)', borderRadius: '6px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', textTransform: 'uppercase', fontFamily: 'var(--font-header)' }}>
          <span>Monsoon Ingress Start</span>
          <span style={{ color: 'var(--neon-magenta)', fontWeight: 'bold' }}>Active Segment: Stage {activeStage}</span>
          <span>Logistics Audit End</span>
        </div>

        <input
          type="range"
          min="1"
          max="7"
          value={activeStage}
          disabled={simActive}
          onChange={(e) => setScrubStage(parseInt(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            accentColor: 'var(--neon-cyan)',
            cursor: simActive ? 'not-allowed' : 'pointer'
          }}
        />

        {/* Milestone Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', fontFamily: 'monospace' }}>
          {DRILL_MILESTONES.map(m => (
            <span key={m.stage} style={{ color: activeStage >= m.stage ? 'var(--neon-cyan)' : '#666', fontWeight: activeStage === m.stage ? 'bold' : 'normal' }}>
              Stage {m.stage} ({m.time})
            </span>
          ))}
        </div>
      </div>

      {/* Scrubbed Details Box */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', flexWrap: 'wrap', minHeight: 0 }}>
        
        {/* Milestone Details Card */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Scrubbed Segment Snapshot</span>

          {DRILL_MILESTONES.map(m => {
            const isPassed = activeStage >= m.stage;
            const isActive = activeStage === m.stage;

            return (
              <div
                key={m.stage}
                style={{
                  background: isActive ? 'rgba(0, 243, 255, 0.04)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${isActive ? 'var(--neon-cyan)' : isPassed ? 'rgba(0,243,255,0.1)' : 'rgba(255,255,255,0.03)'}`,
                  borderLeft: `4px solid ${isActive ? 'var(--neon-cyan)' : isPassed ? 'var(--neon-lime)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '0 6px 6px 0',
                  padding: '12px 15px',
                  display: 'flex',
                  gap: '15px',
                  opacity: isPassed ? 1 : 0.4,
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', flexShrink: 0 }}>
                  {isActive ? (
                    <Activity size={16} color="var(--neon-cyan)" className="animate-pulse" />
                  ) : isPassed ? (
                    <CheckCircle size={16} color="var(--neon-lime)" />
                  ) : (
                    <Clock size={16} color="#444" />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '13px', color: isActive ? '#fff' : '#ccc' }}>{m.title}</strong>
                    <span style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace' }}>Time: {m.time}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#aaa', margin: '4px 0 0 0', lineHeight: '1.4' }}>{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual GPS status replayer indicator */}
        <div className="glass-panel" style={{ flex: 1, minWidth: '220px', padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px', textAlign: 'center' }}>
          <Navigation size={48} color="var(--neon-cyan)" className={simActive && activeStage === 4 ? 'animate-pulse' : ''} style={{ transform: `rotate(${activeStage * 51}deg)`, transition: 'transform 0.8s ease' }} />
          <div>
            <span style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>Chronological Alignment</span>
            <span style={{ fontSize: '12px', color: '#888' }}>
              Scrubbing timeline synchronizes vector orientations to Stage {activeStage} coordinates.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
