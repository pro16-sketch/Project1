import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Create the Context
const PrimeStateContext = createContext(null);

// Default initial capacities and state
const INITIAL_HOSPITALS = [
  { id: 'h1', name: 'SSKM Medical College', beds: 847, maxBeds: 1000, icu: 12, maxIcu: 50, blood: 'O+ Low', traumaBay: '3 Free', pos: [22.5380, 88.3425], contact: "033-2223-1514" },
  { id: 'h2', name: 'RG Kar Hospital', beds: 412, maxBeds: 600, icu: 4, maxIcu: 25, blood: 'B+ OK', traumaBay: '1 Free', pos: [22.5976, 88.3750], contact: "033-2555-7675" },
  { id: 'h3', name: 'Apollo Multispecialty', beds: 216, maxBeds: 350, icu: 8, maxIcu: 30, blood: 'All OK', traumaBay: '2 Free', pos: [22.5780, 88.4020], contact: "033-2320-3040" },
  { id: 'h4', name: 'AMRI Salt Lake', beds: 180, maxBeds: 250, icu: 15, maxIcu: 40, blood: 'A- Low', traumaBay: '4 Free', pos: [22.5900, 88.4100], contact: "033-2335-7710" },
  { id: 'h5', name: 'EM Bypass Specialty', beds: 310, maxBeds: 500, icu: 22, maxIcu: 60, blood: 'O- Critical', traumaBay: '5 Free', pos: [22.5546, 88.4029], contact: "033-2441-2000" }
];

const INITIAL_FLEET = [
  { id: 'v1', name: 'NDRF Rescue Boat 01', type: 'boat', status: 'Available', pos: [22.5415, 88.3945], crew: 4, fuel: 82, payload: 12, speed: '25 kn', eta: '--' },
  { id: 'v2', name: 'NDRF Rescue Boat 02', type: 'boat', status: 'Available', pos: [22.5695, 88.4075], crew: 5, fuel: 95, payload: 12, speed: '24 kn', eta: '--' },
  { id: 'v3', name: 'Fire Engine 12', type: 'engine', status: 'Available', pos: [22.5900, 88.4650], crew: 6, fuel: 74, payload: 3000, speed: '45 km/h', eta: '--' },
  { id: 'v4', name: 'State MedEvac Helicopter', type: 'chopper', status: 'Available', pos: [22.5680, 88.4090], crew: 3, fuel: 65, payload: 4, speed: '180 km/h', eta: '--', altitude: '1,200 ft' },
  { id: 'v5', name: 'Ambulance Unit C', type: 'ambulance', status: 'Available', pos: [22.5800, 88.4700], crew: 2, fuel: 88, payload: 2, speed: '55 km/h', eta: '--' }
];

const INITIAL_AGENCIES = [
  { id: 'a1', name: 'NDRF Battalion 2', units: '4 rescue teams', status: 'Active', ping: '2m ago', leader: 'Commander R. S. Negi', comms: 'VHF Channel 16' },
  { id: 'a2', name: 'State Fire & Emergency', units: '12 pumper engines', status: 'Standby', ping: '5m ago', leader: 'Chief Fire Officer A. K. Banerjee', comms: 'UHF Channel 4a' },
  { id: 'a3', name: 'Coast Guard Eastern', units: '3 marine hovercraft', status: 'En Route', ping: '1m ago', leader: 'Lt. Commander S. Roy', comms: 'HF Marine 8.2 MHz' },
  { id: 'a4', name: 'Civilian Volunteers', units: '25 emergency scouts', status: 'Active', ping: 'Just now', leader: 'Dr. Priya Sen', comms: 'Mesh Chat Node 12' }
];

// Initial incidents state (Kanban board support)
const INITIAL_MISSIONS = [
  { id: 'm1', title: 'Rooftop Structural Collapse', severity: 'critical', location: 'Howrah', column: 'Briefing', time: '10m ago', assignedTo: 'NDRF Rescue Boat 01', description: 'Civilian home roof cave-in due to high water scour. 3 victims trapped.' },
  { id: 'm2', title: 'Power Grid Fire Danger', severity: 'high', location: 'Central Station', column: 'Unassigned', time: '15m ago', assignedTo: null, description: 'Transformers bubbling and producing sparks. Risk of immediate area blackout.' },
  { id: 'm3', title: 'SSKM Medical Evac escort', severity: 'medium', location: 'Bally', column: 'En Route', time: '3m ago', assignedTo: 'State MedEvac Helicopter', description: 'Transporting critical medical gear to stranded medical field post.' },
  { id: 'm4', title: 'Rations Dispatch to Stadium', severity: 'low', location: 'Salt Lake', column: 'Completed', time: '1h ago', assignedTo: 'Ambulance Unit C', description: 'Bulk delivery of clean water barrels and MREs.' }
];

// Initial mock sensors
const generateInitialSensors = () => {
  return [
    { id: 's1', name: 'Hooghly River Gauge Bally', type: 'river', status: 'Normal', value: 1.15, max: 3.5, unit: 'm', alertThreshold: 2.2, change: '+0.02' },
    { id: 's2', name: 'Hooghly River Gauge Howrah', type: 'river', status: 'Danger', value: 2.65, max: 3.5, unit: 'm', alertThreshold: 2.2, change: '+0.11' },
    { id: 's3', name: 'Dum Dum Airport Rain Gauge', type: 'rain', status: 'Normal', value: 12.5, max: 200, unit: 'mm/h', alertThreshold: 45.0, change: '+2.1' },
    { id: 's4', name: 'New Town Smart Rain Sensor', type: 'rain', status: 'Alert', value: 52.4, max: 200, unit: 'mm/h', alertThreshold: 45.0, change: '+8.4' },
    { id: 's5', name: 'Salt Lake Sector V AQI Node', type: 'aqi', status: 'Normal', value: 85, max: 500, unit: 'AQI', alertThreshold: 150, change: '-3' },
    { id: 's6', name: 'Howrah Industrial Air Sensor', type: 'aqi', status: 'Alert', value: 165, max: 500, unit: 'AQI', alertThreshold: 150, change: '+14' },
    { id: 's7', name: 'USGS Seismometer Sonarpur', type: 'seismic', status: 'Normal', value: 0.12, max: 9.0, unit: 'P-wave (g)', alertThreshold: 0.5, change: 'Stable', waveform: [0.1, 0.12, 0.11, 0.13, 0.12, 0.11, 0.14, 0.12, 0.13, 0.12] },
    { id: 's8', name: 'USGS Seismometer Bally', type: 'seismic', status: 'Normal', value: 0.18, max: 9.0, unit: 'P-wave (g)', alertThreshold: 0.5, change: 'Stable', waveform: [0.15, 0.18, 0.17, 0.19, 0.18, 0.16, 0.18, 0.17, 0.21, 0.18] }
  ];
};

export function PrimeStateProvider({ children }) {
  // Global React States synced with simulated values or local modifications
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [agencies, setAgencies] = useState(INITIAL_AGENCIES);
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [sensors, setSensors] = useState(generateInitialSensors());
  const [simActive, setSimActive] = useState(false);
  const [simStage, setSimStage] = useState(0);
  const [simLogs, setSimLogs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [mapZones, setMapZones] = useState([]);

  // Dynamic navigation states
  const [navGroup, setNavGroup] = useState('core');
  const [activeTab, setActiveTab] = useState('simulation');
  const [pillarSubTab, setPillarSubTab] = useState('sub1');
  
  // Custom manual road blockages list for MedEvac Planner
  const [roadBlockages, setRoadBlockages] = useState([
    { id: 'rb1', street: 'Kona Expressway Bypass', reason: 'Waterlogging - 1.5ft depth', coords: [22.5650, 88.3050] },
    { id: 'rb2', street: 'Bally Bridge Ingress Lane', reason: 'High Winds & Structural Alert', coords: [22.6280, 88.3280] }
  ]);

  // Synchronize with sessionStorage loops from NexusSimulator.js
  useEffect(() => {
    const syncWithSession = () => {
      const active = sessionStorage.getItem('sim_active') === 'true';
      const stage = parseInt(sessionStorage.getItem('sim_active_stage') || '0');
      setSimActive(active);
      setSimStage(stage);

      // Synced Logs
      try {
        const rawLogs = sessionStorage.getItem('sim_logs');
        if (rawLogs) setSimLogs(JSON.parse(rawLogs));
      } catch (e) {}

      // Synced Requests
      try {
        const rawReqs = sessionStorage.getItem('disaster_requests');
        if (rawReqs) setRequests(JSON.parse(rawReqs));
      } catch (e) {}

      // Synced Map Zones
      try {
        const rawZones = sessionStorage.getItem('map_zones');
        if (rawZones) setMapZones(JSON.parse(rawZones));
      } catch (e) {}

      // Adapt sensor values depending on simulation stage to make it feel alive!
      if (active) {
        setSensors(prev => {
          return prev.map(s => {
            if (s.type === 'river') {
              if (s.id === 's2') { // Howrah
                const nextVal = 2.2 + (stage * 0.2) + Math.random() * 0.05;
                return {
                  ...s,
                  value: parseFloat(nextVal.toFixed(2)),
                  status: nextVal > s.alertThreshold ? 'Danger' : 'Alert'
                };
              }
              if (s.id === 's1' && stage >= 2) { // Bally
                const nextVal = 1.9 + (stage * 0.15) + Math.random() * 0.05;
                return {
                  ...s,
                  value: parseFloat(nextVal.toFixed(2)),
                  status: nextVal > s.alertThreshold ? 'Danger' : 'Alert'
                };
              }
            } else if (s.type === 'rain') {
              if (s.id === 's4') { // New Town
                const nextVal = 45 + (stage * 12) + Math.random() * 3;
                return {
                  ...s,
                  value: parseFloat(nextVal.toFixed(1)),
                  status: 'Danger',
                  change: `+${(8 + stage * 1.5).toFixed(1)}`
                };
              }
            } else if (s.type === 'seismic') {
              // Add dynamic waveform vibration
              const nextWave = [...s.waveform.slice(1), parseFloat((Math.random() * 0.4).toFixed(2))];
              return {
                ...s,
                waveform: nextWave,
                value: nextWave[nextWave.length - 1]
              };
            }
            return s;
          });
        });
      }
    };

    syncWithSession();
    const interval = setInterval(syncWithSession, 1000); // 1hz sync
    return () => clearInterval(interval);
  }, [simStage]);

  // Periodic sensor ticker update for normal mode (non-simulated live feel)
  useEffect(() => {
    if (simActive) return;

    const sensorTicker = setInterval(() => {
      setSensors(prev => {
        return prev.map(s => {
          if (s.type === 'seismic') {
            const nextWave = [...s.waveform.slice(1), parseFloat((0.08 + Math.random() * 0.08).toFixed(2))];
            return {
              ...s,
              waveform: nextWave,
              value: nextWave[nextWave.length - 1]
            };
          }
          // Mild fluctuations
          const drift = (Math.random() - 0.5) * 0.05;
          const newVal = Math.max(0.1, s.value + drift);
          return {
            ...s,
            value: parseFloat(newVal.toFixed(2))
          };
        });
      });
    }, 3000);

    return () => clearInterval(sensorTicker);
  }, [simActive]);

  // Command center mission manipulation functions
  const addMission = (mission) => {
    setMissions(prev => [
      {
        id: `m_${Date.now()}`,
        time: 'Just now',
        column: 'Unassigned',
        assignedTo: null,
        ...mission
      },
      ...prev
    ]);
  };

  const updateMissionColumn = (id, column) => {
    setMissions(prev => prev.map(m => {
      if (m.id === id) {
        // Log event in simulation log if active
        const timestamp = new Date().toLocaleTimeString();
        const logMsg = `[INCIDENT] ${m.title} state updated to: ${column.toUpperCase()}.`;
        
        try {
          const rawLogs = sessionStorage.getItem('sim_logs') || '[]';
          const logs = JSON.parse(rawLogs);
          logs.push({ time: timestamp, text: logMsg });
          sessionStorage.setItem('sim_logs', JSON.stringify(logs));
        } catch (e) {}

        return { ...m, column, time: 'Just now' };
      }
      return m;
    }));
  };

  const assignMissionUnit = (id, unitName) => {
    setMissions(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, assignedTo: unitName };
      }
      return m;
    }));
  };

  // Hospital grid interactions
  const triagePatient = (hospitalId, severity) => {
    setHospitals(prev => prev.map(h => {
      if (h.id === hospitalId) {
        const nextBeds = Math.max(0, h.beds - 1);
        const nextTrauma = h.traumaBay.includes('Free') 
          ? `${Math.max(0, parseInt(h.traumaBay[0]) - 1)} Free`
          : h.traumaBay;
        return {
          ...h,
          beds: nextBeds,
          traumaBay: nextTrauma
        };
      }
      return h;
    }));
  };

  // Add a manual road blockage
  const addBlockage = (blockage) => {
    setRoadBlockages(prev => [
      {
        id: `rb_${Date.now()}`,
        ...blockage
      },
      ...prev
    ]);
  };

  // Cinematic simulation auto-navigation effect
  useEffect(() => {
    if (simActive) {
      if (simStage === 1 || simStage === 2) {
        // Stage 1-2: Alert the people! Switch to Citizen Safety Portal smartphone HUD alert feed
        setNavGroup('pillars');
        setActiveTab('citizen-portal');
        setPillarSubTab('sub1');
      } else if (simStage === 3 || simStage === 4) {
        // Stage 3-4: Dispatch and manage! Switch to Command Centre Mission Planner Kanban
        setNavGroup('pillars');
        setActiveTab('command-centre');
        setPillarSubTab('sub3'); // sub3 is Mission Planner Kanban
      } else if (simStage === 5) {
        // Stage 5: Triage patients to hospital beds! Hospital capacity grid
        setNavGroup('pillars');
        setActiveTab('medical-hub');
        setPillarSubTab('sub1'); // sub1 is Hospital grid
      } else if (simStage === 6 || simStage === 7) {
        // Stage 6-7: Analytics and Performance evaluations!
        setNavGroup('pillars');
        setActiveTab('analytics-nexus');
        setPillarSubTab('sub2'); // sub2 is Performance KPIs
      }
    } else {
      // When simulation is reset or inactive, stay on Simulation Tab inside Pillars category
      setNavGroup('pillars');
      setActiveTab('simulation');
    }
  }, [simActive, simStage]);

  // context payload
  const value = useMemo(() => ({
    hospitals,
    setHospitals,
    fleet,
    setFleet,
    agencies,
    setAgencies,
    missions,
    setMissions,
    sensors,
    setSensors,
    simActive,
    simStage,
    simLogs,
    requests,
    mapZones,
    roadBlockages,
    addBlockage,
    addMission,
    updateMissionColumn,
    assignMissionUnit,
    triagePatient,
    navGroup,
    setNavGroup,
    activeTab,
    setActiveTab,
    pillarSubTab,
    setPillarSubTab
  }), [hospitals, fleet, agencies, missions, sensors, simActive, simStage, simLogs, requests, mapZones, roadBlockages, navGroup, activeTab, pillarSubTab]);

  return (
    <PrimeStateContext.Provider value={value}>
      {children}
    </PrimeStateContext.Provider>
  );
}

export function usePrimeState() {
  const context = useContext(PrimeStateContext);
  if (!context) {
    throw new Error('usePrimeState must be used within a PrimeStateProvider');
  }
  return context;
}
