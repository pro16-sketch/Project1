import React from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { Activity, ShieldAlert, Cpu, Heart, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Historical Drill metrics curves
const INCIDENT_METRICS = [
  { name: 'Drill 01', MFRT: 28, Reach: 65, Efficiency: 42, Casualty: 14 },
  { name: 'Drill 02', MFRT: 22, Reach: 78, Efficiency: 58, Casualty: 8 },
  { name: 'Drill 03', MFRT: 18, Reach: 84, Efficiency: 74, Casualty: 3 },
  { name: 'Drill 04', MFRT: 12, Reach: 96, Efficiency: 92, Casualty: 0 }
];

export default function PerformanceKPI() {
  const { simActive, simStage } = usePrimeState();

  // Compute live KPIs depending on simulation stage
  const currentKPI = React.useMemo(() => {
    if (simActive) {
      return {
        mfrt: simStage >= 5 ? '8.4s' : 'Pending',
        reach: simStage >= 2 ? '97.2%' : '0.0%',
        efficiency: simStage >= 6 ? '94.8%' : simStage >= 4 ? '78.5%' : '0.0%',
        casualty: simStage >= 5 ? '0' : 'Pending'
      };
    }
    return {
      mfrt: '11.8 seconds',
      reach: '96.4%',
      efficiency: '91.5%',
      casualty: '0 casualties'
    };
  }, [simActive, simStage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '5px' }}>
      
      {/* 4 Large Numerical KPI Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* MFRT Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>MFRT (Response Speed)</span>
            <strong style={{ fontSize: '26px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-header)', display: 'block', marginTop: '10px' }}>{currentKPI.mfrt}</strong>
          </div>
          <span style={{ fontSize: '10px', color: '#666' }}>Mean First Response Time target: &lt;15s</span>
        </div>

        {/* Casualty Reduction Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Casualty Reduction Index</span>
            <strong style={{ fontSize: '26px', color: 'var(--neon-lime)', fontFamily: 'var(--font-header)', display: 'block', marginTop: '10px' }}>{currentKPI.casualty}</strong>
          </div>
          <span style={{ fontSize: '10px', color: '#666' }}>Casualties recorded in current operations sector</span>
        </div>

        {/* Broadcast Reach Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Broadcast Reach Rate</span>
            <strong style={{ fontSize: '26px', color: 'var(--neon-magenta)', fontFamily: 'var(--font-header)', display: 'block', marginTop: '10px' }}>{currentKPI.reach}</strong>
          </div>
          <span style={{ fontSize: '10px', color: '#666' }}>Alerts pushes successfully routed to civilian targets</span>
        </div>

        {/* Supply Chain Efficiency Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Supply Efficiency</span>
            <strong style={{ fontSize: '26px', color: 'var(--neon-amber)', fontFamily: 'var(--font-header)', display: 'block', marginTop: '10px' }}>{currentKPI.efficiency}</strong>
          </div>
          <span style={{ fontSize: '10px', color: '#666' }}>Warnings triggering safe warehouse relocations</span>
        </div>

      </div>

      {/* Recharts Analytics curve */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Response progression linechart */}
        <div className="glass-panel" style={{ flex: 1, minWidth: '320px', padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Activity size={16} /> Chronological Response Velocity Improvements
          </h3>
          
          <div style={{ flex: 1, width: '100%', minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={INCIDENT_METRICS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0a0a19', borderColor: 'rgba(0, 243, 255, 0.4)', color: '#fff', fontSize: '12px' }} />
                <Line type="monotone" dataKey="MFRT" stroke="var(--neon-red)" strokeWidth={2} name="MFRT (sec)" />
                <Line type="monotone" dataKey="Reach" stroke="var(--neon-magenta)" strokeWidth={2} name="Reach (%)" />
                <Line type="monotone" dataKey="Efficiency" stroke="var(--neon-cyan)" strokeWidth={2} name="Efficiency (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Casualty Curve Barchart */}
        <div className="glass-panel" style={{ flex: 1, minWidth: '320px', padding: '20px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--neon-lime)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <ShieldAlert size={16} /> Casualty Reduction curve (Logistics Target)
          </h3>
          
          <div style={{ flex: 1, width: '100%', minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INCIDENT_METRICS}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0a0a19', borderColor: 'rgba(57, 255, 20, 0.4)', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="Casualty" fill="var(--neon-lime)" radius={[4, 4, 0, 0]} name="Casualties Logged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
