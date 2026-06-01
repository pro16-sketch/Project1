# Disaster Alert System — Full Platform Implementation Plan

> **Current state:** DisasterResponse Nexus is a 6-component React dashboard (Leaflet maps, Recharts analytics, AI triage queue, supply chain HUD, drone vision, SACHET broadcast) wired together via `sessionStorage`.
>
> **Goal:** Evolve it into a *production-grade, full-stack disaster intelligence platform* — the kind of system that would be deployed at a real State Emergency Operations Centre.

---

## Vision

```
┌─────────────────────────────────────────────────────────┐
│           DISASTER ALERT SYSTEM — NEXUS PRIME           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ PREDICT  │  │ DETECT   │  │ RESPOND  │  │ INFORM │  │
│  │  AI Risk │  │ Live IoT │  │ Dispatch │  │ Public │  │
│  │  Models  │  │ Sensors  │  │ Coord.   │  │ Portal │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└─────────────────────────────────────────────────────────┘
```

The platform operates across **four operational layers**:
- **Predict** — AI-powered risk forecasting before disaster strikes
- **Detect** — Real-time sensor and satellite data ingestion
- **Respond** — Multi-agency coordination, dispatch, and resource management
- **Inform** — Public-facing citizen portal + multi-channel alert broadcasting

---

## Open Questions for User Review

> [!IMPORTANT]
> **Backend Decision:** The current app is 100% client-side. A full platform needs persistent data. Which backend do you prefer?
> - Option A: **Firebase** (zero-config, real-time DB, Auth — fastest to implement)
> - Option B: **Supabase** (PostgreSQL, open-source, more powerful queries)
> - Option C: **Keep client-only** with advanced localStorage/IndexedDB (demo-grade only)

> [!IMPORTANT]
> **Map Data Source:** Should the system use real IoT sensor APIs (OpenWeatherMap, USGS earthquake feeds, India Flood forecasting APIs from CWC), or should all sensor data be realistically simulated?

> [!WARNING]
> **Scope Phasing:** This plan is split into 3 build phases (Alpha, Beta, Release). Do you want to build all phases consecutively or focus on one at a time?

---

## Proposed Pillars & Features

---

### Pillar 1 — Predictive AI Risk Engine (`RiskEngine/`)
> *Know what's coming before it arrives.*

#### [NEW] `src/components/RiskEngine/RiskDashboard.jsx`
A full-screen AI risk command panel that visualises predicted disaster probability over the next 6/24/72 hours.

**Features:**
- **Flood Risk Predictor:** Ingests live river gauge data from India's Central Water Commission (CWC) API + OpenWeatherMap precipitation forecasts. Feeds to a Gemini prompt that outputs a structured 5-zone flood risk score (0–100) per geographic sector.
- **Fire Weather Index:** Computes FWI (Fire Weather Index) using temperature, wind, humidity, and drought code from weather APIs. Renders a live animated heatmap overlay on the Leaflet map.
- **Earthquake Aftershock Probability:** Reads USGS Earthquake feed and applies a Gutenberg-Richter model to estimate aftershock risk in the next 24h.
- **AI Compound Risk Score:** Gemini synthesises all active risk signals (flood + fire + seismic) into a single compound threat briefing with tactical priority rankings.
- **Risk Timeline Chart:** Recharts `AreaChart` showing predicted risk curve across 72 hours with historical event overlays.

#### [NEW] `src/components/RiskEngine/SensorFeed.jsx`
Live feed ticker of incoming sensor data events (river level readings, rain gauge triggers, seismic P-wave detections). Updates every 30 seconds from real APIs.

---

### Pillar 2 — Live Sensor & Satellite Ingestion (`SensorHub/`)
> *Ground truth from the field, not just assumptions.*

#### [NEW] `src/components/SensorHub/SensorMap.jsx`
An enhanced Leaflet map layer that renders live sensor node markers:
- **River Gauges** — colour-coded by water level (normal/alert/danger/emergency)
- **Rain Gauges** — rendered as animated radial pulse markers when precipitation exceeds thresholds
- **NDVI Satellite Tiles** — toggleable WMS tile layer showing vegetation stress as a fire-risk indicator
- **Air Quality Index nodes** — smoke/particulate monitors, critical for fire and industrial events
- **Seismic Stations** — mini waveform sparklines on click

#### [NEW] `src/components/SensorHub/SatelliteViewer.jsx`
Integrates with **Copernicus Emergency Management Service** and **Sentinel Hub** public APIs to display:
- Pre-event reference imagery
- Post-event damage extent satellite imagery (SAR / Optical)
- Flooded area extent polygon overlays automatically computed from NDWI band math

---

### Pillar 3 — Multi-Agency Command Centre (`CommandCentre/`)
> *One screen for every responder in the field.*

#### [NEW] `src/components/CommandCentre/AgencyBoard.jsx`
A mission-control style status board showing all active agencies:

| Agency | Units Deployed | Status | Last Ping |
|--------|---------------|--------|-----------|
| NDRF Battalion 2 | 4 teams | Active | 2m ago |
| State Fire & Emergency | 12 engines | Standby | 5m ago |
| Coast Guard Eastern | 3 boats | En Route | 1m ago |

- Real-time unit position tracking via simulated GPS telemetry (WebSocket stream)
- Click any unit to open a side panel with their current mission, team lead, comms channel
- **AI Mission Briefing Generator:** One click generates a structured tactical briefing document for any agency using Gemini (formatted as a proper military SMEAC briefing)

#### [NEW] `src/components/CommandCentre/IncidentLog.jsx`
A timestamped, searchable operational log of all system events:
- Sensor threshold breaches
- AI alerts generated
- Resources dispatched
- Broadcasts sent
- Manual operator annotations

Exportable as PDF with a single click (using browser `window.print()` with a styled print stylesheet — zero dependencies).

#### [NEW] `src/components/CommandCentre/MissionPlanner.jsx`
Drag-and-drop mission planning board (Kanban-style):
- **Columns:** `Unassigned → Briefing → En Route → Active → Completed`
- Cards represent incident response missions
- Drag to update status, auto-logs the transition timestamp
- Gemini generates the optimal mission assignment given current resources and incident severity

---

### Pillar 4 — Hospital & Medical Capacity Hub (`MedicalHub/`)
> *Match the wounded to the ward before the ambulance rolls.*

#### [NEW] `src/components/MedicalHub/HospitalGrid.jsx`
Live capacity grid for all hospitals in the operational zone:

```
┌──────────────────┬──────┬──────┬────────┬────────────┐
│ Hospital         │ Beds │ ICU  │ Blood  │ Trauma Bay │
├──────────────────┼──────┼──────┼────────┼────────────┤
│ SSKM (Govt)      │ 847  │  12  │ O+ Low │ 3 Free     │
│ RG Kar Medical   │ 412  │   4  │ B+ OK  │ 1 Free     │
│ Apollo Hospitals │ 216  │   8  │ All OK │ 2 Free     │
└──────────────────┴──────┴──────┴────────┴────────────┘
```

- Colour-coded capacity bars (green/amber/red)
- Gemini triage routing: Given victim condition + injury type, recommends the optimal hospital with estimated travel time

#### [NEW] `src/components/MedicalHub/MedEvacPlanner.jsx`
- Interactive map of ambulance/helicopter routing
- Displays current road blockages (from manual operator inputs or automated flood zone overlay)
- AI-suggests alternate evac routes around blocked corridors

---

### Pillar 5 — Autonomous Vehicle & Fleet Dispatch (`FleetDispatch/`)
> *The right resource to the right place in the right time.*

#### [NEW] `src/components/FleetDispatch/FleetMap.jsx`
Live animated map of all response vehicles:
- Rescue boats shown with animated trail on water polygons
- Fire engines with speed-proportional animation
- Helicopters with altitude indicator badge
- Each vehicle card shows: crew count, fuel %, payload capacity, ETA to incident

#### [NEW] `src/components/FleetDispatch/DispatchAI.jsx`
AI-powered dispatch optimisation panel:
- Input: Active incidents (from RequestsTab) + Available fleet (from FleetMap)
- **Gemini Dispatch Engine:** Solves a vehicle-routing problem — which vehicle to send where to minimise total response time across all active incidents simultaneously
- Output: Ranked dispatch orders with one-click confirmation
- **Conflict detection:** Warns if two incidents are simultaneously requesting the same vehicle

---

### Pillar 6 — Citizen Safety Portal (`CitizenPortal/`)
> *Empower the public, not just the responders.*

#### [NEW] `src/components/CitizenPortal/PublicAlertFeed.jsx`
A public-facing alert feed (styled differently — clean, non-technical, mobile-first):
- Shows active warnings sorted by severity
- Plain-language descriptions of each alert (no jargon)
- Links to nearest shelter with address and capacity remaining
- Real-time countdown timer for weather windows ("Storm arrives in 4h 22m")

#### [NEW] `src/components/CitizenPortal/ShelterFinder.jsx`
Interactive shelter locator map for civilians:
- Shows open shelters with walking/driving distance from user's estimated location
- Capacity bars (crowded/available)
- Accessibility flags (wheelchair, medical aid, pet-friendly)
- Share location button to request rescue directly from the citizen interface

#### [NEW] `src/components/CitizenPortal/SafetyChecklist.jsx`
Gemini-powered dynamic checklist generator:
- User enters: location + disaster type + family size
- Gemini outputs a personalised emergency preparedness checklist
- Downloadable as PDF via browser print

---

### Pillar 7 — Advanced Analytics & After-Action (`Analytics/`)
> *Learn from every event to respond better next time.*

#### [NEW] `src/components/Analytics/EventTimeline.jsx`
Full event timeline replay for any past incident:
- Scrub through the timeline and see the map, resources, and alerts as they were at each moment
- Highlights decision points: when was the first alert? When was the first dispatch? Was there a delay?

#### [NEW] `src/components/Analytics/PerformanceKPI.jsx`
Dashboard of response performance KPIs:
- **MFRT** (Mean First Response Time)
- **Casualty Reduction Index**
- **Broadcast Reach Rate** (% of citizens reached by alert)
- **Supply Chain Efficiency** (% of TTD warnings that triggered a transfer in time)

#### [NEW] `src/components/Analytics/AIDebriefing.jsx`
Post-event Gemini AI debrief:
- Feeds the full incident log to Gemini
- Outputs a structured After-Action Report: what went well, what delayed response, tactical recommendations for next time

---

## Proposed File Structure

```
src/
├── App.jsx                         ← Add new nav sections
├── App.css
├── components/
│   ├── MapTab.jsx                  ← Enhance with sensor overlays
│   ├── GraphsTab.jsx               ← Supply chain (existing)
│   ├── RequestsTab.jsx             ← Triage queue (existing)
│   ├── VisionTab.jsx               ← Drone HUD (existing)
│   ├── BroadcastTab.jsx            ← SACHET alerts (existing)
│   ├── NexusChat.jsx               ← AI assistant (existing)
│   │
│   ├── RiskEngine/                 ← [NEW] Pillar 1
│   │   ├── RiskDashboard.jsx
│   │   └── SensorFeed.jsx
│   │
│   ├── SensorHub/                  ← [NEW] Pillar 2
│   │   ├── SensorMap.jsx
│   │   └── SatelliteViewer.jsx
│   │
│   ├── CommandCentre/              ← [NEW] Pillar 3
│   │   ├── AgencyBoard.jsx
│   │   ├── IncidentLog.jsx
│   │   └── MissionPlanner.jsx
│   │
│   ├── MedicalHub/                 ← [NEW] Pillar 4
│   │   ├── HospitalGrid.jsx
│   │   └── MedEvacPlanner.jsx
│   │
│   ├── FleetDispatch/              ← [NEW] Pillar 5
│   │   ├── FleetMap.jsx
│   │   └── DispatchAI.jsx
│   │
│   ├── CitizenPortal/              ← [NEW] Pillar 6
│   │   ├── PublicAlertFeed.jsx
│   │   ├── ShelterFinder.jsx
│   │   └── SafetyChecklist.jsx
│   │
│   └── Analytics/                 ← [NEW] Pillar 7
│       ├── EventTimeline.jsx
│       ├── PerformanceKPI.jsx
│       └── AIDebriefing.jsx
```

---

## Technical Architecture

### State Management Upgrade
Current `sessionStorage` pattern scales to ~10 keys. Full platform needs:
- **Event Bus pattern** (`useContext` + `useReducer`) for cross-component state
- **IndexedDB** (via native API, no package) for persisting large event logs locally
- Optional: **Firebase Realtime DB** for multi-operator live sync

### API Surface
| API | Purpose | Cost |
|-----|---------|------|
| Gemini 2.5 Flash | All AI features | Existing key |
| OpenWeatherMap | Weather + precipitation | Free tier |
| USGS Earthquake API | Seismic feeds | Free |
| CWC (India) | River gauge data | Free / NDAP |
| Sentinel Hub | Satellite imagery | Free trial |
| Open-Meteo | Forecast data | Free, no key |

### No New NPM Packages Required
All new features will use:
- **Native Web APIs** (IndexedDB, WebSockets, AudioContext, Canvas, WebGL)
- **Existing packages**: Recharts, Leaflet, Lucide React (already installed)
- **Gemini REST API** via direct `fetch` calls (existing pattern)

---

## Build Phases

### 🔴 Phase Alpha — Predict & Detect (Pillars 1 & 2)
*Deliverables: Risk Engine + Sensor Map fully interactive*
- RiskDashboard with Gemini compound threat briefing
- SensorFeed live ticker
- SensorMap with river/rain gauge overlays
- Satellite imagery viewer

### 🟡 Phase Beta — Respond (Pillars 3, 4 & 5)
*Deliverables: Full command centre, medical routing, fleet dispatch*
- AgencyBoard with unit tracking
- IncidentLog + PDF export
- MissionPlanner drag-drop Kanban
- HospitalGrid + MedEvac routing
- FleetMap animated dispatch + AI routing

### 🟢 Phase Release — Inform & Learn (Pillars 6 & 7)
*Deliverables: Citizen portal + analytics engine*
- PublicAlertFeed (separate view mode)
- ShelterFinder interactive map
- SafetyChecklist AI generator
- EventTimeline replay
- KPI dashboard + AI debrief

---

## Verification Plan

### Per-Pillar Testing
1. **Risk Engine:** Simulate a flood scenario — verify Gemini outputs a structured threat briefing, TTD draws from supply chain, and a SACHET alert is pre-populated.
2. **Sensor Hub:** Trigger a river gauge threshold breach — verify map marker changes colour and IncidentLog receives a new entry automatically.
3. **Command Centre:** Create a mission, drag it to "Active", verify the IncidentLog timestamps the state change and AI generates a SMEAC briefing.
4. **Medical Hub:** Submit a critical trauma case — verify Gemini routes to a hospital with available trauma bay, and the bed count decrements.
5. **Fleet Dispatch:** Post two simultaneous incidents — verify AI dispatch engine assigns non-conflicting vehicles and raises a conflict warning for shared resources.
6. **Citizen Portal:** Verify public alert feed shows plain-language warning within 2 seconds of SACHET broadcast being authorized.
7. **Analytics:** Replay a simulated incident — verify the timeline scrubber correctly reconstructs the map state at each checkpoint.

### Build Verification
- `npm run build` must pass with zero errors at the end of each phase
- All AI features must have local fallbacks (rules-based engines) so the system is usable offline
