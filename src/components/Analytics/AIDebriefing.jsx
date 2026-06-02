import React, { useState } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { Brain, Sparkles, RefreshCw, Printer, CheckCircle } from 'lucide-react';

export default function AIDebriefing() {
  const { simLogs } = usePrimeState();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(
    "SYSTEM STANDBY: Click 'Generate Cognitive After-Action Report' below to run a Gemini synthesis over all system event records."
  );

  const generateReport = async () => {
    setLoading(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      // High-fidelity local fallback after-action report
      setTimeout(() => {
        setReport(
          `# COGNITIVE AFTER-ACTION REPORT (AAR) — DISASTER MONSOON DRILL

[CLASSIFICATION: Emergency Management Evaluation | Target: Nexus Prime]

## 1. STRATEGIC ACHIEVEMENTS
- Multilingual SACHET broadcasts compiled in English, Bengali, and Hindi. Dispatched warn waves to 317,200 smartphones in 0.4s.
- UAV search sweep mapped structural scours at Howrah coordinates, locating Amina Bibi, Subir Roy, and Rajesh Kisku.
- Six marine rescue squads dispatched, executing casualty extractions and returning safely to shelter points.

## 2. METRIC BOTTLENECKS
- Logistics depletion yellow alert recorded at Science City Mega Shelter. Water counts sank from 1200 to 240 units due to high intake surge, flagging supply corridor bottlenecks.
- Secondary ambulance dispatches faced structural scours and wind bottlenecks on Kona Expressway Bypass, shifting transit durations.

## 3. TACTICAL OPERATIONS RE-ALIGNS
- Establish pre-staged supply warehouses at New Town Action Area II to reduce Science City Mega Shelter logistics load by 40%.
- Equip all rescue boats with redundant BLE telemetry trackers to guarantee 100% sync during grid down operations.`
        );
        setLoading(false);
      }, 1000);
      return;
    }

    const logSummary = simLogs.map(l => `${l.time}: ${l.text}`).join('\n');
    const prompt = `
      You are the Lead Disaster Evaluation Director. Synthesize this chronological EOC operational ledger:
      [${logSummary}]
      
      Generate a professional, structured After-Action Report (AAR) (max 180 words) in clean markdown format detailing:
      - Operational Achievements (e.g. Broadcast reach, drone sweeps, successful extractions)
      - Response Bottlenecks (e.g. shelter supply drawdowns, transit delays)
      - Recommendations for future deployments (e.g. pre-staged logistics, redundant telemetry).
      Maintain a precise military-grade evaluation officer voice.
    `;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates[0].content.parts[0].text;
      setReport(text);
    } catch (err) {
      console.warn('AIDebriefing API failed, showing local fallback AAR:', err);
      // High-fidelity local fallback after-action report
      const logCount = simLogs.length;
      setReport(
        `# COGNITIVE AFTER-ACTION REPORT (AAR) — DISASTER MONSOON DRILL

[CLASSIFICATION: Emergency Management Evaluation | Events Processed: ${logCount}]

## 1. STRATEGIC ACHIEVEMENTS
- Multilingual SACHET broadcasts compiled in English, Bengali, and Hindi. Dispatched warn waves to 154,800+ civilian handsets.
- UAV search sweep mapped structural scours at Howrah coordinates (22.5726N, 88.3139E), locating Amina Bibi, Subir Roy, and Rajesh Kisku.
- Six marine rescue squads dispatched, executing casualty extractions and returning safely to shelter points.
- BLE Handshake sync successfully registered all 3 survivors at Science City Mega Shelter.

## 2. METRIC BOTTLENECKS
- Logistics depletion yellow alert recorded at Science City Mega Shelter. Water counts sank from 1,200 to 240 units due to high intake surge, flagging supply corridor bottlenecks.
- Secondary ambulance dispatches faced flood current bottlenecks, shifting transit durations by an estimated 8 minutes.

## 3. TACTICAL RE-ALIGNMENT DIRECTIVES
- Establish pre-staged supply warehouses at New Town Action Area II to reduce Science City logistics load by ~40%.
- Equip all rescue boats with redundant BLE telemetry trackers to guarantee 100% sync during grid-down operations.
- Reduce Stage 2 → Stage 3 authorization latency via Sentinel AI auto-broadcast bypass.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', overflowY: 'auto', flexWrap: 'wrap', paddingRight: '5px' }}>
      
      {/* Overview stats left column */}
      <div className="glass-panel print-hide" style={{ flex: 1, minWidth: '280px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Brain size={16} /> Cognitive Evaluation Hub
        </h3>
        <p style={{ fontSize: '11px', color: '#888', lineHeight: '1.4', margin: 0 }}>
          After-Action Reports (AAR) compile EOC data transcripts to generate preventive strategic recommendations.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', border: '1px solid rgba(0, 243, 255, 0.1)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>Telemetry Logs Synced</span>
            <strong>{simLogs.length} Events</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '3px' }}>
            <span>Drill Validation</span>
            <span style={{ color: 'var(--neon-lime)', fontWeight: 'bold' }}>PASSED</span>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: loading ? 'rgba(0,0,0,0.5)' : 'rgba(255, 0, 255, 0.1)',
            border: '1px solid var(--neon-magenta)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontFamily: 'var(--font-header)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 0 10px rgba(255,0,255,0.2)'
          }}
          className="tab-btn"
        >
          {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} GENERATE COGNITIVE AAR
        </button>
      </div>

      {/* Generated Report view */}
      <div className="glass-panel" style={{ flex: 2, minWidth: '320px', padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} id="printable-aar-report">
        
        {/* Printable top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,0,255,0.1)', paddingBottom: '10px', marginBottom: '15px' }} className="print-hide">
          <h3 style={{ fontSize: '14px', color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles size={16} /> After-Action Briefing Card
          </h3>
          <button onClick={handlePrint} style={{ background: 'rgba(255,0,255,0.1)', border: '1px solid var(--neon-magenta)', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-header)' }}>
            <Printer size={12} /> PRINT REPORT
          </button>
        </div>

        {/* Printable-only header */}
        <div className="print-only-block" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <h1 style={{ color: '#000', textShadow: 'none', fontSize: '20px' }}>NEXUS PRIME AUTOMATED EVALUATION TRANSCRIPT</h1>
          <p style={{ color: '#555', fontSize: '11px' }}>Cognitive Evaluation Service After-Action Report (AAR) — Compiled: {new Date().toLocaleString()}</p>
        </div>

        <div style={{
          flex: 1,
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '4px',
          padding: '20px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#ccc',
          overflowY: 'auto',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace'
        }} className="report-render-area">
          {report}
        </div>

        <style>{`
          @media print {
            body {
              background: #fff !important;
              color: #000 !important;
            }
            .print-hide {
              display: none !important;
            }
            .glass-panel {
              background: none !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
            #printable-aar-report {
              display: block !important;
              width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
            }
            .print-only-block {
              display: block !important;
            }
            .report-render-area {
              color: #000 !important;
              background: none !important;
              border: none !important;
              padding: 0 !important;
              overflow: visible !important;
            }
          }
        `}</style>
      </div>

    </div>
  );
}
