import React, { useState, useEffect } from 'react';
import { Camera, Eye, Zap, ShieldAlert, Cpu, CheckCircle, RefreshCw, Send, AlertTriangle, Ship, Radio, Activity } from 'lucide-react';

const MOCK_FEEDS = [
  {
    id: 'flood-rapid',
    name: 'Bally Sector (UAV-01)',
    type: 'Rapid River Inundation',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-drone-view-of-a-rapid-river-running-through-a-forest-42296-large.mp4',
    location: 'Bally',
    resource: 'Rescue Boat',
    description: 'Aerial drone capture of surging river currents inundating low-lying residential sectors. Urgent rescue boat dispatch required.'
  },
  {
    id: 'flood-surge',
    name: 'Howrah Sector (UAV-02)',
    type: 'Torrential Storm Surge',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-muddy-river-water-flowing-rapidly-42291-large.mp4',
    location: 'Howrah',
    resource: 'Rescue Boat',
    description: 'Infrared thermal FLIR lens tracking flood surge in high-density Howrah sector. High risk of submerged civilian housing.'
  },
  {
    id: 'flood-currents',
    name: 'Sankrail Sector (UAV-03)',
    type: 'Flash Flood Currents',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-flowing-water-of-a-river-in-forest-42287-large.mp4',
    location: 'Sankrail',
    resource: 'Rescue Boat',
    description: 'UAV flood stream logging hazardous cross-current speeds exceeding 4.2m/s. Deploy rescue inflatables.'
  }
];

export default function VisionTab() {
  const [selectedFeed, setSelectedFeed] = useState(MOCK_FEEDS[0]);
  const [customImage, setCustomImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  // Simulation parameters
  const [simActive, setSimActive] = useState(false);
  const [simStage, setSimStage] = useState(0);
  const [simBoatPos, setSimBoatPos] = useState([22.5400, 88.3960]);
  const [simBoatPercent, setSimBoatPercent] = useState(0);

  // Unified high-frequency polling effect for real-time visual synchrony
  useEffect(() => {
    const syncSimulation = () => {
      const active = sessionStorage.getItem('sim_active') === 'true';
      const stage = parseInt(sessionStorage.getItem('sim_active_stage') || '0');
      
      setSimActive(active);
      setSimStage(stage);

      if (active) {
        try {
          const boatPosSaved = sessionStorage.getItem('sim_boat_pos');
          if (boatPosSaved) {
            setSimBoatPos(JSON.parse(boatPosSaved));
          }
          const boatPctSaved = sessionStorage.getItem('sim_boat_percent');
          if (boatPctSaved) {
            setSimBoatPercent(parseInt(boatPctSaved));
          }
        } catch (e) {
          console.error("Failed to parse sim telemetry in VisionTab", e);
        }
      }
    };

    syncSimulation();
    const interval = setInterval(syncSimulation, 200); // 5hz high-performance loop
    return () => clearInterval(interval);
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle uploaded file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target.result);
        setSelectedFeed(null);
        setAnalysisResult(null);
        setToast({ type: 'success', text: 'Custom tactical image loaded into sensor deck.' });
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to convert Image URL to Base64
  const convertUrlToBase64 = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleVisionAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    const promptText = `
      You are the Global Sentinel Autonomous Intelligence Drone analyzing a disaster-zone aerial photo.
      Review this aerial disaster camera feed. Output a flood severity assessment and rescue dispatch recommendation.
      
      Return ONLY a raw JSON object with the following exact keys (no markdown formatting, no other text, just raw JSON):
      {
        "damageSeverity": number (integer between 0 and 100),
        "estimatedCasualties": number (integer estimate),
        "primaryHazard": "Brief 1-2 sentence technical summary of the aquatic threat (e.g. rapid currents, rising surge, submerged debris, waterborne hazard)",
        "suggestedFleet": "Specific dispatch requirements (e.g. 2 rescue inflatables, 1 amphibious truck, shallow-draft rescue skiffs)"
      }
    `;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined in environment variables.");
      }

      let base64Data = "";
      let mimeType = "image/png";

      if (customImage) {
        base64Data = customImage.split(',')[1];
        if (customImage.includes("image/jpeg") || customImage.includes("image/jpg")) {
          mimeType = "image/jpeg";
        }
      } else {
        base64Data = await convertUrlToBase64(selectedFeed.url);
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }]
        })
      });

      if (!res.ok) {
        throw new Error(`Gemini Vision API error: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No analysis candidates returned by Gemini.");
      }

      const result = data.candidates[0].content.parts[0].text;
      const cleanJson = result.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      setAnalysisResult(parsed);
      setToast({ type: 'success', text: 'Sentinel Drone telemetry compiled successfully.' });
    } catch (err) {
      console.error("Vision analysis failed, applying tactical fallback rules:", err);
      setError(err.message || "Failed to contact Gemini Vision.");

      // High-Fidelity local rules engine fallback
      let fallback = {
        damageSeverity: 78,
        estimatedCasualties: 8,
        primaryHazard: "Severe inundation distress: deep street floods preventing vehicular access. Strong hydrodynamic currents logged.",
        suggestedFleet: "Tactical NDRF Marine Squad + 2 Rescue Boats"
      };

      if (selectedFeed) {
        if (selectedFeed.id === 'flood-rapid') {
          fallback = {
            damageSeverity: 85,
            estimatedCasualties: 12,
            primaryHazard: "Rapid river water flow inundating sector streets. High hydrokinetic sweep forces making road access impossible.",
            suggestedFleet: "NDRF Marine Squad + 3 Inflatable Rescue Boats"
          };
        } else if (selectedFeed.id === 'flood-surge') {
          fallback = {
            damageSeverity: 72,
            estimatedCasualties: 7,
            primaryHazard: "High-density sector surge. Heavy waterlogged streets. Dynamic water flow compromising ground foundations.",
            suggestedFleet: "Rescue Boat Squad + 2 Heavy Inflatables"
          };
        } else if (selectedFeed.id === 'flood-currents') {
          fallback = {
            damageSeverity: 90,
            estimatedCasualties: 15,
            primaryHazard: "Severe flash currents with speed over 4.2m/s. Active undercurrent vectors risking swept debris blocks.",
            suggestedFleet: "Waterborne Evacuation Unit + 4 High-Powered Rescue Inflatables"
          };
        }
      }

      setAnalysisResult(fallback);
      setToast({ type: 'warning', text: 'Tactical Local Fallback Rules Applied.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleQueueIngestion = () => {
    if (!analysisResult) return;

    const activeRequests = JSON.parse(sessionStorage.getItem('disaster_requests') || '[]');

    // Auto-map severity score to priority level (75+ is Priority 1, 45+ is Priority 2, rest is 3)
    let priority = 3;
    if (analysisResult.damageSeverity >= 75) priority = 1;
    else if (analysisResult.damageSeverity >= 45) priority = 2;

    const locationName = selectedFeed ? selectedFeed.location : 'Howrah';
    const resourceName = selectedFeed ? selectedFeed.resource : 'First Aid Kit';

    const newRequest = {
      id: Date.now(),
      name: `SENTINEL DRONE - INCIDENT #${Math.floor(1000 + Math.random() * 9000)}`,
      age: "N/A",
      gender: "Multiple",
      disease: `Core Hazard: ${analysisResult.primaryHazard}`,
      resource: resourceName,
      priority: priority,
      description: `AUTOMATED AERIAL SURVEILLANCE REPORT:\n\n- DAMAGE SEVERITY: ${analysisResult.damageSeverity}%\n- ESTIMATED CASUALTIES: ${analysisResult.estimatedCasualties}\n- SUGGESTED DEPLOYMENT FLEET: ${analysisResult.suggestedFleet}`,
      status: "pending",
      rescueTimeLimit: priority === 1 ? 15 : priority === 2 ? 30 : 60,
      time: Date.now(),
      location: locationName
    };

    const updated = [newRequest, ...activeRequests];
    sessionStorage.setItem('disaster_requests', JSON.stringify(updated));
    setToast({ type: 'success', text: `INCIDENT DISPATCHED: Drone report logged into Resource Queue.` });
  };

  return (
    <div style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '10px 20px', position: 'relative' }}>

      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          background: 'rgba(5, 5, 20, 0.95)',
          border: `1px solid ${toast.type === 'success' ? 'var(--neon-lime)' : 'var(--neon-amber)'}`,
          boxShadow: `0 0 15px ${toast.type === 'success' ? 'rgba(57, 255, 20, 0.4)' : 'rgba(255, 176, 0, 0.4)'}`,
          padding: '15px 25px',
          borderRadius: '4px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div className="pulse" style={{ width: '8px', height: '8px', background: toast.type === 'success' ? 'var(--neon-lime)' : 'var(--neon-amber)' }} />
          <span style={{ fontSize: '13px', fontFamily: 'var(--font-header)', letterSpacing: '1px' }}>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', paddingBottom: '10px' }}>
        <Camera style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} size={24} />
        <h2>Sentinel Multi-Modal Drone HUD</h2>
        {!simActive && (
          <div style={{
            marginLeft: 'auto',
            background: 'rgba(255, 176, 0, 0.1)',
            border: '1px solid var(--neon-amber)',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'var(--neon-amber)',
            fontFamily: 'var(--font-header)',
            letterSpacing: '1px',
            animation: 'pulse 2s infinite'
          }}>
            STANDBY MODE
          </div>
        )}
      </div>

      {/* Main Layout: Left: Drone Video Feed and Feeds Selection, Right: AI Diagnostics Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '30px', marginBottom: '50px' }}>

        {/* Left Column: Feeds and Surveillance Frame */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Active Surveillance Frame */}
          <div className="glass-panel scanner-container" style={{
            height: '480px',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid rgba(0, 243, 255, 0.3)',
            borderRadius: '4px',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>

            {/* Standby glassmorphic watermark overlay */}
            {!simActive && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(5, 5, 20, 0.85)',
                border: '1px solid rgba(255, 176, 0, 0.4)',
                boxShadow: '0 0 20px rgba(255, 176, 0, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '15px 30px',
                borderRadius: '8px',
                zIndex: 30,
                textAlign: 'center',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                animation: 'pulse 2s infinite'
              }}>
                <AlertTriangle style={{ color: 'var(--neon-amber)' }} size={20} />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-header)', letterSpacing: '1.5px', color: '#fff', fontWeight: 'bold' }}>
                  [SYSTEM MONITORING - STANDBY MODE]
                </span>
                <span style={{ fontSize: '9px', color: '#aaa', textTransform: 'uppercase' }}>
                  Drone search fleets grounded • Press "Simulate" to launch operations
                </span>
              </div>
            )}

              {/* Real Scanning Lines */}
              <div className="scanner-line"></div>

              {/* Futuristic Drone HUD overlays */}
              <div style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--neon-cyan)', fontSize: '11px', fontFamily: 'var(--font-header)', letterSpacing: '1px', textShadow: '0 0 5px rgba(0,243,255,0.7)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={12} className="animate-pulse" /> LIVE STREAM LOCK
                </div>
                <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '4px' }}>
                  ALT: 145M | HDG: 182° | SENSOR: FLIR/THERMAL
                </div>
              </div>

              <div style={{ position: 'absolute', top: '15px', right: '15px', color: 'var(--neon-cyan)', fontSize: '11px', fontFamily: 'var(--font-header)', letterSpacing: '1px', textShadow: '0 0 5px rgba(0,243,255,0.7)', zIndex: 10, textAlign: 'right' }}>
                <div>CAM: 01A_UAV</div>
                <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '4px' }}>
                  LAT: 22.5726N | LON: 88.3639E
                </div>
              </div>

              {/* Corner Crosshair Marks */}
              <div style={{ position: 'absolute', width: '20px', height: '20px', borderTop: '2px solid var(--neon-cyan)', borderLeft: '2px solid var(--neon-cyan)', top: '10px', left: '10px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', width: '20px', height: '20px', borderTop: '2px solid var(--neon-cyan)', borderRight: '2px solid var(--neon-cyan)', top: '10px', right: '10px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', width: '20px', height: '20px', borderBottom: '2px solid var(--neon-cyan)', borderLeft: '2px solid var(--neon-cyan)', bottom: '10px', left: '10px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', width: '20px', height: '20px', borderBottom: '2px solid var(--neon-cyan)', borderRight: '2px solid var(--neon-cyan)', bottom: '10px', right: '10px', pointerEvents: 'none' }} />

              {/* Center Reticle */}
              <div style={{
                position: 'absolute',
                width: '40px',
                height: '40px',
                border: '1px dashed rgba(0, 243, 255, 0.6)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ width: '4px', height: '4px', background: 'var(--neon-cyan)', borderRadius: '50%' }} />
              </div>

              {/* Stage-based drone camera HUD overlays */}
              {simActive && simStage === 3 && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0, 243, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '30px',
                  zIndex: 20,
                  fontFamily: 'monospace',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px', height: '300px',
                    border: '1px solid rgba(0, 243, 255, 0.3)',
                    borderRadius: '50%',
                    animation: 'ping 2s infinite'
                  }} />
                  <div style={{ color: 'var(--neon-magenta)', fontSize: '12px', fontWeight: 'bold', textShadow: '0 0 5px var(--neon-magenta)', animation: 'pulse 1s infinite' }}>
                    📡 SCANNING FOR INFRARED THERMAL SIGNATURES...
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(0,0,0,0.6)', padding: '10px', border: '1px solid rgba(0, 243, 255, 0.3)', borderRadius: '4px', maxWidth: '280px', alignSelf: 'flex-start' }}>
                    <div style={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,243,255,0.2)', paddingBottom: '3px', marginBottom: '3px' }}>Locked Target Vectors:</div>
                    <div style={{ color: 'var(--neon-lime)', fontSize: '10px', animation: 'pulse 1.2s infinite' }}>• AMINA BIBI (42F) - DEHYDRATION SHOCK</div>
                    <div style={{ color: 'var(--neon-lime)', fontSize: '10px', animation: 'pulse 1.2s infinite 0.2s' }}>• SUBIR ROY (35M) - LEG FRACTURE TRIAGE</div>
                    <div style={{ color: 'var(--neon-lime)', fontSize: '10px', animation: 'pulse 1.2s infinite 0.4s' }}>• RAJESH KISKU (28M) - INUNDATION FEVER</div>
                  </div>
                  <div style={{ color: 'var(--neon-cyan)', alignSelf: 'flex-end', fontSize: '10px' }}>
                    COORDINATES LOCKED: 22.5726N, 88.3139E
                  </div>
                </div>
              )}

              {simActive && simStage === 4 && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0, 170, 255, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '30px',
                  zIndex: 20,
                  fontFamily: 'monospace',
                  pointerEvents: 'none'
                }}>
                  <div style={{ color: 'var(--neon-cyan)', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 0 5px var(--neon-cyan)' }}>
                    <Ship size={14} className="animate-pulse" /> RESCUE BOAT UNIT-1 EN-ROUTE TO TARGET
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.7)', padding: '12px', border: '1px solid var(--neon-cyan)', borderRadius: '4px', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,243,255,0.2)', paddingBottom: '3px' }}>Boat Navigation Telemetry</div>
                    <div style={{ color: '#aaa', fontSize: '10px' }}>LAT: <span style={{ color: '#fff' }}>{simBoatPos[0].toFixed(5)}N</span></div>
                    <div style={{ color: '#aaa', fontSize: '10px' }}>LNG: <span style={{ color: '#fff' }}>{simBoatPos[1].toFixed(5)}E</span></div>
                    <div style={{ color: '#aaa', fontSize: '10px' }}>PROGRESS: <span style={{ color: '#39ff14' }}>{simBoatPercent}%</span></div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ width: `${simBoatPercent}%`, height: '100%', background: 'var(--neon-cyan)', boxShadow: '0 0 5px var(--neon-cyan)' }}></div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--neon-magenta)', alignSelf: 'flex-end', fontSize: '10px', textTransform: 'uppercase' }}>
                    {simBoatPercent < 50 ? 'approaching survivors coordinates' : simBoatPercent < 70 ? 'extracting survivors...' : 'returning to science city base'}
                  </div>
                </div>
              )}

              {simActive && simStage === 5 && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(57, 255, 20, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '30px',
                  zIndex: 20,
                  fontFamily: 'monospace',
                  pointerEvents: 'none'
                }}>
                  <div style={{ color: 'var(--neon-lime)', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 0 5px var(--neon-lime)' }}>
                    <Radio size={14} className="animate-pulse" /> CAMP DOCK ARRESTED • BLE TELEMETRY PAIRING ACTIVE
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.7)', padding: '12px', border: '1px solid var(--neon-lime)', borderRadius: '4px', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid rgba(57,255,20,0.2)', paddingBottom: '3px' }}>Triage BLE Node Handshake</div>
                    <div style={{ color: '#aaa', fontSize: '9px' }}>Amina Bibi MAC: <span style={{ color: 'var(--neon-lime)' }}>CONNECTED [00:1A:7D:DA:71:11]</span></div>
                    <div style={{ color: '#aaa', fontSize: '9px' }}>Subir Roy MAC: <span style={{ color: 'var(--neon-lime)' }}>CONNECTED [00:1A:7D:DA:71:12]</span></div>
                    <div style={{ color: '#aaa', fontSize: '9px' }}>Rajesh Kisku MAC: <span style={{ color: 'var(--neon-lime)' }}>CONNECTED [00:1A:7D:DA:71:13]</span></div>
                  </div>
                  <div style={{ color: 'var(--neon-cyan)', alignSelf: 'flex-end', fontSize: '10px' }}>
                    CITIZEN TELEMETRY COMPILING...
                  </div>
                </div>
              )}

              {/* Render simulated flood looping MP4 video or custom upload */}
              {customImage ? (
                <img src={customImage} alt="Custom surveillance sensor upload" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
              ) : selectedFeed ? (
                <video
                  key={selectedFeed.id}
                  src={selectedFeed.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                />
              ) : (
                <div style={{ color: '#666', fontFamily: 'var(--font-header)', fontSize: '12px' }}>SENSOR STREAM OFFLINE</div>
              )}
            </div>

            {/* Selector Grid: Mock Feeds & Custom Uploader */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              {MOCK_FEEDS.map(f => {
                const isSelected = selectedFeed?.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFeed(f);
                      setCustomImage(null);
                      setAnalysisResult(null);
                    }}
                    style={{
                      background: 'rgba(5, 5, 20, 0.7)',
                      border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'rgba(0, 243, 255, 0.15)'}`,
                      boxShadow: isSelected ? 'var(--border-glow)' : 'none',
                      padding: '12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    <Eye size={16} style={{ color: isSelected ? 'var(--neon-cyan)' : '#888' }} />
                    <span style={{ fontSize: '10px', color: isSelected ? '#fff' : '#aaa', fontFamily: 'var(--font-header)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {f.name.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase' }}>{f.location}</span>
                  </button>
                );
              })}

              {/* Custom File Uploader Selector Card */}
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 5
                  }}
                />
                <div style={{
                  background: 'rgba(5, 5, 20, 0.7)',
                  border: `1px dashed ${customImage ? 'var(--neon-magenta)' : 'rgba(255, 0, 255, 0.3)'}`,
                  boxShadow: customImage ? '0 0 10px rgba(255, 0, 255, 0.2)' : 'none',
                  padding: '12px',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  height: '100%',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  <Camera size={16} style={{ color: customImage ? 'var(--neon-magenta)' : '#888' }} />
                  <span style={{ fontSize: '10px', color: customImage ? '#fff' : '#aaa', fontFamily: 'var(--font-header)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {customImage ? 'Sensor Active' : 'Custom Upload'}
                  </span>
                  <span style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase' }}>JPEG / PNG</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: AI Structural Diagnostic HUD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div className="glass-panel" style={{
              padding: '25px',
              border: '1px solid rgba(0, 243, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '560px'
            }}>

              {/* Sub-Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-cyan)', marginBottom: '20px', borderBottom: '1px solid rgba(0,243,255,0.1)', paddingBottom: '10px' }}>
                <Cpu style={{ filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} size={20} />
                <h3 style={{ fontSize: '14px', color: 'var(--neon-cyan)', textShadow: '0 0 8px rgba(0, 243, 255, 0.4)' }}>Sentinel Diagnostics</h3>
              </div>

              {/* Execution Center */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                {!analysisResult && !analyzing ? (
                  <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                    <Cpu size={48} className="animate-pulse" style={{ color: 'rgba(0, 243, 255, 0.2)', marginBottom: '15px' }} />
                    <h4 style={{ fontSize: '12px', color: '#666', fontFamily: 'var(--font-header)', letterSpacing: '1px', marginBottom: '8px' }}>SENSOR AUDIT REQUIRED</h4>
                    <p style={{ fontSize: '11px', color: '#888', lineHeight: '1.5', maxWidth: '280px', margin: '0 auto 20px' }}>
                      Acknowledge video feeds on the left and trigger Multi-Modal AI assessment to map structural failures.
                    </p>

                    <button
                      onClick={handleVisionAnalysis}
                      style={{
                        padding: '12px 25px',
                        background: 'rgba(0, 243, 255, 0.1)',
                        border: '1px solid var(--neon-cyan)',
                        color: 'var(--neon-cyan)',
                        fontFamily: 'var(--font-header)',
                        fontSize: '11px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        boxShadow: '0 0 10px rgba(0, 243, 255, 0.15)',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(0, 243, 255, 0.2)';
                        e.target.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(0, 243, 255, 0.1)';
                        e.target.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.15)';
                      }}
                    >
                      Scan Sensor Stream
                    </button>
                  </div>
                ) : analyzing ? (
                  <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                    <RefreshCw size={44} className="animate-spin" style={{ color: 'var(--neon-cyan)', marginBottom: '15px' }} />
                    <h4 style={{ fontSize: '12px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-header)', letterSpacing: '1px', marginBottom: '8px' }}>NEURAL DECODER PROCESSING</h4>
                    <p style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>
                      Reading base64 pixel matrix...
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'slideIn 0.3s ease-out' }}>

                    {/* Stats Telemetry */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

                      {/* Damage Severity Grid */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', border: '1px solid rgba(255, 0, 255, 0.2)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--neon-magenta)', textTransform: 'uppercase', marginBottom: '4px' }}>Damage Severity</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-header)', color: analysisResult.damageSeverity > 75 ? 'var(--neon-red)' : 'var(--neon-amber)' }}>
                          {analysisResult.damageSeverity}%
                        </div>

                        <div style={{ height: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
                          <div style={{
                            width: `${analysisResult.damageSeverity}%`,
                            height: '100%',
                            background: analysisResult.damageSeverity > 75 ? 'var(--neon-red)' : 'var(--neon-amber)',
                            boxShadow: `0 0 6px ${analysisResult.damageSeverity > 75 ? 'var(--neon-red)' : 'var(--neon-amber)'}`
                          }}></div>
                        </div>
                      </div>

                      {/* Casualties Grid */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', border: '1px solid rgba(0, 243, 255, 0.2)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>Est. Trapped</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-header)', color: 'var(--neon-cyan)' }}>
                          {analysisResult.estimatedCasualties} <span style={{ fontSize: '11px', color: '#666' }}>citizens</span>
                        </div>
                        <div style={{ fontSize: '8px', color: '#888', marginTop: '6px', textTransform: 'uppercase' }}>Triage prioritised</div>
                      </div>

                    </div>

                    {/* Core Technical Hazard */}
                    <div style={{ padding: '15px', background: 'rgba(255, 51, 51, 0.04)', borderLeft: '3px solid var(--neon-red)', borderRadius: '0 4px 4px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-red)', fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-header)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                        <ShieldAlert size={12} /> PRIMARY STRUCTURAL HAZARD
                      </div>
                      <p style={{ fontSize: '11px', lineHeight: '1.4', color: '#e0e0ff' }}>
                        {analysisResult.primaryHazard}
                      </p>
                    </div>

                    {/* Deployment fleet */}
                    <div style={{ padding: '15px', background: 'rgba(57, 255, 20, 0.04)', borderLeft: '3px solid var(--neon-lime)', borderRadius: '0 4px 4px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-lime)', fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-header)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                        <CheckCircle size={12} /> RECOMMENDED DEPLOYMENT FLEET
                      </div>
                      <p style={{ fontSize: '11px', lineHeight: '1.4', color: '#e0e0ff' }}>
                        {analysisResult.suggestedFleet}
                      </p>
                    </div>

                    {/* Action Buttons: Redo Analysis and Ingest Queue */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>

                      <button
                        onClick={handleQueueIngestion}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          padding: '12px',
                          background: 'linear-gradient(90deg, rgba(0, 243, 255, 0.2) 0%, rgba(255, 0, 255, 0.2) 100%)',
                          border: '1px solid var(--neon-cyan)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-header)',
                          fontSize: '11px',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.5)';
                          e.target.style.border = '1px solid #fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.2)';
                          e.target.style.border = '1px solid var(--neon-cyan)';
                        }}
                      >
                        <Send size={12} /> Log Incident to Queue
                      </button>

                      <button
                        onClick={handleVisionAnalysis}
                        style={{
                          padding: '10px',
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#888',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-header)',
                          fontSize: '9px',
                          letterSpacing: '0.5px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#fff';
                          e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#888';
                          e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                        }}
                      >
                        Rescan Sensor Stream
                      </button>

                    </div>

                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>
  );
}
