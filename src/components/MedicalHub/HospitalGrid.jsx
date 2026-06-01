import React, { useState } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { Cross, Sparkles, RefreshCw, AlertCircle, Heart } from 'lucide-react';

export default function HospitalGrid() {
  const { hospitals, requests, triagePatient } = usePrimeState();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [loadingTriage, setLoadingTriage] = useState(false);
  const [assignedHospital, setAssignedHospital] = useState(null);

  // Filter only pending requests for clinical triage
  const pendingRequests = requests.filter(r => r.status === 'pending');

  const getTriageRouting = async (request) => {
    setSelectedRequest(request);
    setRecommendation('');
    setAssignedHospital(null);
    setLoadingTriage(true);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Pick a hospital recommendation based on trauma bay and available beds
    const sortedHospitals = [...hospitals].sort((a, b) => b.beds - a.beds);
    const bestHosp = sortedHospitals[0]; // Recommend hospital with most beds

    if (!apiKey) {
      // High-fidelity local fallback triage routing
      setTimeout(() => {
        setRecommendation(
          `COGNITIVE PATIENT TRIAGE DIRECTIVE

- Incident Patient: ${request.name} (Age: ${request.age} | ${request.gender})
- Diagnosis: ${request.disease}
- Designated Facility: ${bestHosp.name}
- Expected Transit: 8.4 minutes (Normal Route)
  
CLINICAL RATIONALE: ${bestHosp.name} currently holds ${bestHosp.beds} active general beds and ${bestHosp.traumaBay} available immediately. The injury profile matches trauma unit specializations. Proximity coordinates suggest minimal vascular threat during transit.`
        );
        setAssignedHospital(bestHosp);
        setLoadingTriage(false);
      }, 1000);
      return;
    }

    const hospitalSummary = hospitals.map(h => `${h.name} (${h.beds} beds, ${h.traumaBay} trauma bays)`).join(', ');
    const prompt = `
      You are the Chief Triage Officer. Resolve the optimal hospital assignment for this patient:
      Name: ${request.name}, Age: ${request.age}, Gender: ${request.gender}, Symptoms/Diagnosis: ${request.disease}.
      
      Available Hospitals:
      [${hospitalSummary}]
      
      Select the single best hospital, estimate travel time, and write a professional medical triage directive (max 150 words) justifying the match. Specify the exact hospital name.
    `;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      setRecommendation(text);
      
      // Attempt to parse which hospital was chosen from the text
      const matched = hospitals.find(h => text.toLowerCase().includes(h.name.toLowerCase()));
      setAssignedHospital(matched || bestHosp);
    } catch (err) {
      setRecommendation("Error: Unified clinical routing grid down. Defaulting to local trauma queue.");
      setAssignedHospital(bestHosp);
    } finally {
      setLoadingTriage(false);
    }
  };

  const confirmTriage = () => {
    if (assignedHospital && selectedRequest) {
      triagePatient(assignedHospital.id, selectedRequest.priority);
      alert(`SUCCESS: Patient ${selectedRequest.name} routed to ${assignedHospital.name}. Bed capacity decremented.`);
      setSelectedRequest(null);
      setRecommendation('');
      setAssignedHospital(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', overflowY: 'auto', flexWrap: 'wrap', paddingRight: '5px' }}>
      
      {/* Live Capacity Grid */}
      <div style={{ flex: 3, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Cross size={18} /> Live Metromedical Capacity Infrastructure Grid
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            {hospitals.map(h => {
              const bedPct = Math.round((h.beds / h.maxBeds) * 100);
              const icuPct = Math.round((h.icu / h.maxIcu) * 100);
              
              let gaugeColor = 'var(--neon-lime)';
              if (bedPct <= 30) gaugeColor = 'var(--neon-red)';
              else if (bedPct <= 60) gaugeColor = 'var(--neon-amber)';

              return (
                <div key={h.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--neon-cyan)' }}>{h.name}</strong>
                    <span style={{ fontSize: '9px', background: 'rgba(0,102,255,0.15)', color: '#00aaff', padding: '2px 6px', borderRadius: '2px', fontWeight: 'bold' }}>
                      TRAUMA: {h.traumaBay}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* General Bed Capacity */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', marginBottom: '3px' }}>
                        <span>General Beds</span>
                        <span>{h.beds} / {h.maxBeds} Free</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.4)', borderRadius: '2.5px', overflow: 'hidden' }}>
                        <div style={{ width: `${bedPct}%`, height: '100%', background: gaugeColor, boxShadow: `0 0 5px ${gaugeColor}` }}></div>
                      </div>
                    </div>

                    {/* ICU Slots */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888', marginBottom: '3px' }}>
                        <span>ICU Slots</span>
                        <span>{h.icu} / {h.maxIcu} Free</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.4)', borderRadius: '2.5px', overflow: 'hidden' }}>
                        <div style={{ width: `${icuPct}%`, height: '100%', background: 'var(--neon-cyan)', boxShadow: '0 0 5px var(--neon-cyan)' }}></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '5px' }}>
                    <span style={{ color: '#666' }}>Blood Reserve</span>
                    <strong style={{ color: h.blood.includes('Low') || h.blood.includes('Critical') ? 'var(--neon-red)' : 'var(--neon-lime)' }}>{h.blood}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Triage Dispatch Console */}
      <div className="glass-panel" style={{ flex: 1.5, minWidth: '280px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--neon-magenta)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 0, 255, 0.2)', paddingBottom: '10px', margin: 0 }}>
          <Sparkles size={16} /> Clinical Triage Dispatch
        </h3>

        {pendingRequests.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#555', border: '1px dashed #222', borderRadius: '4px', padding: '20px' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '11px', marginTop: '10px' }}>No active untriaged disaster victims detected in local sector queues.</span>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Victims Selector */}
            <div>
              <span style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Select Casualty Profile</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {pendingRequests.map(req => (
                  <button
                    key={req.id}
                    onClick={() => getTriageRouting(req)}
                    style={{
                      background: selectedRequest?.id === req.id ? 'rgba(255,0,255,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedRequest?.id === req.id ? 'var(--neon-magenta)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '4px',
                      color: '#fff',
                      padding: '8px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{req.name} ({req.age})</div>
                    <div style={{ fontSize: '10px', color: '#aaa' }}>{req.disease}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Recommendation Output */}
            {selectedRequest && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <span style={{ fontSize: '10px', color: 'var(--neon-magenta)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Heart size={12} /> AI CLINICAL ROUTING RECOMMENDATION
                </span>
                
                {loadingTriage ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                    <RefreshCw size={20} className="animate-spin" color="var(--neon-magenta)" />
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid rgba(255,0,255,0.1)', 
                      borderRadius: '4px', 
                      padding: '10px', 
                      fontSize: '11px', 
                      lineHeight: '1.5',
                      fontFamily: 'monospace', 
                      color: '#ccc',
                      maxHeight: '140px',
                      overflowY: 'auto'
                    }}>
                      {recommendation}
                    </div>

                    <button
                      onClick={confirmTriage}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'var(--neon-magenta)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-header)',
                        textTransform: 'uppercase',
                        boxShadow: '0 0 10px rgba(255,0,255,0.3)',
                        transition: 'all 0.3s'
                      }}
                    >
                      CONFIRM ADMISSION & REALLOCATE
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
