import React, { useState, useEffect } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Waves, CloudRain, Wind, Activity, CheckCircle, ShieldAlert } from 'lucide-react';

// Sensor Coordinates Mapping
const SENSOR_COORDINATES = {
  's1': [22.6226, 88.3339], // Bally Hydrology
  's2': [22.5726, 88.3139], // Howrah Hydrology
  's3': [22.6450, 88.4250], // Dum Dum Rain
  's4': [22.5850, 88.4600], // New Town Rain
  's5': [22.5700, 88.4350], // Salt Lake AQI
  's6': [22.5546, 88.3200], // Howrah Industrial AQI
  's7': [22.4400, 88.4300], // Sonarpur Seismic
  's8': [22.6100, 88.3500], // Bally Seismic
};

const getStatusColor = (status) => {
  if (status === 'Danger') return '#ff3333';
  if (status === 'Alert') return '#ffb000';
  return '#39ff14';
};

const createSensorIcon = (type, status) => {
  const color = getStatusColor(status);
  
  let IconComponent = Activity;
  if (type === 'river') IconComponent = Waves;
  else if (type === 'rain') IconComponent = CloudRain;
  else if (type === 'aqi') IconComponent = Wind;

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
      <IconComponent size={18} />
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-sensor-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export default function SensorMap() {
  const { sensors } = usePrimeState();
  const [selectedSensor, setSelectedSensor] = useState(null);

  // Fix for default Leaflet icon issues in React
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', gap: '20px', minHeight: 0 }}>
      
      {/* Geospatial Map */}
      <div style={{ flex: 3, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0, 243, 255, 0.2)', boxShadow: 'var(--border-glow)' }}>
        <MapContainer center={[22.5626, 88.3639]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {sensors.map(sensor => {
            const coords = SENSOR_COORDINATES[sensor.id];
            if (!coords) return null;

            const color = getStatusColor(sensor.status);
            const isDanger = sensor.status === 'Danger';
            const icon = createSensorIcon(sensor.type, sensor.status);

            return (
              <React.Fragment key={sensor.id}>
                {/* Visual pulse for danger/alert nodes */}
                {sensor.status !== 'Normal' && (
                  <Circle
                    center={coords}
                    radius={isDanger ? 1200 : 600}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.15,
                      weight: 1.5,
                      className: 'sensor-pulse-circle animate-pulse'
                    }}
                  />
                )}

                <Marker
                  position={coords}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedSensor(sensor)
                  }}
                >
                  <Popup>
                    <div style={{ color: '#050510', fontFamily: 'var(--font-body)', minWidth: '180px' }}>
                      <strong style={{ display: 'block', marginBottom: '5px', fontSize: '13px', borderBottom: '1px solid #ddd', paddingBottom: '3px' }}>
                        {sensor.name}
                      </strong>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '5px' }}>
                        <span>Current Value:</span>
                        <strong>{sensor.value} {sensor.unit}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '3px' }}>
                        <span>Status:</span>
                        <strong style={{ color: color }}>{sensor.status.toUpperCase()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '3px' }}>
                        <span>Trend:</span>
                        <strong style={{ color: sensor.change.startsWith('+') ? '#ff3333' : '#39ff14' }}>{sensor.change}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '3px' }}>
                        <span>Threshold:</span>
                        <span>{sensor.alertThreshold} {sensor.unit}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Side Details Panel */}
      <div className="glass-panel" style={{ flex: 1.2, display: 'flex', flexDirection: 'column', padding: '20px', gap: '15px' }}>
        <div style={{ color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0, 243, 255, 0.1)', paddingBottom: '10px' }}>
          <Waves size={20} />
          <h3 style={{ fontSize: '15px', margin: 0 }}>IoT Node Inspector</h3>
        </div>

        {selectedSensor ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
              <span style={{ fontSize: '10px', color: '#888', display: 'block', textTransform: 'uppercase' }}>Selected Node</span>
              <strong style={{ fontSize: '14px', color: 'var(--neon-cyan)' }}>{selectedSensor.name}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Device Status</span>
                <strong style={{ color: getStatusColor(selectedSensor.status) }}>{selectedSensor.status}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Current Value</span>
                <strong>{selectedSensor.value} {selectedSensor.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Alert Level Threshold</span>
                <strong style={{ color: 'var(--neon-magenta)' }}>{selectedSensor.alertThreshold} {selectedSensor.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Trend Delta</span>
                <strong style={{ color: selectedSensor.change.startsWith('+') ? '#ff3333' : '#39ff14' }}>{selectedSensor.change}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Grid Coordinate</span>
                <span style={{ fontFamily: 'monospace' }}>{SENSOR_COORDINATES[selectedSensor.id]?.join(', ')}</span>
              </div>
            </div>

            {selectedSensor.type === 'seismic' && selectedSensor.waveform && (
              <div style={{ marginTop: '15px' }}>
                <span style={{ fontSize: '10px', color: '#888', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>Station Sparklines</span>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px', background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '4px', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
                  {selectedSensor.waveform.map((val, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: `${Math.min(100, val * 160)}%`,
                        background: val > selectedSensor.alertThreshold ? 'var(--neon-red)' : 'var(--neon-cyan)',
                        boxShadow: val > selectedSensor.alertThreshold ? '0 0 5px var(--neon-red)' : 'none',
                        borderRadius: '2px',
                        transition: 'height 0.2s ease'
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px', color: '#555', border: '1px dashed #222', borderRadius: '4px' }}>
            <span style={{ fontSize: '13px' }}>Click any sensor node marker on the geospatial map to analyze operational diagnostics.</span>
          </div>
        )}
      </div>

    </div>
  );
}
