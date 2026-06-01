import { useState } from 'react'
import './App.css'
import './utils/NexusSimulator'
import SimulationTab from './components/SimulationTab'
import MapTab from './components/MapTab'
import GraphsTab from './components/GraphsTab'
import RequestsTab from './components/RequestsTab'
import VisionTab from './components/VisionTab'
import BroadcastTab from './components/BroadcastTab'
import NexusChat from './components/NexusChat'

// Pillar 1 Imports
import RiskDashboard from './components/RiskEngine/RiskDashboard'
import SensorFeed from './components/RiskEngine/SensorFeed'

// Pillar 2 Imports
import SensorMap from './components/SensorHub/SensorMap'
import SatelliteViewer from './components/SensorHub/SatelliteViewer'

// Pillar 3 Imports
import AgencyBoard from './components/CommandCentre/AgencyBoard'
import IncidentLog from './components/CommandCentre/IncidentLog'
import MissionPlanner from './components/CommandCentre/MissionPlanner'

// Pillar 4 Imports
import HospitalGrid from './components/MedicalHub/HospitalGrid'
import MedEvacPlanner from './components/MedicalHub/MedEvacPlanner'

// Pillar 5 Imports
import FleetMap from './components/FleetDispatch/FleetMap'
import DispatchAI from './components/FleetDispatch/DispatchAI'

// Pillar 6 Imports
import PublicAlertFeed from './components/CitizenPortal/PublicAlertFeed'
import ShelterFinder from './components/CitizenPortal/ShelterFinder'
import SafetyChecklist from './components/CitizenPortal/SafetyChecklist'

// Pillar 7 Imports
import EventTimeline from './components/Analytics/EventTimeline'
import PerformanceKPI from './components/Analytics/PerformanceKPI'
import AIDebriefing from './components/Analytics/AIDebriefing'

import { usePrimeState } from './utils/PrimeState'

const PILLAR_LABELS = {
  'risk-engine': 'P1: Risk Engine',
  'sensor-hub': 'P2: Sensor Hub',
  'command-centre': 'P3: Command Centre',
  'medical-hub': 'P4: Medical Hub',
  'fleet-dispatch': 'P5: Fleet Dispatch',
  'citizen-portal': 'P6: Citizen Portal',
  'analytics-nexus': 'P7: Analytics'
};

function App() {
  const { navGroup, setNavGroup, activeTab, setActiveTab, pillarSubTab, setPillarSubTab } = usePrimeState();
  const [pillarDropdownOpen, setPillarDropdownOpen] = useState(false);

  const handleGroupChange = (group) => {
    setNavGroup(group)
    if (group === 'core') {
      setActiveTab('maps')
    } else {
      setActiveTab('risk-engine')
      setPillarSubTab('sub1')
    }
  }

  const handlePillarChange = (tabId) => {
    setActiveTab(tabId)
    setPillarSubTab('sub1')
  }

  return (
    <div className="app-container">
      <header className="app-header glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0 }}>DisasterResponse Nexus</h1>
          
          {/* Category Group Selector Switch */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '3px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => handleGroupChange('core')}
              style={{
                background: navGroup === 'core' ? 'rgba(0, 243, 255, 0.15)' : 'transparent',
                color: navGroup === 'core' ? '#fff' : 'rgba(255,255,255,0.5)',
                border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'var(--font-header)', fontSize: '11px', textTransform: 'uppercase', transition: 'all 0.3s'
              }}
            >
              Core Operations
            </button>
            <button
              onClick={() => handleGroupChange('pillars')}
              style={{
                background: navGroup === 'pillars' ? 'rgba(255, 0, 255, 0.15)' : 'transparent',
                color: navGroup === 'pillars' ? '#fff' : 'rgba(255,255,255,0.5)',
                border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'var(--font-header)', fontSize: '11px', textTransform: 'uppercase', transition: 'all 0.3s',
                boxShadow: navGroup === 'pillars' ? '0 0 10px rgba(255,0,255,0.2)' : 'none'
              }}
            >
              Nexus Prime Pillars
            </button>
          </div>
        </div>

        <div className="status-indicator">
          <span className="pulse"></span> System Online
        </div>
      </header>

      {/* Navigation Bars */}
      <nav className="tab-nav" style={{ flexWrap: 'wrap' }}>
        {navGroup === 'core' ? (
          <>
            <button
              className={`tab-btn ${activeTab === 'maps' ? 'active' : ''}`}
              onClick={() => setActiveTab('maps')}
            >
              Territory Maps
            </button>
            <button
              className={`tab-btn ${activeTab === 'graphs' ? 'active' : ''}`}
              onClick={() => setActiveTab('graphs')}
            >
              Data Analytics
            </button>
            <button
              className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Resource Queue
            </button>
            <button
              className={`tab-btn ${activeTab === 'vision' ? 'active' : ''}`}
              onClick={() => setActiveTab('vision')}
            >
              Drone Vision
            </button>
          </>
        ) : (
          <>
            <button
              className={`tab-btn ${activeTab === 'simulation' ? 'active' : ''}`}
              onClick={() => handlePillarChange('simulation')}
              style={{ borderColor: activeTab === 'simulation' ? 'var(--neon-magenta)' : '' }}
            >
              Simulation Deck
            </button>
            <button
              className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
              onClick={() => handlePillarChange('broadcast')}
              style={{ borderColor: activeTab === 'broadcast' ? 'var(--neon-magenta)' : '' }}
            >
              Cell Broadcast
            </button>
            
            {/* Consolidated Pillars Dropdown */}
            <div 
              style={{ position: 'relative', display: 'inline-block' }}
              onMouseLeave={() => setPillarDropdownOpen(false)}
            >
              <button
                className={`tab-btn ${PILLAR_LABELS[activeTab] ? 'active' : ''}`}
                onClick={() => setPillarDropdownOpen(!pillarDropdownOpen)}
                style={{ 
                  borderColor: PILLAR_LABELS[activeTab] ? 'var(--neon-magenta)' : '',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>{PILLAR_LABELS[activeTab] || 'Cognitive Pillars'}</span>
                <span style={{ 
                  fontSize: '10px', 
                  transition: 'transform 0.3s', 
                  transform: pillarDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-block'
                }}>▼</span>
              </button>
              
              {pillarDropdownOpen && (
                <div 
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    left: '0',
                    minWidth: '220px',
                    zIndex: 1000,
                    padding: '5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.8), var(--border-glow)',
                    background: 'rgba(5, 5, 16, 0.95)',
                    border: '1px solid var(--neon-magenta)',
                    animation: 'slideIn 0.2s ease-out',
                    borderRadius: '4px'
                  }}
                >
                  {Object.entries(PILLAR_LABELS).map(([tabId, label]) => (
                    <button
                      key={tabId}
                      onClick={() => {
                        handlePillarChange(tabId);
                        setPillarDropdownOpen(false);
                      }}
                      style={{
                        background: activeTab === tabId ? 'rgba(255, 0, 255, 0.15)' : 'transparent',
                        border: 'none',
                        color: activeTab === tabId ? '#fff' : 'var(--text-main)',
                        padding: '10px 15px',
                        textAlign: 'left',
                        fontFamily: 'var(--font-header)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        transition: 'all 0.2s',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        borderLeft: activeTab === tabId ? '3px solid var(--neon-magenta)' : '3px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 0, 255, 0.1)';
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = activeTab === tabId ? 'rgba(255, 0, 255, 0.15)' : 'transparent';
                        e.target.style.color = activeTab === tabId ? '#fff' : 'var(--text-main)';
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* Subtab Navigation inside Cognitive Pillars */}
      {navGroup === 'pillars' && (
        <div style={{ display: 'flex', gap: '8px', padding: '0 5px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
          {activeTab === 'risk-engine' && (
            <>
              <button onClick={() => setPillarSubTab('sub1')} style={{ background: pillarSubTab === 'sub1' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub1' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Risk Dashboard</button>
              <button onClick={() => setPillarSubTab('sub2')} style={{ background: pillarSubTab === 'sub2' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub2' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Sensor Telemetry Ticker</button>
            </>
          )}
          {activeTab === 'sensor-hub' && (
            <>
              <button onClick={() => setPillarSubTab('sub1')} style={{ background: pillarSubTab === 'sub1' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub1' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Geospatial Sensor Map</button>
              <button onClick={() => setPillarSubTab('sub2')} style={{ background: pillarSubTab === 'sub2' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub2' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Sentinel Satellite Imagery</button>
            </>
          )}
          {activeTab === 'command-centre' && (
            <>
              <button onClick={() => setPillarSubTab('sub1')} style={{ background: pillarSubTab === 'sub1' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub1' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Squad Deployment Grid</button>
              <button onClick={() => setPillarSubTab('sub2')} style={{ background: pillarSubTab === 'sub2' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub2' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Chronological Incident Log</button>
              <button onClick={() => setPillarSubTab('sub3')} style={{ background: pillarSubTab === 'sub3' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub3' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Tactical Mission Planner</button>
            </>
          )}
          {activeTab === 'medical-hub' && (
            <>
              <button onClick={() => setPillarSubTab('sub1')} style={{ background: pillarSubTab === 'sub1' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub1' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Hospital Capacity Grid</button>
              <button onClick={() => setPillarSubTab('sub2')} style={{ background: pillarSubTab === 'sub2' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub2' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Road Closures Evac Planner</button>
            </>
          )}
          {activeTab === 'fleet-dispatch' && (
            <>
              <button onClick={() => setPillarSubTab('sub1')} style={{ background: pillarSubTab === 'sub1' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub1' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Fleet Tracker HUD</button>
              <button onClick={() => setPillarSubTab('sub2')} style={{ background: pillarSubTab === 'sub2' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub2' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>AI Dispatch Optimization</button>
            </>
          )}
          {activeTab === 'citizen-portal' && (
            <>
              <button onClick={() => setPillarSubTab('sub1')} style={{ background: pillarSubTab === 'sub1' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub1' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Public Alert smartphone HUD</button>
              <button onClick={() => setPillarSubTab('sub2')} style={{ background: pillarSubTab === 'sub2' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub2' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Civilian Shelter Finder</button>
              <button onClick={() => setPillarSubTab('sub3')} style={{ background: pillarSubTab === 'sub3' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub3' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Pre-staging Checklist Advisor</button>
            </>
          )}
          {activeTab === 'analytics-nexus' && (
            <>
              <button onClick={() => setPillarSubTab('sub1')} style={{ background: pillarSubTab === 'sub1' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub1' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Event Scrub Timeline</button>
              <button onClick={() => setPillarSubTab('sub2')} style={{ background: pillarSubTab === 'sub2' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub2' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>Performance KPIs Board</button>
              <button onClick={() => setPillarSubTab('sub3')} style={{ background: pillarSubTab === 'sub3' ? 'rgba(0,243,255,0.1)' : 'transparent', border: 'none', borderBottom: pillarSubTab === 'sub3' ? '2px solid var(--neon-cyan)' : 'none', color: '#fff', padding: '4px 12px', fontSize: '12px', fontFamily: 'var(--font-header)', cursor: 'pointer' }}>AI Tactical AAR Debrief</button>
            </>
          )}
        </div>
      )}

      {/* Main Tab Render Workspace */}
      <main className="tab-content glass-panel" style={{ padding: '20px', minHeight: 0 }}>
        {navGroup === 'core' ? (
          <>
            {activeTab === 'simulation' && <SimulationTab />}
            {activeTab === 'maps' && <MapTab />}
            {activeTab === 'graphs' && <GraphsTab />}
            {activeTab === 'requests' && <RequestsTab />}
            {activeTab === 'vision' && <VisionTab />}
            {activeTab === 'broadcast' && <BroadcastTab />}
          </>
        ) : (
          <>
            {/* Core simulation and broadcast inline tabs inside pillars category */}
            {activeTab === 'simulation' && <SimulationTab />}
            {activeTab === 'broadcast' && <BroadcastTab />}

            {/* Pillar 1 Risk Engine Views */}
            {activeTab === 'risk-engine' && pillarSubTab === 'sub1' && <RiskDashboard />}
            {activeTab === 'risk-engine' && pillarSubTab === 'sub2' && <SensorFeed />}

            {/* Pillar 2 Sensor Hub Views */}
            {activeTab === 'sensor-hub' && pillarSubTab === 'sub1' && <SensorMap />}
            {activeTab === 'sensor-hub' && pillarSubTab === 'sub2' && <SatelliteViewer />}

            {/* Pillar 3 Command Centre Views */}
            {activeTab === 'command-centre' && pillarSubTab === 'sub1' && <AgencyBoard />}
            {activeTab === 'command-centre' && pillarSubTab === 'sub2' && <IncidentLog />}
            {activeTab === 'command-centre' && pillarSubTab === 'sub3' && <MissionPlanner />}

            {/* Pillar 4 Medical Hub Views */}
            {activeTab === 'medical-hub' && pillarSubTab === 'sub1' && <HospitalGrid />}
            {activeTab === 'medical-hub' && pillarSubTab === 'sub2' && <MedEvacPlanner />}

            {/* Pillar 5 Fleet Dispatch Views */}
            {activeTab === 'fleet-dispatch' && pillarSubTab === 'sub1' && <FleetMap />}
            {activeTab === 'fleet-dispatch' && pillarSubTab === 'sub2' && <DispatchAI />}

            {/* Pillar 6 Citizen Safety Views */}
            {activeTab === 'citizen-portal' && pillarSubTab === 'sub1' && <PublicAlertFeed />}
            {activeTab === 'citizen-portal' && pillarSubTab === 'sub2' && <ShelterFinder />}
            {activeTab === 'citizen-portal' && pillarSubTab === 'sub3' && <SafetyChecklist />}

            {/* Pillar 7 Advanced Analytics Views */}
            {activeTab === 'analytics-nexus' && pillarSubTab === 'sub1' && <EventTimeline />}
            {activeTab === 'analytics-nexus' && pillarSubTab === 'sub2' && <PerformanceKPI />}
            {activeTab === 'analytics-nexus' && pillarSubTab === 'sub3' && <AIDebriefing />}
          </>
        )}
      </main>
      <NexusChat />
    </div>
  )
}

export default App
