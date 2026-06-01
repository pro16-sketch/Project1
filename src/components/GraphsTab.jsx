import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  Activity, TrendingDown, Truck, Brain,
  AlertTriangle, RefreshCw, ArrowRight
} from 'lucide-react';

const COLORS = ['#0066ff', '#ff00ff', '#39ff14', '#ffb000'];
const CATEGORIES = ['Medical', 'Water', 'Boats', 'Shelters'];

// Pure pseudo-random generator to satisfy React 19 render purity rules
const getPseudoRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Custom dark mode tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataObj = payload[0].payload;
    const isScatter = dataObj && dataObj.category;

    return (
      <div style={{ background: 'rgba(5, 5, 16, 0.9)', border: '1px solid #0066ff', padding: '10px', boxShadow: '0 0 10px rgba(0,102,255,0.3)', color: '#fff' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#0066ff' }}>{label || (isScatter ? `Category: ${dataObj.category}` : 'Data Point')}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: 0, color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function GraphsTab() {
  const [requests, setRequests] = useState([]);

  // Phase E: Supply Inventory State Definition
  const defaultShelters = {
    'Salt Lake Stadium Relief Camp': {
      name: 'Stadium Relief Camp',
      water: 450,
      medical: 120,
      rations: 300,
      shelter: 80,
      maxWater: 1000,
      maxMedical: 500,
      maxRations: 1000,
      maxShelter: 200
    },
    'Science City Mega Shelter': {
      name: 'Science City Mega Shelter',
      water: 1200,
      medical: 500,
      rations: 800,
      shelter: 200,
      maxWater: 2000,
      maxMedical: 1000,
      maxRations: 2000,
      maxShelter: 500
    },
    'Rajarhat Evac Center': {
      name: 'Rajarhat Evac Center',
      water: 850,
      medical: 350,
      rations: 600,
      shelter: 150,
      maxWater: 1500,
      maxMedical: 800,
      maxRations: 1500,
      maxShelter: 300
    },
    'New Town Action Area I Shelter': {
      name: 'New Town Action Area I Shelter',
      water: 900,
      medical: 400,
      rations: 700,
      shelter: 180,
      maxWater: 1500,
      maxMedical: 800,
      maxRations: 1500,
      maxShelter: 350
    },
    'Jadavpur University Relief Camp': {
      name: 'Jadavpur University Relief Camp',
      water: 350,
      medical: 90,
      rations: 200,
      shelter: 50,
      maxWater: 800,
      maxMedical: 300,
      maxRations: 800,
      maxShelter: 150
    }
  };

  const [shelters, setShelters] = useState(() => {
    const saved = sessionStorage.getItem('shelter_inventory');
    if (saved) return JSON.parse(saved);
    return defaultShelters;
  });

  const [advisory, setAdvisory] = useState(null);
  const [reallocating, setReallocating] = useState(false);
  const [toast, setToast] = useState(null);
  const [simActive, setSimActive] = useState(false);

  // Phase E Interactive States
  const [manualSource, setManualSource] = useState('Science City Mega Shelter');
  const [manualTarget, setManualTarget] = useState('Salt Lake Stadium Relief Camp');
  const [manualResource, setManualResource] = useState('water');
  const [manualAmount, setManualAmount] = useState(100);

  const [overrideShelter, setOverrideShelter] = useState('Salt Lake Stadium Relief Camp');
  const [overrideResource, setOverrideResource] = useState('water');
  const [overrideAmount, setOverrideAmount] = useState(500);

  const [simulationMultiplier, setSimulationMultiplier] = useState(1.0);

  const getMaxCapacityShelters = (base) => {
    const maxed = JSON.parse(JSON.stringify(base));
    Object.keys(maxed).forEach(k => {
      maxed[k].water = maxed[k].maxWater;
      maxed[k].medical = maxed[k].maxMedical;
      maxed[k].rations = maxed[k].maxRations;
      maxed[k].shelter = maxed[k].maxShelter;
    });
    return maxed;
  };

  // Sync disaster requests and shelter inventory periodically
  useEffect(() => {
    const syncData = () => {
      const active = sessionStorage.getItem('sim_active') === 'true';
      setSimActive(active);

      const savedReqs = sessionStorage.getItem('disaster_requests');
      if (active && savedReqs) {
        setRequests(JSON.parse(savedReqs));
      } else if (!active) {
        setRequests([]); // Force empty queue when standby
      }

      const savedInv = sessionStorage.getItem('shelter_inventory');
      if (active && savedInv) {
        setShelters(JSON.parse(savedInv));
      } else if (!active) {
        // Freeze at 100% maximum capacity
        const maxed = getMaxCapacityShelters(defaultShelters);
        setShelters(maxed);
        sessionStorage.setItem('shelter_inventory', JSON.stringify(maxed));
      }
    };
    syncData();
    const interval = setInterval(syncData, 200); // 5Hz high-frequency poll for seamless sync
    return () => clearInterval(interval);
  }, []);

  // Dynamically map request zones to nearest distribution shelter
  const getShelterForLocation = (location) => {
    switch (location) {
      case 'Salt Lake': return 'Salt Lake Stadium Relief Camp';
      case 'Sector 4 Area': return 'Science City Mega Shelter';
      case 'New Town': return 'New Town Action Area I Shelter';
      case 'South City': return 'Jadavpur University Relief Camp';
      case 'North Avenue': return 'Rajarhat Evac Center';
      case 'Howrah': return 'Science City Mega Shelter'; // West Bank draws from nearest major
      case 'Central Station': return 'Salt Lake Stadium Relief Camp'; // Central draws from nearest
      default: return 'Science City Mega Shelter';
    }
  };

  // Base background shelter consumption rates (units/minute)
  const backgroundDraw = {
    'Salt Lake Stadium Relief Camp': { water: 2.0, rations: 0.8, shelter: 0.05, medical: 0.1 },
    'Science City Mega Shelter': { water: 5.0, rations: 2.0, shelter: 0.08, medical: 0.25 },
    'Rajarhat Evac Center': { water: 3.0, rations: 1.2, shelter: 0.06, medical: 0.15 },
    'New Town Action Area I Shelter': { water: 4.0, rations: 1.6, shelter: 0.07, medical: 0.2 },
    'Jadavpur University Relief Camp': { water: 1.5, rations: 0.6, shelter: 0.04, medical: 0.1 }
  };

  // Calculate live burn rate per resource item
  const getBurnRate = (shelterKey, resourceKey) => {
    let rate = backgroundDraw[shelterKey]?.[resourceKey] || 0;

    requests.forEach(req => {
      if (getShelterForLocation(req.location) === shelterKey) {
        let matched = false;
        if (resourceKey === 'water' && req.resource === 'Potable Water') matched = true;
        else if (resourceKey === 'rations' && req.resource === 'Medical Rations') matched = true;
        else if (resourceKey === 'shelter' && req.resource === 'Shelter Kit') matched = true;
        else if (resourceKey === 'medical' && (req.resource === 'First Aid Kit' || req.resource === 'Immediate Saline')) matched = true;

        if (matched) {
          const priority = req.priority || 2;
          const rates = { 1: 1.5, 2: 1.0, 3: 0.5 };
          rate += (rates[priority] || 1.0);
        }
      }
    });

    return rate * simulationMultiplier;
  };

  // Drawdown loop simulation tick (runs every 3s)
  useEffect(() => {
    if (!simActive) return;

    const interval = setInterval(() => {
      setShelters(prev => {
        const next = JSON.parse(JSON.stringify(prev));

        // Background draw (3s = 1/20 of a minute)
        Object.keys(next).forEach(key => {
          const bg = backgroundDraw[key];
          next[key].water = Math.max(0, next[key].water - ((bg.water / 20) * simulationMultiplier));
          next[key].rations = Math.max(0, next[key].rations - ((bg.rations / 20) * simulationMultiplier));
          next[key].shelter = Math.max(0, next[key].shelter - ((bg.shelter / 20) * simulationMultiplier));
          next[key].medical = Math.max(0, next[key].medical - ((bg.medical / 20) * simulationMultiplier));
        });

        // Active request draw (3s = 1/20 of a minute)
        requests.forEach(req => {
          const shelterKey = getShelterForLocation(req.location);
          if (!next[shelterKey]) return;

          let resourceKey = null;
          if (req.resource === 'Potable Water') resourceKey = 'water';
          else if (req.resource === 'Medical Rations') resourceKey = 'rations';
          else if (req.resource === 'Shelter Kit') resourceKey = 'shelter';
          else if (req.resource === 'First Aid Kit' || req.resource === 'Immediate Saline') resourceKey = 'medical';

          if (resourceKey) {
            const priority = req.priority || 2;
            const rates = { 1: 1.5, 2: 1.0, 3: 0.5 };
            const drawRate = rates[priority] || 1.0;
            next[shelterKey][resourceKey] = Math.max(0, next[shelterKey][resourceKey] - ((drawRate / 20) * simulationMultiplier));
          }
        });

        sessionStorage.setItem('shelter_inventory', JSON.stringify(next));
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [requests, simulationMultiplier, simActive]);

  const handleManualTransfer = () => {
    if (manualSource === manualTarget) {
      setToast({ type: 'warning', text: 'ERROR: Source and Target shelters must be different!' });
      return;
    }

    setShelters(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[manualSource] && next[manualTarget]) {
        const sourceCurrent = next[manualSource][manualResource];
        const actualTransfer = Math.min(sourceCurrent, manualAmount);

        if (actualTransfer <= 0) {
          setToast({ type: 'warning', text: `ERROR: No ${manualResource.toUpperCase()} available in source shelter!` });
          return prev;
        }

        const resourceNameCap = manualResource.charAt(0).toUpperCase() + manualResource.slice(1);
        const maxKey = `max${resourceNameCap}`;

        next[manualSource][manualResource] = Math.max(0, next[manualSource][manualResource] - actualTransfer);
        next[manualTarget][manualResource] = Math.min(next[manualTarget][manualResource] + actualTransfer, next[manualTarget][maxKey]);

        sessionStorage.setItem('shelter_inventory', JSON.stringify(next));
        setToast({ type: 'success', text: `Manual Dispatch: ${Math.round(actualTransfer)} ${manualResource.toUpperCase()} moved to ${next[manualTarget].name}.` });
        return next;
      }
      return prev;
    });
  };

  const handleStockOverride = () => {
    setShelters(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[overrideShelter]) {
        const resourceNameCap = overrideResource.charAt(0).toUpperCase() + overrideResource.slice(1);
        const maxKey = `max${resourceNameCap}`;
        const maxVal = next[overrideShelter][maxKey];

        const targetVal = Math.max(0, Math.min(maxVal, overrideAmount));
        next[overrideShelter][overrideResource] = targetVal;

        sessionStorage.setItem('shelter_inventory', JSON.stringify(next));
        setToast({ type: 'success', text: `Manual Overrides: ${next[overrideShelter].name} ${overrideResource.toUpperCase()} adjusted to ${Math.round(targetVal)}.` });
        return next;
      }
      return prev;
    });
  };

  // Dynamic Scenario triggers for operator errands
  const triggerWaterShortage = () => {
    setShelters(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next['Jadavpur University Relief Camp']) {
        next['Jadavpur University Relief Camp'].water = 18;
        sessionStorage.setItem('shelter_inventory', JSON.stringify(next));
      }
      return next;
    });
    setToast({ type: 'warning', text: 'CRITICAL: Jadavpur pump inundation. Clean water reserves contaminated!' });
  };

  const triggerOutbreak = () => {
    const outbreakReqs = [
      {
        id: Date.now() + 1,
        name: "Amina Bibi",
        age: "42",
        gender: "Female",
        disease: "Severe Dehydration (Cholera Risk)",
        resource: "Immediate Saline",
        priority: 1,
        description: "Critical trauma detected: Cholera outbreak risk in Bally/Howrah requires rapid clinical response.",
        status: "pending",
        rescueTimeLimit: 20,
        time: Date.now(),
        location: "Howrah"
      },
      {
        id: Date.now() + 2,
        name: "Subir Roy",
        age: "35",
        gender: "Male",
        disease: "Acute Diarrheal Infection",
        resource: "First Aid Kit",
        priority: 1,
        description: "Physiological shock detected. Deploy emergency kits.",
        status: "pending",
        rescueTimeLimit: 20,
        time: Date.now(),
        location: "Howrah"
      },
      {
        id: Date.now() + 3,
        name: "Rajesh Kisku",
        age: "28",
        gender: "Male",
        disease: "High Bacterial Fever / Shock",
        resource: "Medical Rations",
        priority: 1,
        description: "Severe nutritional deficit and critical high fever mapped. Dispatching rations.",
        status: "pending",
        rescueTimeLimit: 20,
        time: Date.now(),
        location: "Howrah"
      }
    ];

    setRequests(prev => {
      const updated = [...prev, ...outbreakReqs];
      sessionStorage.setItem('disaster_requests', JSON.stringify(updated));
      return updated;
    });
    setToast({ type: 'warning', text: 'OUTBREAK INJECTED: Cholera cluster logged in Howrah. Medical drawdown spiked!' });
  };

  const resetTelemetry = () => {
    setShelters(defaultShelters);
    sessionStorage.setItem('shelter_inventory', JSON.stringify(defaultShelters));
    setRequests([]);
    sessionStorage.setItem('disaster_requests', JSON.stringify([]));
    setAdvisory(null);
    setToast({ type: 'success', text: 'Nexus telemetry reset. Active sectors stabilized.' });
  };

  // Inject custom CSS animations dynamically
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes scanline {
        0% { top: 0%; }
        50% { top: 100%; }
        100% { top: 0%; }
      }
      .scanner-container {
        position: relative;
        overflow: hidden;
      }
      .scanner-line {
        position: absolute;
        width: 100%;
        height: 2px;
        background: rgba(0, 243, 255, 0.5);
        box-shadow: 0 0 8px rgba(0, 243, 255, 0.8);
        animation: scanline 2s linear infinite;
        pointer-events: none;
      }
      @keyframes neon-pulse {
        0%, 100% {
          box-shadow: 0 0 5px rgba(255, 51, 51, 0.2), inset 0 0 5px rgba(255, 51, 51, 0.1);
          border-color: rgba(255, 51, 51, 0.3);
        }
        50% {
          box-shadow: 0 0 15px rgba(255, 51, 51, 0.6), inset 0 0 8px rgba(255, 51, 51, 0.3);
          border-color: rgba(255, 51, 51, 0.9);
        }
      }
      .glow-critical {
        animation: neon-pulse 1.2s infinite;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Toast Auto-clear
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  // Request optimization payload from Gemini
  const getGeminiReallocation = async () => {
    setReallocating(true);
    setAdvisoryError(null);

    const telemetry = Object.keys(shelters).map(key => {
      const s = shelters[key];
      return {
        shelterName: key,
        stock: {
          water: Math.round(s.water),
          medical: Math.round(s.medical),
          rations: Math.round(s.rations),
          shelter: Math.round(s.shelter)
        },
        maxStock: {
          water: s.maxWater,
          medical: s.maxMedical,
          rations: s.maxRations,
          shelter: s.maxShelter
        },
        burnRate: {
          water: parseFloat(getBurnRate(key, 'water').toFixed(2)),
          medical: parseFloat(getBurnRate(key, 'medical').toFixed(2)),
          rations: parseFloat(getBurnRate(key, 'rations').toFixed(2)),
          shelter: parseFloat(getBurnRate(key, 'shelter').toFixed(2))
        }
      };
    });

    const prompt = `
      You are the Neural Logistics Advisory Engine for a disaster response operations panel.
      Analyze the current active shelter stock levels and draw rates in units per minute:
      ${JSON.stringify(telemetry, null, 2)}

      Suggest exactly one optimization resource transfer payload from a shelter with a solid surplus to a shelter in deficit.
      Prioritize the resource (water, medical, rations, shelter) that has the lowest Time-to-Depletion (currentStock / burnRate) at the destination.
      Ensure the source shelter has enough surplus to spare the amount.
      The transfer amount should be reasonable (e.g. 50-200 units), fitting within target capacity limits.

      Return ONLY a raw JSON object matching the following structure (no markdown formatting, no other text, just raw JSON):
      {
        "source": "Full Shelter Name",
        "target": "Full Shelter Name",
        "resource": "water | medical | rations | shelter",
        "amount": number,
        "rationale": "Strategic justification emphasizing hours/minutes saved or critical threat resolved."
      }
    `;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined in environment variables.");
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("Empty candidate list returned by Gemini.");
      }

      const result = data.candidates[0].content.parts[0].text;
      const cleanJson = result.replace(/```json|```/g, '').trim();
      const recommendation = JSON.parse(cleanJson);

      if (!shelters[recommendation.source] || !shelters[recommendation.target]) {
        throw new Error("Advisory returned invalid shelter names.");
      }

      setAdvisory(recommendation);
      setToast({ type: 'success', text: 'Neural Logistics optimization advisory compiled.' });
    } catch (err) {
      console.error("Advisory compilation failed:", err);

      // Dynamic fallback recommendation based on actual stock levels
      let lowestShelter = 'Jadavpur University Relief Camp';
      let lowestVal = Infinity;
      Object.keys(shelters).forEach(k => {
        if (shelters[k].water < lowestVal) {
          lowestVal = shelters[k].water;
          lowestShelter = k;
        }
      });

      const fallback = {
        source: "Science City Mega Shelter",
        target: lowestShelter,
        resource: "water",
        amount: 150,
        rationale: "Safety fallback: Transferring 150 units of water from Science City to stabilize depleted reserves in the southern sector."
      };
      setAdvisory(fallback);
      setToast({ type: 'warning', text: 'Advisory Engine running in safe-mode fallback.' });
    } finally {
      setReallocating(false);
    }
  };

  // Perform the actual inventory transfer in state + sessionStorage
  const handleExecuteTransfer = () => {
    if (!advisory) return;
    const { source, target, resource, amount } = advisory;

    setShelters(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[source] && next[target]) {
        const sourceCurrent = next[source][resource];
        const actualTransfer = Math.min(sourceCurrent, amount);

        const resourceNameCap = resource.charAt(0).toUpperCase() + resource.slice(1);
        const maxKey = `max${resourceNameCap}`;

        next[source][resource] = Math.max(0, next[source][resource] - actualTransfer);
        next[target][resource] = Math.min(next[target][resource] + actualTransfer, next[target][maxKey]);

        sessionStorage.setItem('shelter_inventory', JSON.stringify(next));
        setToast({ type: 'success', text: `Route Established: ${Math.round(actualTransfer)} ${resource.toUpperCase()} delivered to ${next[target].name}.` });
        return next;
      }
      return prev;
    });

    setAdvisory(null);
  };

  // 1. Timeline Data Sync (with Dynamic Spike)
  const currentHour = new Date().getHours();
  const timelineData = [
    { time: '00:00', requests: 12 },
    { time: '04:00', requests: 45 },
    { time: '08:00', requests: 120 },
    { time: '12:00', requests: 310 },
    { time: '16:00', requests: 280 },
    { time: '20:00', requests: 150 },
  ].map(point => {
    const pointHour = parseInt(point.time.split(':')[0]);
    const isCurrentBucket = currentHour >= pointHour && currentHour < pointHour + 4;
    if (isCurrentBucket && requests.length > 0) {
      return { ...point, requests: point.requests + (requests.length * 40) };
    }
    return point;
  });

  // 2. Resource Data Sync
  const counts = requests.reduce((acc, r) => {
    if (r.resource.includes('Saline') || r.resource.includes('First Aid')) acc.Medical++;
    if (r.resource.includes('Water')) acc.Water++;
    if (r.resource.includes('Boat')) acc.Boats++;
    if (r.resource.includes('Shelter')) acc.Shelters++;
    return acc;
  }, { Medical: 0, Water: 0, Boats: 0, Shelters: 0 });

  const resourceData = [
    { name: 'Medical', available: 400, required: 800 + counts.Medical * 50 },
    { name: 'Water', available: 1200, required: 3000 + counts.Water * 100 },
    { name: 'Boats', available: 950, required: 600 + counts.Boats * 30 },
    { name: 'Shelters', available: 850, required: 600 + counts.Shelters * 20 },
  ];

  // 3. Scatter Plot Sync
  const scatterData = requests.map((r, i) => {
    let catIndex = 0;
    if (r.resource.includes('Water')) catIndex = 1;
    if (r.resource.includes('Boat')) catIndex = 2;
    if (r.resource.includes('Shelter')) catIndex = 3;

    const seedX = (r.id || i) + 1;
    const seedY = (r.id || i) + 2;
    const pseudoX = getPseudoRandom(seedX);
    const pseudoY = getPseudoRandom(seedY);

    return {
      x: r.priority + (pseudoX * 0.4 - 0.2),
      y: 100 - (r.priority * 20) + (pseudoY * 20),
      z: 100,
      category: CATEGORIES[catIndex],
      name: r.name
    };
  });

  return (
    <div style={{ height: '100%', width: '100%', overflowY: 'auto', padding: '10px 20px' }}>
      
      {/* Toast Notification */}
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

      <h2 style={{ marginBottom: '20px' }}>Systems Analytics</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '25px', marginBottom: '35px' }}>
        {/* Line Chart */}
        <div className="glass-panel" style={{ padding: '20px', height: '420px', position: 'relative' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Request Frequency (Timeline)</h3>
          <div style={{ width: '100%', height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 15, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,102,255,0.1)" />
                <XAxis dataKey="time" stroke="#e0e0ff" label={{ value: "Time of Day", position: "insideBottom", offset: -10, fill: "#e0e0ff", fontSize: 12 }} />
                <YAxis stroke="#e0e0ff" label={{ value: "Total Requests", angle: -90, position: "insideLeft", fill: "#e0e0ff", style: { textAnchor: "middle" }, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="requests" stroke="#ff00ff" strokeWidth={3} dot={{ r: 4, fill: '#ff00ff', stroke: '#fff' }} activeDot={{ r: 8, fill: '#fff', stroke: '#ff00ff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-panel" style={{ padding: '20px', height: '420px', position: 'relative' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Resource Availability vs Requirement</h3>
          <div style={{ width: '100%', height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} margin={{ top: 5, right: 20, bottom: 15, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,102,255,0.1)" />
                <XAxis dataKey="name" stroke="#e0e0ff" label={{ value: "Resource Category", position: "insideBottom", offset: -10, fill: "#e0e0ff", fontSize: 12 }} />
                <YAxis stroke="#e0e0ff" label={{ value: "Quantity (Units)", angle: -90, position: "insideLeft", fill: "#e0e0ff", style: { textAnchor: "middle" }, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="available" fill="#39ff14" radius={[4, 4, 0, 0]} />
                <Bar dataKey="required" fill="#ff3333" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter / Jitter Plot */}
        <div className="glass-panel" style={{ padding: '20px', height: '420px', position: 'relative' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Priority Clustering (Jitter Plot)</h3>
          <div style={{ width: '100%', height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 20, bottom: 50, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,102,255,0.1)" />
                <XAxis type="number" dataKey="x" name="Priority Level" stroke="#e0e0ff" domain={[0.5, 3.5]} ticks={[1, 2, 3]} label={{ value: "Priority Level (1 = Urgent)", position: "insideBottom", offset: -20, fill: "#e0e0ff", fontSize: 12 }} />
                <YAxis type="number" dataKey="y" name="Impact" stroke="#e0e0ff" label={{ value: "Impact Severity", angle: -90, position: "insideLeft", fill: "#e0e0ff", style: { textAnchor: "middle" }, fontSize: 12 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={60} wrapperStyle={{ paddingTop: '30px' }} />
                {CATEGORIES.map((cat, index) => (
                  <Scatter
                    key={cat}
                    name={cat}
                    data={scatterData.filter(d => d.category === cat)}
                    fill={COLORS[index]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-panel" style={{ padding: '20px', height: '420px', position: 'relative' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>Available Resource Distribution</h3>
          <div style={{ width: '100%', height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resourceData} dataKey="available" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={5} isAnimationActive={false}>
                  {resourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Phase E: Predictive Supply Chain Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(0, 243, 255, 0.2)', paddingBottom: '10px' }}>
        <Truck style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} size={24} />
        <h2>Predictive Supply Chain & Logistics</h2>
      </div>

      {/* Dual Column Layout: Left (Neural Advisory & Simulator), Right (Shelter Telemetry) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', marginBottom: '50px' }}>
        
        {/* Left Column wrapper */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Neural Logistics Advisory */}
          <div className="glass-panel scanner-container" style={{ padding: '25px', display: 'flex', flexDirection: 'column', minHeight: '420px', border: '1px solid rgba(255, 0, 255, 0.2)' }}>
            {reallocating && <div className="scanner-line"></div>}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-magenta)' }}>
                <Brain style={{ filter: 'drop-shadow(0 0 5px var(--neon-magenta))' }} size={20} />
                <h3 style={{ fontSize: '15px', color: 'var(--neon-magenta)', textShadow: '0 0 8px rgba(255, 0, 255, 0.4)' }}>Neural Logistics Advisory</h3>
              </div>
              
              <button
                onClick={getGeminiReallocation}
                disabled={reallocating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 15px',
                  background: 'rgba(255, 0, 255, 0.1)',
                  border: '1px solid var(--neon-magenta)',
                  color: 'var(--neon-magenta)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-header)',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  borderRadius: '4px'
                }}
              >
                <RefreshCw size={12} className={reallocating ? 'animate-spin' : ''} />
                {reallocating ? 'Scanning...' : 'Cognitive Audit'}
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {reallocating ? (
                <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                  <Brain size={40} className="animate-pulse" style={{ color: 'var(--neon-cyan)', marginBottom: '10px' }} />
                  <p style={{ fontFamily: 'var(--font-header)', fontSize: '12px', color: '#888', letterSpacing: '1px' }}>
                    ANALYZING BALANCES...
                  </p>
                </div>
              ) : advisory ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {/* Transfer Graphic */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', padding: '15px', border: '1px dashed rgba(0, 243, 255, 0.3)', borderRadius: '4px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: '3px' }}>Surplus Source</div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{shelters[advisory.source]?.name || advisory.source}</div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px', color: 'var(--neon-magenta)' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-header)', background: 'rgba(255,0,255,0.1)', padding: '2px 6px', border: '1px solid var(--neon-magenta)', borderRadius: '10px', marginBottom: '3px' }}>
                        +{advisory.amount} {advisory.resource.toUpperCase()}
                      </span>
                      <ArrowRight size={16} className="animate-pulse" />
                    </div>
                    
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: 'var(--neon-red)', textTransform: 'uppercase', marginBottom: '3px' }}>Deficit Target</div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{shelters[advisory.target]?.name || advisory.target}</div>
                    </div>
                  </div>

                  {/* Rationale Block */}
                  <div style={{ padding: '12px', background: 'rgba(0, 243, 255, 0.05)', borderLeft: '3px solid var(--neon-cyan)', borderRadius: '0 4px 4px 0' }}>
                    <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>Strategic Recommendation</div>
                    <p style={{ fontSize: '12px', fontStyle: 'italic', lineHeight: '1.4', color: '#e0e0ff' }}>
                      "{advisory.rationale}"
                    </p>
                  </div>

                  {/* Execute button */}
                  <button
                    onClick={handleExecuteTransfer}
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
                      fontSize: '12px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      transition: 'all 0.3s',
                      boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)'
                    }}
                  >
                    <Truck size={14} />
                    Execute Reallocation
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: '#555' }}>
                  <Activity size={28} style={{ color: '#333', marginBottom: '8px' }} />
                  <p style={{ fontSize: '12px', fontFamily: 'var(--font-header)', letterSpacing: '1px' }}>
                    LOGISTICS ADVISORY STANDBY
                  </p>
                  <p style={{ fontSize: '11px', marginTop: '5px' }}>
                    Run a Cognitive Audit or trigger a crisis scenario below to observe response.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cognitive Scenario Control */}
          <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(0, 243, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-cyan)' }}>
              <Activity size={18} style={{ filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }} />
              <h3 style={{ fontSize: '13px', color: 'var(--neon-cyan)', textShadow: '0 0 6px rgba(0, 243, 255, 0.3)' }}>Cognitive Scenario Control</h3>
            </div>
            
            <p style={{ fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
              Inject emergency parameters to simulate real-time flood pump contamination or cholera outbreaks and evaluate reallocation advisory routing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                onClick={triggerWaterShortage}
                style={{
                  padding: '10px 5px',
                  background: 'rgba(255, 51, 51, 0.1)',
                  border: '1px solid var(--neon-red)',
                  color: 'var(--neon-red)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-header)',
                  fontSize: '9px',
                  letterSpacing: '0.5px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 51, 51, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 51, 51, 0.1)'}
              >
                Water Crisis
              </button>
              
              <button
                onClick={triggerOutbreak}
                style={{
                  padding: '10px 5px',
                  background: 'rgba(255, 176, 0, 0.1)',
                  border: '1px solid var(--neon-amber)',
                  color: 'var(--neon-amber)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-header)',
                  fontSize: '9px',
                  letterSpacing: '0.5px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 176, 0, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 176, 0, 0.1)'}
              >
                Saline Outbreak
              </button>

              <button
                onClick={resetTelemetry}
                style={{
                  padding: '10px 5px',
                  background: 'rgba(57, 255, 20, 0.1)',
                  border: '1px solid var(--neon-lime)',
                  color: 'var(--neon-lime)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-header)',
                  fontSize: '9px',
                  letterSpacing: '0.5px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(57, 255, 20, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(57, 255, 20, 0.1)'}
              >
                Reset Nexus
              </button>
            </div>
          </div>

          {/* Manual Logistics intervention & Simulation Scale */}
          <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(0, 243, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-lime)' }}>
              <TrendingDown size={18} style={{ filter: 'drop-shadow(0 0 5px var(--neon-lime))' }} />
              <h3 style={{ fontSize: '13px', color: 'var(--neon-lime)', textShadow: '0 0 6px rgba(57, 255, 20, 0.3)' }}>Manual Supply Intervention</h3>
            </div>
            
            {/* Simulation speed multiplier */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
                <span style={{ color: '#aaa' }}>Depletion Simulation Rate:</span>
                <span style={{ color: 'var(--neon-lime)', fontWeight: 'bold' }}>{simulationMultiplier.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.0" 
                max="5.0" 
                step="0.5" 
                value={simulationMultiplier} 
                onChange={(e) => setSimulationMultiplier(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--neon-lime)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', marginTop: '4px' }}>
                <span>Paused (0.0x)</span>
                <span>Normal (1.0x)</span>
                <span>Hyper (5.0x)</span>
              </div>
            </div>

            {/* Manual Reallocation Transfer Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manual Dispatch Route</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '3px' }}>Source Shelter</label>
                  <select 
                    value={manualSource} 
                    onChange={(e) => setManualSource(e.target.value)}
                    style={{ width: '100%', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', fontSize: '10px', padding: '6px', borderRadius: '4px', outline: 'none' }}
                  >
                    {Object.keys(shelters).map(k => (
                      <option key={k} value={k}>{shelters[k].name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '3px' }}>Target Shelter</label>
                  <select 
                    value={manualTarget} 
                    onChange={(e) => setManualTarget(e.target.value)}
                    style={{ width: '100%', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', fontSize: '10px', padding: '6px', borderRadius: '4px', outline: 'none' }}
                  >
                    {Object.keys(shelters).map(k => (
                      <option key={k} value={k}>{shelters[k].name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '3px' }}>Resource</label>
                  <select 
                    value={manualResource} 
                    onChange={(e) => setManualResource(e.target.value)}
                    style={{ width: '100%', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', fontSize: '10px', padding: '6px', borderRadius: '4px', outline: 'none' }}
                  >
                    <option value="water">Potable Water</option>
                    <option value="rations">Medical Rations</option>
                    <option value="shelter">Shelter Kits</option>
                    <option value="medical">First Aid Kits</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '3px' }}>Quantity (Units)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000" 
                    value={manualAmount} 
                    onChange={(e) => setManualAmount(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(0, 243, 255, 0.3)', color: '#fff', fontSize: '10px', padding: '6px', borderRadius: '4px', outline: 'none' }}
                  />
                </div>
              </div>

              <button
                onClick={handleManualTransfer}
                style={{
                  padding: '10px',
                  background: 'rgba(0, 243, 255, 0.1)',
                  border: '1px solid var(--neon-cyan)',
                  color: 'var(--neon-cyan)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-header)',
                  fontSize: '9px',
                  letterSpacing: '0.5px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(0, 243, 255, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(0, 243, 255, 0.1)'}
              >
                Dispatch Manual Route
              </button>
            </div>

            {/* Direct Stock Override Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--neon-magenta)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Override Reserves</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
                <select 
                  value={overrideShelter} 
                  onChange={(e) => setOverrideShelter(e.target.value)}
                  style={{ width: '100%', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(255, 0, 255, 0.3)', color: '#fff', fontSize: '10px', padding: '6px', borderRadius: '4px', outline: 'none' }}
                >
                  {Object.keys(shelters).map(k => (
                    <option key={k} value={k}>{shelters[k].name}</option>
                  ))}
                </select>
                
                <select 
                  value={overrideResource} 
                  onChange={(e) => setOverrideResource(e.target.value)}
                  style={{ width: '100%', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(255, 0, 255, 0.3)', color: '#fff', fontSize: '10px', padding: '6px', borderRadius: '4px', outline: 'none' }}
                >
                  <option value="water">Water</option>
                  <option value="rations">Rations</option>
                  <option value="shelter">Shelter</option>
                  <option value="medical">Medical</option>
                </select>

                <input 
                  type="number" 
                  min="0" 
                  value={overrideAmount} 
                  onChange={(e) => setOverrideAmount(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', background: 'rgba(5, 5, 20, 0.95)', border: '1px solid rgba(255, 0, 255, 0.3)', color: '#fff', fontSize: '10px', padding: '6px', borderRadius: '4px', outline: 'none' }}
                />
              </div>

              <button
                onClick={handleStockOverride}
                style={{
                  padding: '10px',
                  background: 'rgba(255, 0, 255, 0.1)',
                  border: '1px solid var(--neon-magenta)',
                  color: 'var(--neon-magenta)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-header)',
                  fontSize: '9px',
                  letterSpacing: '0.5px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 0, 255, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 0, 255, 0.1)'}
              >
                Apply Reserve Correction
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Shelter Telemetry Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.keys(shelters).map(key => {
            const shelter = shelters[key];
            const resources = [
              { key: 'water', label: 'Potable Water', color: 'var(--neon-cyan)', max: shelter.maxWater, value: shelter.water },
              { key: 'rations', label: 'Medical Rations', color: 'var(--neon-amber)', max: shelter.maxRations, value: shelter.rations },
              { key: 'shelter', label: 'Shelter Kits', color: 'var(--neon-magenta)', max: shelter.maxShelter, value: shelter.shelter },
              { key: 'medical', label: 'First Aid Kits', color: 'var(--neon-lime)', max: shelter.maxMedical, value: shelter.medical },
            ];

            // Check if any resource has a critical TTD (<30 mins)
            let isShelterCritical = false;
            resources.forEach(res => {
              const burn = getBurnRate(key, res.key);
              if (burn > 0) {
                const ttd = res.value / burn;
                if (ttd < 30) isShelterCritical = true;
              }
            });

            return (
              <div
                key={key}
                className={`glass-panel ${isShelterCritical ? 'glow-critical' : ''}`}
                style={{
                  padding: '20px',
                  border: isShelterCritical ? '1px solid rgba(255, 51, 51, 0.4)' : '1px solid rgba(0, 243, 255, 0.1)',
                  background: isShelterCritical ? 'rgba(255, 51, 51, 0.03)' : 'rgba(10, 10, 25, 0.4)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isShelterCritical ? 'var(--neon-red)' : 'var(--neon-cyan)' }}></div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'var(--font-header)', letterSpacing: '0.5px' }}>
                      {shelter.name}
                    </span>
                  </div>
                  
                  {isShelterCritical && (
                    <span style={{ fontSize: '10px', color: 'var(--neon-red)', fontFamily: 'var(--font-header)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,51,51,0.1)', padding: '2px 8px', border: '1px solid var(--neon-red)', borderRadius: '4px' }}>
                      <AlertTriangle size={10} className="animate-pulse" /> DEPLETION RISK
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {resources.map(res => {
                    const burn = getBurnRate(key, res.key);
                    const pct = Math.min(100, Math.max(0, (res.value / res.max) * 100));
                    
                    let ttdDisplay = 'STABLE';
                    let ttdColor = 'var(--neon-lime)';
                    if (burn > 0) {
                      const ttdMinutes = res.value / burn;
                      if (ttdMinutes <= 0) {
                        ttdDisplay = 'DEPLETED';
                        ttdColor = 'var(--neon-red)';
                      } else if (ttdMinutes < 30) {
                        ttdDisplay = `CRITICAL (${Math.round(ttdMinutes)}m)`;
                        ttdColor = 'var(--neon-red)';
                      } else if (ttdMinutes < 120) {
                        ttdDisplay = `${Math.round(ttdMinutes)}m`;
                        ttdColor = 'var(--neon-amber)';
                      } else {
                        ttdDisplay = `${(ttdMinutes / 60).toFixed(1)}h`;
                        ttdColor = 'var(--neon-cyan)';
                      }
                    }

                    return (
                      <div key={res.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span style={{ color: '#aaa' }}>{res.label}</span>
                          <span style={{ fontWeight: 'bold' }}>{Math.round(res.value)} / {res.max}</span>
                        </div>
                        
                        {/* Progress Bar Container */}
                        <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: res.color,
                            boxShadow: `0 0 6px ${res.color}`,
                            transition: 'width 0.5s ease-out'
                          }}></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
                          <span style={{ color: burn > 0 ? 'var(--neon-magenta)' : '#555' }}>
                            {burn > 0 ? `-${burn.toFixed(1)} units/m` : '0.0/m'}
                          </span>
                          <span style={{ color: ttdColor, fontWeight: 'bold', fontFamily: 'var(--font-header)' }}>
                            TTD: {ttdDisplay}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
