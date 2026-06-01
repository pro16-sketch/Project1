import React, { useState } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { BookOpen, FileText, PlusCircle, Check } from 'lucide-react';

export default function IncidentLog() {
  const { simLogs } = usePrimeState();
  const [annotation, setAnnotation] = useState('');
  const [addedLogs, setAddedLogs] = useState([]);

  // Combine simulated logs with user manual annotations
  const allLogs = React.useMemo(() => {
    const combined = [...simLogs, ...addedLogs];
    // Sort so recent logs appear first or last. Let's show newest at the top for premium dashboard feel!
    return combined.sort((a, b) => {
      // Crude parsing of "HH:MM:SS" string for sorting
      return b.time.localeCompare(a.time);
    });
  }, [simLogs, addedLogs]);

  const handleAddAnnotation = (e) => {
    e.preventDefault();
    if (!annotation.trim()) return;

    const timeStr = new Date().toLocaleTimeString();
    const newLog = {
      time: timeStr,
      text: `[MANUAL ANNOTATION] Operator: ${annotation}`
    };

    setAddedLogs(prev => [newLog, ...prev]);
    
    // Also save to sessionStorage simulation log to synchronize with the simulation loop
    try {
      const rawLogs = sessionStorage.getItem('sim_logs') || '[]';
      const parsed = JSON.parse(rawLogs);
      parsed.push(newLog);
      sessionStorage.setItem('sim_logs', JSON.stringify(parsed));
    } catch (err) {}

    setAnnotation('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'hidden' }}>
      
      {/* Upper Control Panel */}
      <div className="print-hide glass-panel" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={18} color="var(--neon-cyan)" />
          <h3 style={{ fontSize: '15px', margin: 0, color: 'var(--neon-cyan)' }}>Chronological Operational Ledger</h3>
        </div>

        <button
          onClick={handlePrint}
          style={{
            background: 'var(--neon-cyan)',
            color: '#000',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-header)',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 10px rgba(0, 243, 255, 0.4)',
            transition: 'all 0.3s'
          }}
        >
          <FileText size={14} /> EXPORT DISPATCH LEDGER (PDF)
        </button>
      </div>

      {/* Main Grid: Form + Ticker List */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }} className="incident-grid">
        
        {/* Manual Annotation Input Form */}
        <div className="glass-panel print-hide" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: 'fit-content' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PlusCircle size={15} /> Append Operator Log
          </h4>
          
          <form onSubmit={handleAddAnnotation} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              placeholder="Type urgent briefing or tactical manual annotation here..."
              style={{
                width: '100%',
                height: '100px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: '#fff',
                padding: '10px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                resize: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '8px',
                background: 'rgba(255,0,255,0.1)',
                border: '1px solid var(--neon-magenta)',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'var(--font-header)',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <Check size={12} /> Append Log
            </button>
          </form>
        </div>

        {/* Chronological Scroll List */}
        <div className="glass-panel" style={{ flex: 2, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} id="printable-incident-ledger">
          
          {/* Printable only header */}
          <div className="print-only-block" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <h1 style={{ color: '#000', textShadow: 'none', fontSize: '20px' }}>NEXUS PRIME OPERATIONAL LOGS</h1>
            <p style={{ color: '#555', fontSize: '11px' }}>CONFIDENTIAL Emergency Operations Center System Transcript — Generated on: {new Date().toLocaleString()}</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
            {allLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', padding: '30px', border: '1px dashed #222', borderRadius: '4px', fontSize: '13px' }}>
                Operational ledger is currently empty. Initialize a monsoon simulation deck drill to stream active telemetry logs.
              </div>
            ) : (
              allLogs.map((log, index) => {
                const isManual = log.text.includes('[MANUAL ANNOTATION]');
                const isCritical = log.text.includes('CRITICAL') || log.text.includes('FAIL') || log.text.includes('Danger');
                const isTelem = log.text.includes('[TELEM]') || log.text.includes('[GIS]');
                
                let textColor = '#ccc';
                if (isManual) textColor = 'var(--neon-magenta)';
                else if (isCritical) textColor = 'var(--neon-red)';
                else if (isTelem) textColor = 'var(--neon-cyan)';

                return (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255,255,255,0.01)',
                      borderLeft: `3px solid ${isManual ? 'var(--neon-magenta)' : isCritical ? 'var(--neon-red)' : isTelem ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'}`,
                      padding: '10px 12px',
                      borderRadius: '0 4px 4px 0',
                      display: 'flex',
                      gap: '15px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      transition: 'all 0.2s'
                    }}
                    className="ledger-row"
                  >
                    <span style={{ color: '#666', flexShrink: 0, fontWeight: 'bold' }}>{log.time}</span>
                    <span style={{ color: textColor, lineHeight: '1.4' }} className="ledger-text">{log.text}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Styled print styles added directly using a style block */}
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
          #printable-incident-ledger {
            display: block !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .print-only-block {
            display: block !important;
          }
          .ledger-row {
            border-left: 2px solid #555 !important;
            border-bottom: 1px solid #ddd !important;
            background: none !important;
            padding: 8px 0 !important;
            page-break-inside: avoid;
          }
          .ledger-text {
            color: #000 !important;
          }
          .incident-grid {
            display: block !important;
          }
        }
      `}</style>

    </div>
  );
}
