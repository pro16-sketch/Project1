import React, { useState, useEffect } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Ship, Flame, Plane, Navigation, Compass, ShieldAlert, Cpu } from 'lucide-react';

const createVehicleIcon = (type, status) => {
  let IconComponent = Navigation;
  let color = 'var(--neon-cyan)';

  if (type === 'boat') {
    IconComponent = Ship;
    color = '#00aaff';
  } else if (type === 'engine') {
    IconComponent = Flame;
    color = '#ff3333';
  } else if (type === 'chopper') {
    IconComponent = Plane;
    color = '#ff00ff';
  } else if (type === 'ambulance') {
    IconComponent = Navigation;
    color = '#39ff14';
  }

  const iconMarkup = renderToStaticMarkup(
    <div style={{
      backgroundColor: '#050510',
      border: `2px solid ${color}`,
      boxShadow: `0 0 10px ${color}, inset 0 0 4px ${color}`,
      borderRadius: '4px',
      padding: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
      transform: type === 'ambulance' ? 'rotate(45deg)' : 'none'
    }}>
      <IconComponent size={16} />
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-fleet-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

export default function FleetMap() {
  const { fleet, simStage, simActive } = usePrimeState();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [localFleet, setLocalFleet] = useState(fleet);

  // Sync state from provider but support dynamic simulation changes
  useEffect(() => {
    if (simActive) {
      try {
        const rawPositions = sessionStorage.getItem('sim_boat_positions');
        if (rawPositions) {
          const parsed = JSON.parse(rawPositions);
          setLocalFleet(prev => prev.map(v => {
            if (v.type === 'boat' && parsed['25']) {
              // Simulate boat 01 moving
              const idNum = v.id === 'v1' ? '25' : v.id === 'v2' ? '26' : null;
              if (idNum && parsed[idNum]) {
                const nextStatus = simStage === 4 ? 'En Route' : simStage === 5 ? 'Arrived' : 'Available';
                return {
                  ...v,
                  pos: parsed[idNum],
                  status: nextStatus,
                  speed: simStage === 4 ? '26 kn' : '0 kn'
                };
              }
            }
            return v;
          }));
        }
      } catch (err) {}
    } else {
      setLocalFleet(fleet);
    }
  }, [fleet, simActive, simStage]);

  const getStatusColor = (status) => {
    if (status === 'Available') return 'var(--neon-lime)';
    if (status === 'En Route') return 'var(--neon-cyan)';
    return 'var(--neon-amber)';
  };

  return (
    <div style={{ height: '100%', display: 'flex', gap: '20px', minHeight: 0 }}>
      
      {/* Fleet Geospatial Map */}
      <div style={{ flex: 3, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0, 243, 255, 0.2)', boxShadow: 'var(--border-glow)' }}>
        <MapContainer center={[22.5626, 88.3639]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {localFleet.map(v => {
            const icon = createVehicleIcon(v.type, v.status);
            return (
              <Marker
                key={v.id}
                position={v.pos}
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedVehicle(v)
                }}
              >
                <Popup>
                  <div style={{ color: '#050510', fontFamily: 'var(--font-body)', minWidth: '150px' }}>
                    <strong style={{ display: 'block', fontSize: '13px', borderBottom: '1px solid #ddd', paddingBottom: '3px', marginBottom: '5px' }}>{v.name}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Type:</span>
                      <span style={{ textTransform: 'capitalize' }}>{v.type}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
                      <span>Status:</span>
                      <strong style={{ color: getStatusColor(v.status) }}>{v.status.toUpperCase()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px' }}>
                      <span>Fuel:</span>
                      <strong>{v.fuel}%</strong>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Side Vehicle HUD */}
      <div className="glass-panel" style={{ flex: 1.2, display: 'flex', flexDirection: 'column', padding: '20px', gap: '15px' }}>
        <div style={{ color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0, 243, 255, 0.1)', paddingBottom: '10px' }}>
          <Compass size={20} />
          <h3 style={{ fontSize: '15px', margin: 0 }}>Fleet Telemetry HUD</h3>
        </div>

        {selectedVehicle ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
              <span style={{ fontSize: '10px', color: '#888', display: 'block', textTransform: 'uppercase' }}>Selected Unit</span>
              <strong style={{ fontSize: '14px', color: 'var(--neon-cyan)' }}>{selectedVehicle.name}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Active Status</span>
                <strong style={{ color: getStatusColor(selectedVehicle.status) }}>{selectedVehicle.status}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Current Fuel</span>
                <strong style={{ color: selectedVehicle.fuel <= 30 ? 'var(--neon-red)' : 'var(--text-main)' }}>{selectedVehicle.fuel}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Velocity Telemetry</span>
                <strong>{selectedVehicle.speed}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Squad Crew Size</span>
                <span>{selectedVehicle.crew} Specialist Responders</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Incident ETA</span>
                <span style={{ color: 'var(--neon-magenta)', fontWeight: 'bold' }}>{selectedVehicle.eta}</span>
              </div>
              {selectedVehicle.altitude && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#aaa' }}>Flight Altitude</span>
                  <strong>{selectedVehicle.altitude}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0, 243, 255, 0.05)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(0, 243, 255, 0.2)', marginTop: '15px' }}>
              <Cpu size={24} color="var(--neon-cyan)" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>Smart Mesh Sync</span>
                <span style={{ fontSize: '10px', color: '#888' }}>Telemetry transceiving fully synched via mesh networks in low-frequency band.</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px', color: '#555', border: '1px dashed #222', borderRadius: '4px' }}>
            <span style={{ fontSize: '13px' }}>Select any rescue boat, engine, or medevac flyer on the geospatial map to stream real-time operational telemetry.</span>
          </div>
        )}
      </div>

    </div>
  );
}
