import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { Cross, Flame, ShieldAlert, Map, LayoutGrid, Ship, Tent, Activity, Brain, ArrowRight } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';

const calculateDistance = (pos1, pos2) => {
  const R = 6371; // km
  const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
  const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Fix for default Leaflet icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icon creation function
const createCustomIcon = (IconComponent, color) => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{
      backgroundColor: '#050510',
      border: `2px solid ${color}`,
      boxShadow: `0 0 10px ${color}, inset 0 0 5px ${color}`,
      borderRadius: '50%',
      padding: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color
    }}>
      <IconComponent size={20} />
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const icons = {
  hospital: createCustomIcon(Cross, '#0066ff'),
  fire: createCustomIcon(Flame, '#ff3333'),
  police: createCustomIcon(ShieldAlert, '#39ff14'),
  boat: createCustomIcon(Ship, '#00aaff'),
  shelter: createCustomIcon(Tent, '#ffaa00'),
};

const MOCK_RESOURCES = [
  // Relocated from NW (Bally) to North-East (Dum Dum)
  { id: 1, type: 'police', label: 'Dum Dum Police Station', pos: [22.6450, 88.4250] },
  { id: 2, type: 'fire', label: 'Airport Fire Station', pos: [22.6500, 88.4300] },
  { id: 3, type: 'hospital', label: 'Dum Dum Cantonment Hospital', pos: [22.6400, 88.4200] },

  // Relocated from W (Howrah) to Far East (New Town)
  { id: 4, type: 'police', label: 'New Town Police Station', pos: [22.5850, 88.4600] },
  { id: 5, type: 'fire', label: 'New Town Fire Brigade', pos: [22.5900, 88.4650] },
  { id: 6, type: 'hospital', label: 'New Town General Hospital', pos: [22.5800, 88.4700] },

  // Relocated from SW (Sankrail) to Far South East (Sonarpur)
  { id: 7, type: 'police', label: 'Sonarpur Police Station', pos: [22.4450, 88.4250] },
  { id: 8, type: 'fire', label: 'Sonarpur Fire Station', pos: [22.4500, 88.4300] },
  { id: 9, type: 'hospital', label: 'Sonarpur Medical Center', pos: [22.4400, 88.4300] },

  // Relocated from N (North Kolkata) to Salt Lake North
  { id: 10, type: 'police', label: 'Salt Lake North PS', pos: [22.6050, 88.4200] },
  { id: 11, type: 'fire', label: 'Salt Lake Sector I Fire Station', pos: [22.6000, 88.4150] },
  { id: 12, type: 'hospital', label: 'Salt Lake Sector V Hospital', pos: [22.5700, 88.4350] },

  // Relocated from C (Central Kolkata) to Bypass Area
  { id: 13, type: 'police', label: 'Kolkata East Police HQ', pos: [22.5650, 88.4050] },
  { id: 14, type: 'fire', label: 'Bypass Central Fire Station', pos: [22.5600, 88.4000] },
  { id: 15, type: 'hospital', label: 'EM Bypass Specialty', pos: [22.5546, 88.4029] },

  // Relocated from S (Alipore/South) to Jadavpur/Gariahat
  { id: 16, type: 'police', label: 'Jadavpur Police Station', pos: [22.4950, 88.3750] },
  { id: 17, type: 'fire', label: 'Gariahat Fire Station', pos: [22.5150, 88.3700] },
  { id: 18, type: 'hospital', label: 'Jadavpur Relief Hospital', pos: [22.4900, 88.3750] },

  // E: Salt Lake (Already Safe)
  { id: 19, type: 'police', label: 'Bidhannagar South PS', pos: [22.5800, 88.4200] },
  { id: 20, type: 'fire', label: 'Bidhannagar Fire Station', pos: [22.5950, 88.4150] },
  { id: 21, type: 'hospital', label: 'AMRI Salt Lake', pos: [22.5900, 88.4100] },

  // SE: Bypass / Ruby (Already Safe)
  { id: 22, type: 'police', label: 'Anandapur Police Station', pos: [22.5100, 88.4150] },
  { id: 23, type: 'fire', label: 'Kasba Fire Station', pos: [22.5120, 88.3900] },
  { id: 24, type: 'hospital', label: 'Ruby General Hospital', pos: [22.5150, 88.4050] },

  // Rescue Boats (parked beautifully next to safe shelters/bases, moving to disaster sites on dispatch)
  { id: 25, type: 'boat', label: 'Rescue Boat Unit 1', pos: [22.5415, 88.3945] }, // Science City Mega Shelter (Offset Northwest)
  { id: 26, type: 'boat', label: 'Rescue Boat Unit 2', pos: [22.5695, 88.4075] }, // Salt Lake Stadium Relief Camp (Offset Northwest)
  { id: 27, type: 'boat', label: 'Rescue Boat Unit 3', pos: [22.6115, 88.4485] }, // Rajarhat Evac Center (Offset Northwest)
  { id: 28, type: 'boat', label: 'Rescue Boat Unit 4', pos: [22.5865, 88.4535] }, // New Town Action Area I Shelter (Offset Northwest)
  { id: 29, type: 'boat', label: 'Rescue Boat Unit 5', pos: [22.4995, 88.3695] }, // Jadavpur University Relief Camp (Offset Northwest)
  { id: 30, type: 'boat', label: 'NDRF Marine Squad', pos: [22.5385, 88.3975] }, // Science City Mega Shelter (Offset Southeast)

  // Shelters (safe zones, moved completely clear of river)
  { id: 31, type: 'shelter', label: 'Salt Lake Stadium Relief Camp', pos: [22.5680, 88.4090] },
  { id: 32, type: 'shelter', label: 'Science City Mega Shelter', pos: [22.5400, 88.3960] },
  { id: 33, type: 'shelter', label: 'Rajarhat Evac Center', pos: [22.6100, 88.4500] },
  { id: 34, type: 'shelter', label: 'New Town Action Area I Shelter', pos: [22.5850, 88.4550] },
  { id: 35, type: 'shelter', label: 'Jadavpur University Relief Camp', pos: [22.4980, 88.3710] },
];

const SIM_BOAT_ROUTES = {
  25: { base: [22.5415, 88.3945], target: [22.5726, 88.3139] }, // Boat 1 -> Howrah
  26: { base: [22.5695, 88.4075], target: [22.5626, 88.3539] }, // Boat 2 -> Central
  27: { base: [22.6115, 88.4485], target: [22.6226, 88.3339] }, // Boat 3 -> Bally
  28: { base: [22.5865, 88.4535], target: [22.6026, 88.3639] }, // Boat 4 -> North Ave
  29: { base: [22.4995, 88.3695], target: [22.5226, 88.3339] }, // Boat 5 -> South City
  30: { base: [22.5385, 88.3975], target: [22.5326, 88.2839] }  // NDRF Squad -> Sankrail
};

const INITIAL_ZONES = [
  // West Bank (NW, W, SW) - completely flooded, only boats
  { id: 'nw', name: 'Bally', x: 5, y: 5, w: 25, h: 25, pos: [22.6226, 88.3339], radius: 1400, severity: 0.85, forecast: 0.45, hospitals: 0.05, police: 0.05, fire: 0.05, boats: 0.80, shelters: 0.05 },
  { id: 'w', name: 'Howrah', x: 5, y: 35, w: 25, h: 25, pos: [22.5726, 88.3139], radius: 1600, severity: 0.95, forecast: 0.58, hospitals: 0.05, police: 0.05, fire: 0.05, boats: 0.95, shelters: 0.05 },
  { id: 'sw', name: 'Sankrail', x: 5, y: 65, w: 25, h: 25, pos: [22.5326, 88.2839], radius: 1800, severity: 0.90, forecast: 0.32, hospitals: 0.05, police: 0.05, fire: 0.05, boats: 0.70, shelters: 0.05 },

  // East Bank (N, C, S) - partially flooded, mostly boats and some edge cases
  { id: 'n', name: 'North Avenue', x: 35, y: 5, w: 25, h: 25, pos: [22.6026, 88.3639], radius: 1500, severity: 0.80, forecast: 0.25, hospitals: 0.10, police: 0.10, fire: 0.10, boats: 0.60, shelters: 0.10 },
  { id: 'c', name: 'Central Station', x: 35, y: 35, w: 25, h: 25, pos: [22.5626, 88.3539], radius: 1200, severity: 0.70, forecast: 0.35, hospitals: 0.15, police: 0.15, fire: 0.15, boats: 0.80, shelters: 0.20 },
  { id: 's', name: 'South City', x: 35, y: 65, w: 25, h: 25, pos: [22.5226, 88.3339], radius: 1500, severity: 0.75, forecast: 0.22, hospitals: 0.20, police: 0.20, fire: 0.20, boats: 0.05, shelters: 0.40 },

  // Further East (E, SE) - Safe zones, huge infrastructure, high shelters
  { id: 'e', name: 'Salt Lake', x: 65, y: 5, w: 25, h: 40, pos: [22.5850, 88.4200], radius: 2200, severity: 0.0, forecast: 0.10, hospitals: 0.95, police: 0.90, fire: 0.90, boats: 0.05, shelters: 0.90 },
  { id: 'se', name: 'Sector 4 Area', x: 65, y: 50, w: 25, h: 40, pos: [22.5126, 88.4039], radius: 1800, severity: 0.0, forecast: 0.05, hospitals: 0.95, police: 0.95, fire: 0.85, boats: 0.05, shelters: 0.85 },

  // New Safe Zones (High Resource Availability)
  { id: 'dumdum', name: 'Dum Dum', x: 95, y: 5, w: 25, h: 15, pos: [22.6450, 88.4250], radius: 1500, severity: 0.0, forecast: 0.02, hospitals: 0.90, police: 0.90, fire: 0.90, boats: 0.05, shelters: 0.80 },
  { id: 'makaltala', name: 'Makaltala', x: 95, y: 25, w: 25, h: 15, pos: [22.6050, 88.4200], radius: 1500, severity: 0.0, forecast: 0.15, hospitals: 0.80, police: 0.80, fire: 0.80, boats: 0.05, shelters: 0.70 },
  { id: 'newtown', name: 'New Town', x: 95, y: 45, w: 25, h: 15, pos: [22.5850, 88.4600], radius: 1700, severity: 0.0, forecast: 0.01, hospitals: 0.90, police: 0.90, fire: 0.85, boats: 0.05, shelters: 0.95 },
  { id: 'kasba', name: 'Kasba', x: 95, y: 65, w: 25, h: 15, pos: [22.5120, 88.3900], radius: 1500, severity: 0.0, forecast: 0.08, hospitals: 0.85, police: 0.90, fire: 0.90, boats: 0.05, shelters: 0.80 },
  { id: 'sonarpur', name: 'Rajpur Sonarpur', x: 95, y: 85, w: 25, h: 15, pos: [22.4400, 88.4300], radius: 1800, severity: 0.0, forecast: 0.03, hospitals: 0.95, police: 0.85, fire: 0.90, boats: 0.05, shelters: 0.90 },
];

export default function MapTab() {
  const [activeLayer, setActiveLayer] = useState('severity');
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' or 'cartogram'
  const [requests, setRequests] = useState([]);
  const [areaZones, setAreaZones] = useState(() => {
    // Start inactive initially
    return INITIAL_ZONES.map(z => ({ ...z, severity: 0.0 }));
  });
  const [isForecasting, setIsForecasting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [matchedResource, setMatchedResource] = useState(null);
  const [shelterInventory, setShelterInventory] = useState(null);

  // Simulation parameters
  const [simActive, setSimActive] = useState(false);
  const [simStage, setSimStage] = useState(0);
  const [simBoatPos, setSimBoatPos] = useState([22.5400, 88.3960]);
  const [simBoatPositions, setSimBoatPositions] = useState({});

  // Dynamic manual dispatch animation state
  const [activeDispatchAnimations, setActiveDispatchAnimations] = useState({});

  useEffect(() => {
    if (Object.keys(activeDispatchAnimations).length === 0) return;

    const animInterval = setInterval(() => {
      setActiveDispatchAnimations(prev => {
        const next = { ...prev };
        let updated = false;

        Object.keys(next).forEach(id => {
          const anim = next[id];
          const nextPct = anim.pct + 4; // smooth speed (4% per 50ms tick = ~1.25s transit time)

          if (anim.phase === 'to_target') {
            if (nextPct >= 100) {
              if (anim.resource.type === 'boat' || anim.resource.type === 'hospital') {
                next[id] = {
                  ...anim,
                  pct: 0,
                  phase: 'to_shelter',
                  currentPos: anim.targetPos
                };
              } else {
                delete next[id];
              }
              updated = true;
            } else {
              const currentCoords = [
                anim.startPos[0] + (anim.targetPos[0] - anim.startPos[0]) * (nextPct / 100),
                anim.startPos[1] + (anim.targetPos[1] - anim.startPos[1]) * (nextPct / 100)
              ];
              next[id] = {
                ...anim,
                pct: nextPct,
                currentPos: currentCoords
              };
              updated = true;
            }
          } else if (anim.phase === 'to_shelter') {
            if (nextPct >= 100) {
              delete next[id];
              updated = true;
            } else {
              const currentCoords = [
                anim.targetPos[0] + (anim.shelterPos[0] - anim.targetPos[0]) * (nextPct / 100),
                anim.targetPos[1] + (anim.shelterPos[1] - anim.targetPos[1]) * (nextPct / 100)
              ];
              next[id] = {
                ...anim,
                pct: nextPct,
                currentPos: currentCoords
              };
              updated = true;
            }
          }
        });

        return updated ? next : prev;
      });
    }, 50);

    return () => clearInterval(animInterval);
  }, [activeDispatchAnimations]);

  // Unified high-frequency polling effect for real-time visual synchrony
  useEffect(() => {
    const syncSimulation = () => {
      const active = sessionStorage.getItem('sim_active') === 'true';
      const stage = parseInt(sessionStorage.getItem('sim_active_stage') || '0');
      
      setSimActive(active);
      setSimStage(stage);

      if (active) {
        // 1. Sync live rescue boat lat/lng gliders
        try {
          const boatPosSaved = sessionStorage.getItem('sim_boat_pos');
          if (boatPosSaved) {
            setSimBoatPos(JSON.parse(boatPosSaved));
          }
          const boatPositionsSaved = sessionStorage.getItem('sim_boat_positions');
          if (boatPositionsSaved) {
            setSimBoatPositions(JSON.parse(boatPositionsSaved));
          }
        } catch (e) {
          console.error("Failed to parse sim_boat_pos", e);
        }

        // 2. Sync sequential flooding severity zones
        try {
          const zonesSaved = sessionStorage.getItem('map_zones');
          if (zonesSaved) {
            const parsed = JSON.parse(zonesSaved);
            const updated = INITIAL_ZONES.map(z => {
              const match = parsed.find(pz => pz.id === z.id);
              // Maintain standard properties but dynamically assign active severity
              return match ? { ...z, severity: match.severity } : z;
            });
            setAreaZones(updated);
          }
        } catch (e) {
          console.error("Failed to parse map_zones", e);
        }
      } else {
        // Full System Standby - zero flood impact
        const silenced = INITIAL_ZONES.map(z => ({ ...z, severity: 0.0 }));
        setAreaZones(silenced);
        setSimBoatPos([22.5400, 88.3960]);
        setSimBoatPositions({});
      }

      // 3. Sync shelter inventories drawdowns
      const invSaved = sessionStorage.getItem('shelter_inventory');
      if (invSaved) {
        setShelterInventory(JSON.parse(invSaved));
      }

      // 4. Sync dynamic triage requests
      const reqsSaved = sessionStorage.getItem('disaster_requests');
      if (reqsSaved) {
        const parsedReqs = JSON.parse(reqsSaved);
        setRequests(parsedReqs);
      } else {
        setRequests([]);
      }
    };

    syncSimulation();
    const interval = setInterval(syncSimulation, 200); // 5hz high-performance loop
    return () => clearInterval(interval);
  }, []);

  const generateAiForecast = async (currentRequests) => {
    if (currentRequests.length === 0) return;

    setIsForecasting(true);
    const zoneSummary = INITIAL_ZONES.map(z => z.name).join(', ');
    const requestSummary = currentRequests.map(r => `${r.location}: ${r.disease}`).join(' | ');

    const prompt = `
      Analyze these disaster requests: [${requestSummary}]
      Across these zones: [${zoneSummary}]
      Predict the "Crisis Forecast" (0.0 to 1.0) for each zone.
      Return ONLY a JSON object with zone IDs (nw, w, sw, n, c, s, e, se, dumdum, makaltala, newtown, kasba, sonarpur) as keys and forecast numbers as values.
    `;

    const providers = [
      { name: 'Google', key: import.meta.env.VITE_GEMINI_API_KEY, model: 'gemini-2.5-flash' },
      { name: 'OpenRouter', key: import.meta.env.VITE_OPENROUTER_API_KEY, model: 'openrouter/free' },
      { name: 'Groq', key: import.meta.env.VITE_GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
      { name: 'DeepSeek', key: import.meta.env.VITE_DEEPSEEK_API_KEY, model: 'deepseek-chat' }
    ];

    for (const p of providers) {
      if (!p.key) continue;
      try {
        let result;
        if (p.name === 'Google') {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${p.key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const data = await res.json();
          result = data.candidates[0].content.parts[0].text;
        } else {
          let endpoint;
          if (p.name === 'OpenAI') endpoint = 'https://api.openai.com/v1/chat/completions';
          else if (p.name === 'Groq') endpoint = 'https://api.groq.com/openai/v1/chat/completions';
          else if (p.name === 'DeepSeek') endpoint = 'https://api.deepseek.com/chat/completions';
          else if (p.name === 'OpenRouter') endpoint = 'https://openrouter.ai/api/v1/chat/completions';

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${p.key}`,
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'Nexus Disaster Dashboard'
            },
            body: JSON.stringify({ model: p.model, messages: [{ role: 'user', content: prompt }] })
          });
          const data = await res.json();
          result = data.choices[0].message.content;
        }

        const cleanJson = result.replace(/```json|```/g, '').trim();
        const forecastData = JSON.parse(cleanJson);

        setAreaZones(prev => prev.map(zone => ({
          ...zone,
          forecast: forecastData[zone.id] !== undefined ? forecastData[zone.id] : zone.forecast
        })));
        setIsForecasting(false);
        return; // Success!
      } catch (err) {
        console.warn(`${p.name} forecast link failed. Trying backup...`);
      }
    }
    setIsForecasting(false);
  };

  const findBestResource = (request) => {
    const zone = areaZones.find(z => z.name === request.location);
    if (!zone) return;

    let targetType = 'hospital';
    if (request.resource.includes('Boat')) targetType = 'boat';
    else if (request.resource.includes('Shelter')) targetType = 'shelter';
    else if (request.resource.includes('Police')) targetType = 'police';

    const candidates = MOCK_RESOURCES.filter(r => r.type === targetType);
    let best = null;
    let minDist = Infinity;

    candidates.forEach(res => {
      const dist = calculateDistance(zone.pos, res.pos);
      if (dist < minDist) {
        minDist = dist;
        best = res;
      }
    });

    setMatchedResource(best);
  };

  const LAYER_OPTIONS = [
    { id: 'severity', label: 'Flood Severity', icon: Activity, color: '#ff3333', rgb: '255,51,51' },
    { id: 'hospitals', label: 'Hospitals', icon: Cross, color: '#0066ff', rgb: '0,102,255' },
    { id: 'police', label: 'Police Stations', icon: ShieldAlert, color: '#39ff14', rgb: '57,255,20' },
    { id: 'fire', label: 'Fire Stations', icon: Flame, color: '#ff3333', rgb: '255,51,51' },
    { id: 'boats', label: 'Rescue Boats', icon: Ship, color: '#00aaff', rgb: '0,170,255' },
    { id: 'shelters', label: 'Shelters', icon: Tent, color: '#ffaa00', rgb: '255,170,0' },
    { id: 'forecast', label: 'Neural Forecast', icon: Brain, color: '#ff00ff', rgb: '255,0,255' },
  ];

  const activeLayerOpt = LAYER_OPTIONS.find(l => l.id === activeLayer);
  const activeColor = activeLayerOpt ? activeLayerOpt.color : '#0066ff';
  const activeRgb = activeLayerOpt ? activeLayerOpt.rgb : '0,102,255';

  const getMetricColor = (metric, layerId) => {
    if (layerId === 'severity') {
      if (metric === 0) return 'transparent';
      return metric > 0.7 ? '#ff0000' : metric > 0.4 ? '#ff6600' : '#ffcc00';
    } else if (layerId === 'forecast') {
      if (metric === 0) return 'transparent';
      return metric > 0.8 ? '#ff00ff' : metric > 0.4 ? '#aa00ff' : '#5500ff';
    } else {
      // Match the color to the specific resource layer to make it variable
      const layerOpt = LAYER_OPTIONS.find(l => l.id === layerId);
      return layerOpt ? layerOpt.color : '#0066ff';
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 0 20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setViewMode('heatmap')}
            style={{
              background: viewMode === 'heatmap' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: viewMode === 'heatmap' ? '#fff' : 'rgba(255,255,255,0.6)',
              border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
              fontFamily: 'var(--font-header)', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <Map size={18} /> Geographic Map
          </button>
          <button
            onClick={() => setViewMode('cartogram')}
            style={{
              background: viewMode === 'cartogram' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: viewMode === 'cartogram' ? '#fff' : 'rgba(255,255,255,0.6)',
              border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
              fontFamily: 'var(--font-header)', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <LayoutGrid size={18} /> Area Cartogram
          </button>
        </div>

        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }}></div>

        {/* Data Layer Toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
          {LAYER_OPTIONS.map(layer => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;
            const isForecast = layer.id === 'forecast';
            return (
              <button
                key={layer.id}
                onClick={() => {
                  setActiveLayer(layer.id);
                  if (isForecast) generateAiForecast(requests);
                }}
                style={{
                  background: isActive ? `rgba(${activeRgb}, 0.2)` : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${isActive ? activeColor : 'rgba(255,255,255,0.1)'}`,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                  fontFamily: 'var(--font-header)', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: isActive ? `0 0 10px rgba(${activeRgb}, 0.5)` : 'none',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
              >
                <Icon size={14} color={layer.color} className={isForecast && isForecasting ? 'animate-pulse' : ''} />
                {layer.label}
                {isForecast && isForecasting && (
                  <span style={{ fontSize: '8px', position: 'absolute', top: '-10px', right: '0', color: 'var(--neon-magenta)' }}>NEURAL LINK...</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
        {viewMode === 'heatmap' ? (
          <div style={{ flex: 3, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: `1px solid rgba(${activeRgb}, 0.3)`, boxShadow: `0 0 15px rgba(${activeRgb}, 0.1)` }}>
            <MapContainer center={[22.5626, 88.3639]} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">Carto</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {simActive && simStage === 4 && Object.keys(SIM_BOAT_ROUTES).map(id => {
                const route = SIM_BOAT_ROUTES[id];
                return (
                  <Polyline
                    key={`sim-route-${id}`}
                    positions={[route.base, route.target]}
                    pathOptions={{
                      color: id === '30' ? '#5500ff' : '#00aaff',
                      weight: 3,
                      dashArray: '5, 5',
                      className: 'rescue-path animate-pulse'
                    }}
                  />
                );
              })}

              {/* Dynamic manual dispatches glowing route trails */}
              {Object.keys(activeDispatchAnimations).map(id => {
                const anim = activeDispatchAnimations[id];
                const coords = anim.phase === 'to_target' 
                  ? [anim.startPos, anim.targetPos] 
                  : [anim.targetPos, anim.shelterPos];
                
                return (
                  <Polyline
                    key={`anim-line-${id}`}
                    positions={coords}
                    pathOptions={{
                      color: anim.resource.type === 'boat' ? '#00aaff' : anim.resource.type === 'fire' ? '#ff3333' : '#39ff14',
                      weight: 4,
                      dashArray: '8, 8',
                      className: 'dispatch-route-path animate-pulse'
                    }}
                  />
                );
              })}

              {/* Dynamic manual dispatches active target rescue pulses */}
              {Object.keys(activeDispatchAnimations).map(id => {
                const anim = activeDispatchAnimations[id];
                if (anim.phase === 'to_target') {
                  return (
                    <Circle
                      key={`anim-pulse-${id}`}
                      center={anim.targetPos}
                      radius={400}
                      pathOptions={{
                        color: '#ffaa00',
                        fillColor: '#ffaa00',
                        fillOpacity: 0.15,
                        weight: 1.5,
                        dashArray: '4, 4'
                      }}
                    />
                  );
                }
                return null;
              })}

              {MOCK_RESOURCES.map(res => {
                const isShelter = res.type === 'shelter';
                const inventory = isShelter && shelterInventory ? shelterInventory[res.label] : null;
                
                // Override resource position if it is currently undergoing dispatch animation
                 const anim = activeDispatchAnimations[res.id];
                 const simPos = simActive && simStage >= 4 && simBoatPositions && simBoatPositions[res.id];
                 const position = anim ? anim.currentPos : (simPos ? simPos : res.pos);

                return (
                  <Marker key={res.id} position={position} icon={icons[res.type]}>
                    <Popup>
                      <div style={{ color: '#050510', fontFamily: 'var(--font-body)', minWidth: '180px' }}>
                        <strong style={{ display: 'block', marginBottom: '5px', fontSize: '13px', borderBottom: '1px solid #ddd', paddingBottom: '3px' }}>{res.label}</strong>
                        {isShelter && inventory ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>💧 Potable Water:</span>
                              <strong>{Math.round(inventory.water)} / {inventory.maxWater}</strong>
                            </div>
                            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>🍞 Medical Rations:</span>
                              <strong>{Math.round(inventory.rations)} / {inventory.maxRations}</strong>
                            </div>
                            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>⛺ Shelter Kits:</span>
                              <strong>{Math.round(inventory.shelter)} / {inventory.maxShelter}</strong>
                            </div>
                            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>🩹 First Aid Kits:</span>
                              <strong>{Math.round(inventory.medical)} / {inventory.maxMedical}</strong>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>Type: {res.type}</span>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {selectedRequest && matchedResource && (
                <>
                  <Polyline
                    positions={[
                      (() => {
                        const z = areaZones.find(z => z.name === selectedRequest.location);
                        return z ? z.pos : [22.5626, 88.3639];
                      })(),
                      matchedResource.pos
                    ]}
                    pathOptions={{
                      color: '#00f3ff',
                      weight: 3,
                      dashArray: '10, 10',
                      className: 'ai-path'
                    }}
                  />
                  <Marker
                    position={(() => {
                      const z = areaZones.find(z => z.name === selectedRequest.location);
                      return z ? z.pos : [22.5626, 88.3639];
                    })()}
                    icon={L.divIcon({
                      html: `<div style="width: 20px; height: 20px; background: #ff00ff; border-radius: 50%; box-shadow: 0 0 10px #ff00ff; border: 2px solid #fff;"></div>`,
                      className: 'ai-request-marker',
                      iconSize: [20, 20]
                    })}
                  />
                </>
              )}

              {areaZones.map((zone) => {
                const metric = zone[activeLayer];
                const color = getMetricColor(metric, activeLayer);

                return (
                  <Circle
                    key={zone.id}
                    center={zone.pos}
                    radius={zone.radius}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: activeLayer === 'severity' ? metric * 0.8 : 0.2 + (metric * 0.6),
                      color: color,
                      weight: metric > 0.6 ? 2 : (metric === 0 ? 0 : 1),
                      dashArray: activeLayer !== 'severity' && metric < 0.3 ? '4' : 'none'
                    }}
                  />
                )
              })}
            </MapContainer>
          </div>
        ) : (
          <div style={{ flex: 1, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: `1px solid rgba(${activeRgb}, 0.3)`, boxShadow: `0 0 15px rgba(${activeRgb}, 0.1)`, background: '#050510', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 125 105" style={{ width: '100%', height: '100%', maxHeight: '600px', display: 'block', margin: '0 auto' }}>
              <rect x="0" y="0" width="125" height="105" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />

              {areaZones.map(zone => {
                const metric = zone[activeLayer];
                const scale = 0.3 + (metric * 0.66);
                const color = getMetricColor(metric, activeLayer);

                return (
                  <g key={zone.id} style={{
                    transformOrigin: `${zone.x + zone.w / 2}px ${zone.y + zone.h / 2}px`,
                    transform: `scale(${scale})`,
                    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: activeLayer === 'severity' && metric === 0 ? 0 : 1,
                    pointerEvents: activeLayer === 'severity' && metric === 0 ? 'none' : 'auto'
                  }}>
                    <rect
                      x={zone.x} y={zone.y}
                      width={zone.w} height={zone.h}
                      fill={color}
                      rx="2"
                      stroke={activeLayer === 'severity' && metric === 0 ? "none" : "#fff"}
                      strokeWidth="0.4"
                      style={{ filter: `drop-shadow(0 0 6px ${color})`, opacity: 0.85, transition: 'all 0.5s' }}
                    />
                    <text
                      x={zone.x + zone.w / 2}
                      y={zone.y + zone.h / 2}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={scale > 0.6 ? "3" : "2.5"}
                      fontWeight="bold"
                      fontFamily="var(--font-header)"
                      style={{ pointerEvents: 'none', textShadow: '0px 1px 3px rgba(0,0,0,0.8)' }}
                    >
                      {zone.name}
                    </text>
                    <text
                      x={zone.x + zone.w / 2}
                      y={zone.y + zone.h / 2 + 4}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.9)"
                      fontSize="2"
                      fontFamily="var(--font-body)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {(metric * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="glass-panel" style={{ width: '320px', display: 'flex', flexDirection: 'column', padding: '20px', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00f3ff', marginBottom: '5px' }}>
              <Brain size={20} className={isForecasting ? 'animate-pulse' : ''} />
              <h3 style={{ fontSize: '16px', margin: 0 }}>Neural Dispatch</h3>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Triage Queue</p>

              {requests.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#555', border: '1px dashed #333', borderRadius: '4px', fontSize: '14px' }}>
                  No active requests detected in local sector.
                </div>
              ) : (
                requests.map(req => {
                  const isDispatched = req.status === 'dispatched';
                  return (
                    <div
                      key={req.id}
                      onClick={() => {
                        if (!isDispatched) {
                          setSelectedRequest(req);
                          findBestResource(req);
                        }
                      }}
                      style={{
                        background: selectedRequest?.id === req.id ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedRequest?.id === req.id ? '#00f3ff' : 'rgba(255,255,255,0.1)'}`,
                        padding: '12px',
                        borderRadius: '4px',
                        cursor: isDispatched ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: isDispatched ? 0.4 : 1,
                        filter: isDispatched ? 'grayscale(1)' : 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {isDispatched && (
                        <div style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#39ff14',
                          color: '#000',
                          fontSize: '8px',
                          padding: '2px 4px',
                          borderRadius: '2px',
                          fontWeight: 'bold'
                        }}>
                          DISPATCHED
                        </div>
                      )}
                      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{req.name}</div>
                      <div style={{ fontSize: '11px', color: '#00f3ff', textTransform: 'uppercase' }}>{req.location} • {req.resource}</div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedRequest && matchedResource && (
              <div style={{ marginTop: 'auto', padding: '15px', background: 'rgba(57,255,20,0.05)', border: '1px solid #39ff14', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#39ff14', textTransform: 'uppercase', marginBottom: '8px' }}>AI Match Found</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <div style={{ color: '#ff00ff' }}>{selectedRequest.location}</div>
                  <ArrowRight size={14} color="#39ff14" />
                  <div style={{ color: '#00f3ff' }}>{matchedResource.label}</div>
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '10px' }}>
                  Dist: {(() => {
                    const z = areaZones.find(z => z.name === selectedRequest.location);
                    return z ? calculateDistance(z.pos, matchedResource.pos).toFixed(2) : '0.00';
                  })()} km
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#00f3ff', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '4px' }}>
                  {selectedRequest.description}
                </div>
                <button
                  onClick={() => {
                    const zone = areaZones.find(z => z.name === selectedRequest.location);
                    if (zone && matchedResource) {
                      let nearestShelter = MOCK_RESOURCES.find(r => r.type === 'shelter');
                      let minDist = Infinity;
                      MOCK_RESOURCES.filter(r => r.type === 'shelter').forEach(s => {
                        const d = calculateDistance(zone.pos, s.pos);
                        if (d < minDist) {
                          minDist = d;
                          nearestShelter = s;
                        }
                      });

                      setActiveDispatchAnimations(prev => ({
                        ...prev,
                        [matchedResource.id]: {
                          resource: matchedResource,
                          startPos: matchedResource.pos,
                          targetPos: zone.pos,
                          shelterPos: matchedResource.pos, // return precisely to its safe parked offset starting point
                          currentPos: matchedResource.pos,
                          pct: 0,
                          phase: 'to_target'
                        }
                      }));
                    }

                    const updated = requests.map(r => {
                      if (r.id === selectedRequest.id) {
                        return { ...r, status: 'dispatched', dispatchTime: Date.now() };
                      }
                      return r;
                    });
                    sessionStorage.setItem('disaster_requests', JSON.stringify(updated));
                    setRequests(updated);
                    setSelectedRequest(null);
                    setMatchedResource(null);
                  }}
                  style={{
                    width: '100%', marginTop: '12px', padding: '8px', background: '#39ff14', color: '#000',
                    border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
                    fontFamily: 'var(--font-header)'
                  }}
                >
                  CONFIRM DISPATCH
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
