const SIM_BOAT_ROUTES = {
  25: { base: [22.5415, 88.3945], target: [22.5726, 88.3139] }, // Boat 1 -> Howrah
  26: { base: [22.5695, 88.4075], target: [22.5626, 88.3539] }, // Boat 2 -> Central
  27: { base: [22.6115, 88.4485], target: [22.6226, 88.3339] }, // Boat 3 -> Bally
  28: { base: [22.5865, 88.4535], target: [22.6026, 88.3639] }, // Boat 4 -> North Ave
  29: { base: [22.4995, 88.3695], target: [22.5226, 88.3339] }, // Boat 5 -> South City
  30: { base: [22.5385, 88.3975], target: [22.5326, 88.2839] }  // NDRF Squad -> Sankrail
};

const DEFAULT_INVENTORY = {
  'Salt Lake Stadium Relief Camp': { name: 'Stadium Relief Camp', water: 450, medical: 120, rations: 300, shelter: 80, maxWater: 1000, maxMedical: 500, maxRations: 1000, maxShelter: 200 },
  'Science City Mega Shelter': { name: 'Science City Mega Shelter', water: 1200, medical: 500, rations: 800, shelter: 200, maxWater: 2000, maxMedical: 1000, maxRations: 2000, maxShelter: 500 },
  'Rajarhat Evac Center': { name: 'Rajarhat Evac Center', water: 850, medical: 350, rations: 600, shelter: 150, maxWater: 1500, maxMedical: 800, maxRations: 1500, maxShelter: 300 },
  'New Town Action Area I Shelter': { name: 'New Town Action Area I Shelter', water: 900, medical: 400, rations: 700, shelter: 180, maxWater: 1500, maxMedical: 800, maxRations: 1500, maxShelter: 350 },
  'Jadavpur University Relief Camp': { name: 'Jadavpur University Relief Camp', water: 350, medical: 90, rations: 200, shelter: 50, maxWater: 800, maxMedical: 300, maxRations: 800, maxShelter: 150 }
};

const SILENT_ZONES = [
  { id: 'nw', name: 'Bally', pos: [22.6226, 88.3339], radius: 1400, severity: 0.0, forecast: 0.0 },
  { id: 'w', name: 'Howrah', pos: [22.5726, 88.3139], radius: 1600, severity: 0.0, forecast: 0.0 },
  { id: 'sw', name: 'Sankrail', pos: [22.5326, 88.2839], radius: 1800, severity: 0.0, forecast: 0.0 },
  { id: 'n', name: 'North Avenue', pos: [22.6026, 88.3639], radius: 1500, severity: 0.0, forecast: 0.0 },
  { id: 'c', name: 'Central Station', pos: [22.5626, 88.3539], radius: 1200, severity: 0.0, forecast: 0.0 },
  { id: 's', name: 'South City', pos: [22.5226, 88.3339], radius: 1500, severity: 0.0, forecast: 0.0 },
  { id: 'e', name: 'Salt Lake', pos: [22.5850, 88.4200], radius: 2200, severity: 0.0, forecast: 0.0 },
  { id: 'se', name: 'Sector 4 Area', pos: [22.5126, 88.4039], radius: 1800, severity: 0.0, forecast: 0.0 }
];

class NexusSimulatorEngine {
  constructor() {
    this.timer = null;
    this.boatTimer = null;
    this.secondsInStage = 0;
    this.currentStage = 0;
  }

  init() {
    // Check if simulation was already active in background
    const active = sessionStorage.getItem('sim_active') === 'true';
    const isRunning = sessionStorage.getItem('sim_is_running') === 'true';
    if (active && isRunning) {
      this.currentStage = parseInt(sessionStorage.getItem('sim_active_stage') || '0');
      this.secondsInStage = parseInt(sessionStorage.getItem('sim_seconds_in_stage') || '0');
      this.resume();
    }
  }

  addLog(text) {
    const rawLogs = sessionStorage.getItem('sim_logs') || '[]';
    let logs = [];
    try {
      logs = JSON.parse(rawLogs);
    } catch (e) {
      logs = [];
    }
    const timeStr = new Date().toLocaleTimeString();
    logs.push({ time: timeStr, text });
    sessionStorage.setItem('sim_logs', JSON.stringify(logs));
  }

  // EAS 1999 Two-Tone Attention Signal (853Hz + 960Hz blend, 8 seconds)
  playSiren() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // EAS standard uses an 8-second two-tone alert: 853Hz and 960Hz mixed together
      const frequencies = [853, 960];
      const duration = 8; // seconds
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
      // Fade out in last 0.5s to avoid click
      gainNode.gain.setValueAtTime(0.35, ctx.currentTime + duration - 0.5);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      gainNode.connect(ctx.destination);

      frequencies.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(gainNode);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      });

      // Auto-close context after tone ends
      setTimeout(() => {
        try { ctx.close(); } catch (e) {}
      }, (duration + 0.5) * 1000);

    } catch (e) {
      console.warn('[EAS] Audio context unavailable for siren playback:', e);
    }
  }

  reset() {
    if (this.timer) clearInterval(this.timer);
    if (this.boatTimer) clearInterval(this.boatTimer);
    this.timer = null;
    this.boatTimer = null;
    this.secondsInStage = 0;
    this.currentStage = 0;

    sessionStorage.setItem('sim_active', 'false');
    sessionStorage.setItem('sim_is_running', 'false');
    sessionStorage.setItem('sim_active_stage', '0');
    sessionStorage.setItem('sim_seconds_in_stage', '0');
    sessionStorage.setItem('sachet_authorized', 'false');
    sessionStorage.setItem('sachet_active_alert', 'null');
    sessionStorage.setItem('disaster_requests', JSON.stringify([]));

    // Initialize Boat 25 coordinate (for vision HUD) and the full multi-boat positions object
    sessionStorage.setItem('sim_boat_pos', JSON.stringify(SIM_BOAT_ROUTES['25'].base));
    const initialPositions = {};
    Object.keys(SIM_BOAT_ROUTES).forEach(id => {
      initialPositions[id] = SIM_BOAT_ROUTES[id].base;
    });
    sessionStorage.setItem('sim_boat_positions', JSON.stringify(initialPositions));

    sessionStorage.setItem('sim_boat_percent', '0');
    sessionStorage.setItem('shelter_inventory', JSON.stringify(DEFAULT_INVENTORY));
    sessionStorage.setItem('map_zones', JSON.stringify(SILENT_ZONES));
    sessionStorage.setItem('ble_synced', 'false');

    const resetMsg = 'System reset. All tabs restored to inactive, clean standby state.';
    const timeStr = new Date().toLocaleTimeString();
    sessionStorage.setItem('sim_logs', JSON.stringify([{ time: timeStr, text: resetMsg }]));
  }

  start() {
    this.reset();
    sessionStorage.setItem('sim_active', 'true');
    sessionStorage.setItem('sim_is_running', 'true');
    sessionStorage.setItem('sim_active_stage', '1');
    sessionStorage.setItem('sim_seconds_in_stage', '0');

    this.currentStage = 1;
    this.secondsInStage = 0;

    this.addLog('CRITICAL STATE TRIGGERED: Simulation Monsoon Drill launched.');
    this.addLog('STAGE 1 [Flood Ingress]: Storm fronts closing in. Sourcing satellite precipitation telemetry.');

    this.resume();
  }

  resume() {
    if (this.timer) clearInterval(this.timer);

    // Resume boat animation if active
    if (this.currentStage === 4) {
      const pct = parseFloat(sessionStorage.getItem('sim_boat_percent') || '0');
      this.resumeBoatAnimate(pct / 100);
    }

    this.timer = setInterval(() => {
      this.secondsInStage++;
      sessionStorage.setItem('sim_seconds_in_stage', this.secondsInStage.toString());

      // STAGE 1: Flood Ingress
      if (this.currentStage === 1) {
        let zones = [];
        try {
          zones = JSON.parse(sessionStorage.getItem('map_zones') || '[]');
        } catch (e) {
          zones = SILENT_ZONES;
        }

        if (this.secondsInStage === 1) {
          this.addLog('[TELEM] River gauges reading +1.2m in North sectors.');
          const updated = zones.map(z =>
            z.id === 'nw' ? { ...z, severity: 0.85 } : z.id === 'n' ? { ...z, severity: 0.80 } : z
          );
          sessionStorage.setItem('map_zones', JSON.stringify(updated));
          this.addLog('[GIS] Severe flooding detected in Bally Sector & North Avenue.');
        }
        else if (this.secondsInStage === 4) {
          this.addLog('[TELEM] Floodfront advancing. Gauges reading +1.8m in Central sectors.');
          const updated = zones.map(z =>
            z.id === 'nw' ? { ...z, severity: 0.85 } : z.id === 'n' ? { ...z, severity: 0.80 } :
              z.id === 'w' ? { ...z, severity: 0.95 } : z.id === 'c' ? { ...z, severity: 0.70 } : z
          );
          sessionStorage.setItem('map_zones', JSON.stringify(updated));
          this.addLog('[GIS] Extreme water surge logged at Howrah Station & Central Station.');
        }
        else if (this.secondsInStage === 8) {
          this.addLog('[TELEM] Gauges spiking in South sectors (+2.3m). West bank fully submerged.');
          const updated = zones.map(z =>
            z.id === 'nw' ? { ...z, severity: 0.85 } : z.id === 'n' ? { ...z, severity: 0.80 } :
              z.id === 'w' ? { ...z, severity: 0.95 } : z.id === 'c' ? { ...z, severity: 0.70 } :
                z.id === 'sw' ? { ...z, severity: 0.90 } : z.id === 's' ? { ...z, severity: 0.75 } : z
          );
          sessionStorage.setItem('map_zones', JSON.stringify(updated));
          this.addLog('[GIS] Ingress complete. Bally, Howrah, Sankrail, North, Central and South City heavily flooded.');
        }

        if (this.secondsInStage >= 10) {
          this.currentStage = 2;
          this.secondsInStage = 0;
          sessionStorage.setItem('sim_active_stage', '2');
          sessionStorage.setItem('sim_seconds_in_stage', '0');
          this.addLog('STAGE 2 [EAS Cell Broadcast]: Emergency translations compiled in English, Hindi, and Bengali.');
          this.addLog('[GEMINI AI] Synthesizing alerts... Operator authorization requested.');
        }
      }

      // STAGE 2: EAS Alert Authorize Waiter
      else if (this.currentStage === 2) {
        const auth = sessionStorage.getItem('sachet_authorized') === 'true';
        const authorizedAlert = sessionStorage.getItem('sim_authorized_alert') === 'true';
        if (auth && !authorizedAlert) {
          sessionStorage.setItem('sim_authorized_alert', 'true');
          this.addLog('SUCCESS: SACHET Cell Broadcast authorized by Operator.');
          this.addLog('[SAME FSK] Broadcasting 1999 Pan-EAS Attention Header frequencies...');
          this.addLog('[SMS] Warning waves dispatched to 317,200 civilian smartphones.');
          sessionStorage.setItem('sachet_siren_pending', 'true');
        }

        if (this.secondsInStage >= 10) {
          if (!auth) {
            sessionStorage.setItem('sachet_authorized', 'true');
            sessionStorage.setItem('sim_authorized_alert', 'true');
            const alertText = {
              eng: "Severe flood warning for sector. Water level expected to rise 2 meters. Evacuate immediately.",
              hindi: "बाढ़ की चेतावनी: जल स्तर 2 मीटर बढ़ने की आशंका है। कृपया तुरंत सुरक्षित स्थान पर जाएं।",
              bengali: "জরুরী বন্যার সতর্কতা: জলের স্তর ২ মিটার বৃদ্ধি পেতে পারে। অবিলম্বে নিরাপদ স্থানে আশ্রয় নিন。"
            };
            sessionStorage.setItem('sachet_active_alert', JSON.stringify(alertText));
            sessionStorage.setItem('sachet_siren_pending', 'true');
            this.addLog('[AUTO] Broadcast authorized automatically by Sentinel AI fallback.');
            this.addLog('[SMS] Multilingual cell alerts pushed successfully.');
          }

          this.currentStage = 3;
          this.secondsInStage = 0;
          sessionStorage.setItem('sim_active_stage', '3');
          sessionStorage.setItem('sim_seconds_in_stage', '0');
          this.addLog('STAGE 3 [Drone Recon Sweep]: Launching UAV Drone Search Fleet.');
          this.addLog('[UAV-01] Deploying camera feeds. Activating infrared thermal sweep...');
        }
      }

      // STAGE 3: Drone Scanning
      else if (this.currentStage === 3) {
        if (this.secondsInStage === 3) {
          this.addLog('[UAV-01] Sonar scanner locking onto structural anomalies...');
        }
        else if (this.secondsInStage === 6) {
          this.addLog('[UAV-01] Stranded civilians detected at Howrah Sector (22.5726N, 88.3139E).');
          this.addLog('[UAV-01] Telemetry matches logged profiles: Amina Bibi, Subir Roy, Rajesh Kisku.');
        }

        if (this.secondsInStage >= 10) {
          this.currentStage = 4;
          this.secondsInStage = 0;
          sessionStorage.setItem('sim_active_stage', '4');
          sessionStorage.setItem('sim_seconds_in_stage', '0');
          this.addLog('STAGE 4 [Tactical Boat Dispatch]: Injecting survivors into the Operations Queue.');

          const survivors = [
            {
              id: 101,
              name: "Amina Bibi",
              age: "42",
              gender: "Female",
              disease: "Severe Dehydration & Waterborne Shock",
              resource: "Rescue Boat",
              priority: 1,
              description: "Drone telemetry confirms victim isolated on rooftop. Critical dehydration threat.",
              status: "pending",
              rescueTimeLimit: 30,
              time: Date.now(),
              location: "Howrah"
            },
            {
              id: 102,
              name: "Subir Roy",
              age: "35",
              gender: "Male",
              disease: "Compound Leg Fracture",
              resource: "Rescue Boat",
              priority: 1,
              description: "Drone visual logs crush injury under load-bearing concrete slab.",
              status: "pending",
              rescueTimeLimit: 30,
              time: Date.now(),
              location: "Howrah"
            },
            {
              id: 103,
              name: "Rajesh Kisku",
              age: "28",
              gender: "Male",
              disease: "Acute Inundation Fever",
              resource: "Rescue Boat",
              priority: 2,
              description: "High core temp logged via UAV thermal FLIR optics.",
              status: "pending",
              rescueTimeLimit: 30,
              time: Date.now(),
              location: "Howrah"
            }
          ];
          sessionStorage.setItem('disaster_requests', JSON.stringify(survivors));
          this.addLog('[DISPATCH] Rescue Boat Fleet authorized: 6 units dispatched simultaneously from their safe docked shelters.');

          // Launch physical boat glide movement
          this.resumeBoatAnimate(0);
        }
      }

      // STAGE 4: Boat Navigation
      else if (this.currentStage === 4) {
        if (this.secondsInStage === 4) {
          this.addLog('[NAV] Active rescue fleet at 35% course. Entering fast river currents.');
        }
        else if (this.secondsInStage === 10) {
          this.addLog('[NAV] Fleet arrived at flooded target sectors. Commencing citizen extraction.');
        }
        else if (this.secondsInStage === 14) {
          this.addLog('[NAV] All stranded survivors successfully boarded. Fleet navigating back to safe shelter bases.');
        }

        if (this.secondsInStage >= 20) {
          this.currentStage = 5;
          this.secondsInStage = 0;
          sessionStorage.setItem('sim_active_stage', '5');
          sessionStorage.setItem('sim_seconds_in_stage', '0');
          this.addLog('STAGE 5 [BLE Handshake Check-In]: All 6 rescue boats docked back safely at their shelter bases.');
          this.addLog('[BLE] Initializing local Bluetooth pairing handshake to log medical triage statistics.');
        }
      }

      // STAGE 5: BLE Registration
      else if (this.currentStage === 5) {
        if (this.secondsInStage === 3) {
          this.addLog('[BLE] Connecting... Reading civilian MAC IDs...');
        }
        else if (this.secondsInStage === 6) {
          sessionStorage.setItem('ble_synced', 'true');
          const reqs = JSON.parse(sessionStorage.getItem('disaster_requests') || '[]');
          const resolved = reqs.map(r => ({ ...r, status: 'dispatched', dispatchTime: Date.now() - 5000 }));
          sessionStorage.setItem('disaster_requests', JSON.stringify(resolved));
          this.addLog('[BLE] Sync successful. Amina Bibi, Subir Roy, and Rajesh Kisku verified & registered.');
        }

        if (this.secondsInStage >= 10) {
          this.currentStage = 6;
          this.secondsInStage = 0;
          sessionStorage.setItem('sim_active_stage', '6');
          sessionStorage.setItem('sim_seconds_in_stage', '0');
          this.addLog('STAGE 6 [Analytics Spike]: Triage logs propagated to Data Analytics graphs.');
          this.addLog('[AI] Prioritizing saline pipelines, ration drawdowns, and medical kits.');
        }
      }

      // STAGE 6: Analytics Chart Sync
      else if (this.currentStage === 6) {
        if (this.secondsInStage === 5) {
          this.addLog('[ANALYTICS] Medical drawdown spike loaded. Rations count sinking.');
        }

        if (this.secondsInStage >= 10) {
          this.currentStage = 7;
          this.secondsInStage = 0;
          sessionStorage.setItem('sim_active_stage', '7');
          sessionStorage.setItem('sim_seconds_in_stage', '0');
          this.addLog('STAGE 7 [Logistics Supply Audit]: Potable water & medical stock depleting at Science City Mega Shelter.');
          this.addLog('[LOGISTICS] Sinking to yellow warning levels. Predictive supply advisory compiled.');

          // Spike depletion
          const inv = JSON.parse(sessionStorage.getItem('shelter_inventory') || '{}');
          if (inv['Science City Mega Shelter']) {
            inv['Science City Mega Shelter'].water = 240;
            inv['Science City Mega Shelter'].medical = 40;
            inv['Science City Mega Shelter'].rations = 110;
            sessionStorage.setItem('shelter_inventory', JSON.stringify(inv));
          }

          // Trigger advisory reallocations - Finish simulation
          clearInterval(this.timer);
          this.timer = null;
          sessionStorage.setItem('sim_is_running', 'false');
        }
      }
    }, 1000);
  }

  interpolateCoords(start, end, pct) {
    const lat = start[0] + (end[0] - start[0]) * pct;
    const lng = start[1] + (end[1] - start[1]) * pct;
    return [lat, lng];
  }

  resumeBoatAnimate(startPct) {
    if (this.boatTimer) clearInterval(this.boatTimer);

    let tick = Math.round(startPct * 200); // 20 seconds total = 200 ticks at 100ms/tick

    this.boatTimer = setInterval(() => {
      tick++;
      const currentPositions = {};

      if (tick <= 80) {
        // Phase 1: Transit to disaster targets (0s - 8s)
        const pct = tick / 80;
        Object.keys(SIM_BOAT_ROUTES).forEach(id => {
          const route = SIM_BOAT_ROUTES[id];
          currentPositions[id] = this.interpolateCoords(route.base, route.target, pct);
        });
        sessionStorage.setItem('sim_boat_positions', JSON.stringify(currentPositions));
        sessionStorage.setItem('sim_boat_pos', JSON.stringify(currentPositions['25'])); // backwards compatibility for Boat 25 Vision HUD
        sessionStorage.setItem('sim_boat_percent', Math.round(pct * 50).toString());
      } else if (tick <= 120) {
        // Phase 2: Stranded civilian extraction at targets (8s - 12s)
        Object.keys(SIM_BOAT_ROUTES).forEach(id => {
          currentPositions[id] = SIM_BOAT_ROUTES[id].target;
        });
        sessionStorage.setItem('sim_boat_positions', JSON.stringify(currentPositions));
        sessionStorage.setItem('sim_boat_pos', JSON.stringify(currentPositions['25']));
        sessionStorage.setItem('sim_boat_percent', '50');
      } else if (tick <= 200) {
        // Phase 3: Transit back to safe shelter bases (12s - 20s)
        const pct = (tick - 120) / 80;
        Object.keys(SIM_BOAT_ROUTES).forEach(id => {
          const route = SIM_BOAT_ROUTES[id];
          currentPositions[id] = this.interpolateCoords(route.target, route.base, pct);
        });
        sessionStorage.setItem('sim_boat_positions', JSON.stringify(currentPositions));
        sessionStorage.setItem('sim_boat_pos', JSON.stringify(currentPositions['25']));
        sessionStorage.setItem('sim_boat_percent', Math.round(50 + pct * 50).toString());
      } else {
        // Rescue operation completed, docked back at bases
        clearInterval(this.boatTimer);
        this.boatTimer = null;
        Object.keys(SIM_BOAT_ROUTES).forEach(id => {
          currentPositions[id] = SIM_BOAT_ROUTES[id].base;
        });
        sessionStorage.setItem('sim_boat_positions', JSON.stringify(currentPositions));
        sessionStorage.setItem('sim_boat_pos', JSON.stringify(currentPositions['25']));
        sessionStorage.setItem('sim_boat_percent', '100');
      }
    }, 100); // smooth 10 frames per second
  }
}

// Attach singleton to window immediately upon load
if (typeof window !== 'undefined') {
  window.NexusSimulator = new NexusSimulatorEngine();
  window.NexusSimulator.init();
}

export default NexusSimulatorEngine;
