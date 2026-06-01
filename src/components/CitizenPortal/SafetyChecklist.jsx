import React, { useState } from 'react';
import { Sparkles, RefreshCw, Printer, AlertCircle } from 'lucide-react';

export default function SafetyChecklist() {
  const [disaster, setDisaster] = useState('Flooding');
  const [familySize, setFamilySize] = useState('4');
  const [pets, setPets] = useState('No');
  
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState(
    "SYSTEM READY: Configure your household criteria above and click 'Synthesize Survival Protocol' to generate a tailored emergency checklist."
  );

  const generateSurvivalProtocol = async () => {
    setLoading(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      // Local fallback checklist advisor
      setTimeout(() => {
        setChecklist(
          `## PERSONAL EMERGENCY SURVIVAL CHECKLIST: ${disaster.toUpperCase()} PROTOCOL

[Target Configuration: Family of ${familySize} | Pets: ${pets}]

### 1. CRITICAL MEDICAL & WATER DISPATCH
- [ ] Potable Water Reserve: Minimum 45 Liters of fresh bottled water stored in sealed containers.
- [ ] Emergency Medical Rations: 12 high-calorie MRE blocks.
- [ ] Clinical First Aid Kits: Saline wash, clotting gauze, hydration salts, and chronic medications.

### 2. SECURE & FLOOD-SAFE PACKING
- [ ] Sealed Document Safe: Keep identification, property deeds, and medical certificates in watertight pouches.
- [ ] Digital Mesh Comms: Power banks, flashlights, and portable radio receiver tuned to VHF Channel 16.
${pets === 'Yes' ? '- [ ] Pet Evacuation Kit: Specialized pet food, collapsible bowl, leash, and veterinary credentials.' : ''}

### 3. ACTIONABLE SAFE REFUGE CORRIDOR
- [ ] Locate the nearest safe structural shelter (AMRI Stadium Relief Camp or Science City Mega Shelter).
- [ ] Memorize alternate bypass pathways away from low-lying channels and scours.
- [ ] Do not walk or drive through flowing water corridors.`
        );
        setLoading(false);
      }, 1000);
      return;
    }

    const prompt = `
      You are the Emergency Preparedness Advisor. Generate a highly customized survival checklist for:
      Disaster Type: ${disaster}
      Family Size: ${familySize} persons
      Pets: ${pets}
      
      Generate a structured, professional, clean checklist in markdown formatting (max 180 words) focusing on immediate logistics, water requirements, power, medical needs, and evacuation preparedness.
    `;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      setChecklist(text);
    } catch (err) {
      setChecklist("Error: Unified preparedness server down. Defaulting to local emergency manual templates.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', overflowY: 'auto', flexWrap: 'wrap', paddingRight: '5px' }}>
      
      {/* Input settings column */}
      <div className="glass-panel print-hide" style={{ flex: 1, minWidth: '280px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <AlertCircle size={16} /> Household Parameters
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Hazard Event</label>
            <select value={disaster} onChange={(e) => setDisaster(e.target.value)} style={{ background: '#050510', border: '1px solid rgba(0, 243, 255, 0.2)', padding: '6px', color: '#fff', borderRadius: '4px', fontSize: '12px' }}>
              <option value="Flooding">Flash Flooding</option>
              <option value="Tropical Storm">Tropical Storm</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Industrial Fire">Industrial Fire</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Family Size</label>
            <input type="number" min="1" max="15" value={familySize} onChange={(e) => setFamilySize(e.target.value)} style={{ background: '#050510', border: '1px solid rgba(0, 243, 255, 0.2)', padding: '6px', color: '#fff', borderRadius: '4px', fontSize: '12px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>House Pets?</label>
            <select value={pets} onChange={(e) => setPets(e.target.value)} style={{ background: '#050510', border: '1px solid rgba(0, 243, 255, 0.2)', padding: '6px', color: '#fff', borderRadius: '4px', fontSize: '12px' }}>
              <option value="No">No Pets</option>
              <option value="Yes">Has Pets</option>
            </select>
          </div>

          <button
            onClick={generateSurvivalProtocol}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '10px',
              background: loading ? 'rgba(0,0,0,0.5)' : 'rgba(0, 243, 255, 0.1)',
              border: '1px solid var(--neon-cyan)',
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: 'var(--font-header)',
              fontSize: '11px',
              textTransform: 'uppercase'
            }}
          >
            {loading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />} Synthesize survival Protocol
          </button>
        </div>
      </div>

      {/* Generated Checklist view */}
      <div className="glass-panel" style={{ flex: 2, minWidth: '320px', padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} id="printable-survival-checklist">
        
        {/* Printable top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,243,255,0.1)', paddingBottom: '10px', marginBottom: '15px' }} className="print-hide">
          <h3 style={{ fontSize: '14px', color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles size={16} /> Survival Checklist Card
          </h3>
          <button onClick={handlePrint} style={{ background: 'rgba(255,0,255,0.1)', border: '1px solid var(--neon-magenta)', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-header)' }}>
            <Printer size={12} /> PRINT PLAN
          </button>
        </div>

        {/* Printable-only header */}
        <div className="print-only-block" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <h1 style={{ color: '#000', textShadow: 'none', fontSize: '20px' }}>NEXUS PORTAL EMERGENCY CIVILIAN CHECKLIST</h1>
          <p style={{ color: '#555', fontSize: '11px' }}>Custom Household Protocol — Disaster: {disaster} | Group Size: {familySize} | Pets: {pets}</p>
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
        }} className="checklist-render-area">
          {checklist}
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
            #printable-survival-checklist {
              display: block !important;
              width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
            }
            .print-only-block {
              display: block !important;
            }
            .checklist-render-area {
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
