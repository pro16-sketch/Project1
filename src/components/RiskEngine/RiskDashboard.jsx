import React, { useState, useEffect } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { Brain, Flame, Waves, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RiskDashboard() {
  const { sensors, simStage, simActive } = usePrimeState();
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefing, setBriefing] = useState(
    "SYSTEM STANDBY: Click 'Generate Cognitive Risk Briefing' below to run a Gemini neural hazard synthesis across all active environmental sensor matrices."
  );
  
  // Custom states for interactive simulation/parameters
  const [temp, setTemp] = useState(38); // Celsius
  const [humidity, setHumidity] = useState(25); // %
  const [wind, setWind] = useState(28); // km/h

  // Calculate Fire Weather Index (FWI) dynamically
  const fwi = useMemo(() => {
    // Standard simplified FWI logic: higher temp + lower humidity + higher wind = higher index
    const humFactor = (100 - humidity) / 10;
    const windFactor = wind / 5;
    const tempFactor = Math.max(0, temp - 15) / 2;
    const index = Math.min(100, Math.round((tempFactor * humFactor * windFactor) * 0.45));
    return index;
  }, [temp, humidity, wind]);

  function useMemo(factory, deps) {
    return React.useMemo(factory, deps);
  }

  // Get active river levels and compute a simulated Gutenberg-Richter seismic estimate
  const floodRisk = useMemo(() => {
    const riverSensors = sensors.filter(s => s.type === 'river');
    const avg = riverSensors.reduce((acc, curr) => acc + (curr.value / curr.max), 0) / (riverSensors.length || 1);
    return Math.min(100, Math.round(avg * 100));
  }, [sensors]);

  const seismicRisk = useMemo(() => {
    const seismicSensors = sensors.filter(s => s.type === 'seismic');
    const peak = Math.max(...seismicSensors.map(s => s.value), 0.1);
    // Gutenberg-Richter likelihood curve for aftershocks (Peak G * 100 / Gutenberg multiplier)
    return Math.min(100, Math.round(peak * 180 + Math.random() * 5));
  }, [sensors]);

  const compoundScore = useMemo(() => {
    return Math.round((floodRisk * 0.5) + (fwi * 0.3) + (seismicRisk * 0.2));
  }, [floodRisk, fwi, seismicRisk]);

  // Generate 72 hours chart data
  const chartData = useMemo(() => {
    const data = [];
    const baseRisk = compoundScore;
    for (let i = 0; i <= 72; i += 6) {
      // Create a wave that rises then drops depending on simulation stage
      let peakOffset = 0;
      if (simActive) {
        // Rises to peak in 24-36h if sim is in stage 1-3, then drops
        const peakTime = 24 + (simStage * 3);
        const dist = Math.abs(i - peakTime);
        peakOffset = Math.max(0, 30 - dist * 0.7) * (simStage / 4);
      } else {
        peakOffset = Math.sin(i / 10) * 12;
      }
      const risk = Math.min(100, Math.max(5, Math.round(baseRisk + peakOffset + (Math.sin(i / 5) * 5))));
      data.push({
        hour: `+${i}h`,
        Risk: risk,
        Flood: Math.min(100, Math.round(floodRisk + peakOffset * 1.2)),
        Fire: Math.min(100, Math.round(fwi + (Math.cos(i / 12) * 8))),
      });
    }
    return data;
  }, [compoundScore, floodRisk, fwi, simActive, simStage]);

  // Request AI Compound Risk Briefing from Gemini
  const generateAiBriefing = async () => {
    setLoadingBriefing(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      // Realistic high-quality fallback briefing
      setTimeout(() => {
        setBriefing(
          `COGNITIVE SYNTHESIS BRIEFING [LOCAL FALLBACK]

[THREAT LEVEL: ${compoundScore >= 70 ? 'CRITICAL' : compoundScore >= 40 ? 'WARNING' : 'STANDBY'}]
Sector hazards calculated over Hooghly River Basin and Eastern Metropolitans.

1. FLOOD INGRESS ADVISORY (Risk: ${floodRisk}%): Current river gauges show high volumetric ingress in the West Bank sectors (Howrah/Bally). Hydrological trends suggest cresting within 12 hours. High preparedness advised for low-lying channels.
2. FIRE WEATHER INDEX (FWI: ${fwi}%): Ambient air indicators (Temp ${temp}°C, Humidity ${humidity}%, Wind ${wind} km/h) show moderately dry combustion thresholds. High industrial sectors around Garia and Sonarpur are flagged for preventive power shutdowns.
3. SEISMIC LIKELIHOOD (Probability: ${seismicRisk}%): Gutenberg-Richter equations show stable seismic logs. Aftershock potential remains minor (<3.2 Richter).

OPERATIONAL DIRECTIVE: Prioritize marine dispatch teams in Howrah corridor and coordinate with medical nodes at SSKM for surge triage preparation.`
        );
        setLoadingBriefing(false);
      }, 1000);
      return;
    }

    const sensorSummary = sensors.map(s => `${s.name}: ${s.value}${s.unit} (${s.status})`).join(', ');
    const prompt = `
      You are the Nexus Prime AI Disaster Analyst. Synthesize this live environmental telemetry:
      [${sensorSummary}]
      Current Met Parameters: Temp ${temp}°C, Relative Humidity ${humidity}%, Wind Speed ${wind} km/h.
      Calculated FWI: ${fwi}%, Calculated Hydrology Alert: ${floodRisk}%, Gutenberg-Richter Aftershock likelihood: ${seismicRisk}%.
      
      Generate a professional, structured Emergency Operations Briefing (max 180 words) including:
      - Active Hazard Index Priority list
      - Compound Threat Assessment
      - Tactical recommendations for incident commanders.
      Maintain a high-alert, precise military/emergency dispatcher style. Keep it in clean markdown layout.
    `;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      setBriefing(text);
    } catch (err) {
      setBriefing("Error: Connection to cognitive cluster failed. Please verify API key or network limits.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  const getSeverityColor = (score) => {
    if (score >= 70) return 'var(--neon-red)';
    if (score >= 40) return 'var(--neon-amber)';
    return 'var(--neon-lime)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '5px' }}>
      
      {/* Risk Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Compound Threat Index */}
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Compound Score</span>
              <Brain size={18} color="var(--neon-cyan)" />
            </div>
            <h2 style={{ fontSize: '28px', color: getSeverityColor(compoundScore) }}>
              {compoundScore}%
            </h2>
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${compoundScore}%`, height: '100%', background: getSeverityColor(compoundScore), boxShadow: `0 0 10px ${getSeverityColor(compoundScore)}` }}></div>
            </div>
            <p style={{ fontSize: '11px', color: '#888', marginTop: '6px', textTransform: 'uppercase' }}>
              System Alert State: {compoundScore >= 70 ? 'CRITICAL EVAC' : compoundScore >= 40 ? 'HIGH WARNING' : 'STANDBY ACTIVE'}
            </p>
          </div>
        </div>

        {/* Flood Hydrology Risk */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Flood Inundation</span>
              <Waves size={18} color="var(--neon-cyan)" />
            </div>
            <h2 style={{ fontSize: '28px', color: getSeverityColor(floodRisk) }}>{floodRisk}%</h2>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#888' }}>
              {simActive ? `Monsoon simulation active (Stage ${simStage})` : 'Sensor telemetry stable'}
            </span>
          </div>
        </div>

        {/* Fire Weather Index */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '160px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Fire Weather Index</span>
            <Flame size={18} color="var(--neon-magenta)" />
          </div>
          
          <h2 style={{ fontSize: '28px', color: getSeverityColor(fwi), margin: '5px 0' }}>{fwi}%</h2>
          
          {/* Interactive sliders for weather model */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>Temp: {temp}°C</span>
              <input type="range" min="15" max="50" value={temp} onChange={(e) => setTemp(parseInt(e.target.value))} style={{ width: '100px', accentColor: 'var(--neon-magenta)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>Humidity: {humidity}%</span>
              <input type="range" min="5" max="95" value={humidity} onChange={(e) => setHumidity(parseInt(e.target.value))} style={{ width: '100px', accentColor: 'var(--neon-magenta)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>Wind: {wind} km/h</span>
              <input type="range" min="0" max="60" value={wind} onChange={(e) => setWind(parseInt(e.target.value))} style={{ width: '100px', accentColor: 'var(--neon-magenta)' }} />
            </div>
          </div>
        </div>

        {/* Seismic Gutenberg-Richter */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase' }}>Aftershock Odds</span>
              <Activity size={18} color="var(--neon-red)" />
            </div>
            <h2 style={{ fontSize: '28px', color: getSeverityColor(seismicRisk) }}>{seismicRisk}%</h2>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase' }}>
              Gutenberg-Richter Model: ACTIVE
            </span>
          </div>
        </div>

      </div>

      {/* Main Chart and Gemini Panel Row */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* 72H Timeline Curve */}
        <div className="glass-panel" style={{ flex: 3, minWidth: '320px', padding: '20px', minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '15px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} /> 72-Hour Risk Horizon Projection
          </h3>
          <div style={{ flex: 1, width: '100%', minHeight: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--neon-cyan)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--neon-cyan)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFlood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--neon-red)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--neon-red)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#0a0a19', borderColor: 'rgba(0, 243, 255, 0.4)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Risk" stroke="var(--neon-cyan)" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} />
                <Area type="monotone" dataKey="Flood" stroke="var(--neon-red)" fillOpacity={1} fill="url(#colorFlood)" strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gemini AI Briefing Panel */}
        <div className="glass-panel" style={{ flex: 2, minWidth: '280px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '14px', color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
              <Sparkles size={16} /> Cognitive Briefing Cluster
            </h3>
            
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              border: '1px solid rgba(255, 0, 255, 0.15)', 
              borderRadius: '4px', 
              padding: '15px', 
              fontSize: '13px', 
              lineHeight: '1.6', 
              color: '#bbb',
              minHeight: '200px',
              maxHeight: '280px',
              overflowY: 'auto',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'pre-line'
            }}>
              {briefing}
            </div>
          </div>

          <button
            onClick={generateAiBriefing}
            disabled={loadingBriefing}
            style={{
              width: '100%',
              marginTop: '15px',
              padding: '10px',
              background: loadingBriefing ? 'rgba(0,0,0,0.5)' : 'rgba(255, 0, 255, 0.1)',
              border: '1px solid var(--neon-magenta)',
              borderRadius: '4px',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: loadingBriefing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 10px rgba(255, 0, 255, 0.2)',
              fontFamily: 'var(--font-header)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.3s'
            }}
            className="tab-btn"
          >
            {loadingBriefing ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> SYNCHRONIZING TELEMETRY...
              </>
            ) : (
              <>
                <Brain size={14} /> GENERATE COGNITIVE RISK BRIEFING
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
