import React from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { Activity, Waves, CloudRain, Wind, ShieldAlert, CheckCircle, Zap } from 'lucide-react';

export default function SensorFeed() {
  const { sensors, simActive } = usePrimeState();

  const getStatusColor = (status) => {
    if (status === 'Danger') return 'var(--neon-red)';
    if (status === 'Alert') return 'var(--neon-amber)';
    return 'var(--neon-lime)';
  };

  const getSensorIcon = (type, color) => {
    switch (type) {
      case 'river':
        return <Waves size={18} color={color} />;
      case 'rain':
        return <CloudRain size={18} color={color} />;
      case 'aqi':
        return <Wind size={18} color={color} />;
      default:
        return <Activity size={18} color={color} />;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Ticker Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(0, 243, 255, 0.1)', paddingBottom: '10px' }}>
        <div>
          <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)' }}>
            <Activity size={18} /> Live IoT Environmental Sensor Ticker
          </h3>
          <p style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
            Broadcasting 5Hz telemetry packets via sector Bluetooth mesh networks
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(57,255,20,0.05)', padding: '5px 10px', borderRadius: '4px', border: '1px solid var(--neon-lime)' }}>
          <Zap size={14} color="var(--neon-lime)" className="animate-pulse" />
          <span style={{ fontSize: '11px', color: 'var(--neon-lime)', fontWeight: 'bold', fontFamily: 'var(--font-header)' }}>
            {simActive ? "SIMULATOR BROADCAST" : "MESH ONLINE"}
          </span>
        </div>
      </div>

      {/* Sensor Nodes Listing Grid */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', paddingRight: '5px' }}>
        {sensors.map((sensor) => {
          const statusColor = getStatusColor(sensor.status);
          const pct = Math.min(100, Math.round((sensor.value / sensor.max) * 100));

          return (
            <div
              key={sensor.id}
              className="scanner-container"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${sensor.status !== 'Normal' ? statusColor : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '4px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                position: 'relative',
                boxShadow: sensor.status !== 'Normal' ? `0 0 10px rgba(${sensor.status === 'Danger' ? '255,51,51' : '255,176,0'}, 0.08)` : 'none',
                transition: 'all 0.3s'
              }}
            >
              {/* Scanline element if warning */}
              {sensor.status !== 'Normal' && <div className="scanner-line"></div>}

              {/* Status Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getSensorIcon(sensor.type, statusColor)}
                  <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-body)' }}>{sensor.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>
                  {sensor.status === 'Normal' ? (
                    <CheckCircle size={10} color="var(--neon-lime)" />
                  ) : (
                    <ShieldAlert size={10} color={statusColor} className="animate-pulse" />
                  )}
                  <span style={{ fontSize: '9px', color: statusColor, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {sensor.status}
                  </span>
                </div>
              </div>

              {/* Numerical Gauge Value */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '5px' }}>
                <span style={{ fontSize: '24px', fontFamily: 'var(--font-header)', color: '#fff', textShadow: `0 0 8px ${statusColor}33` }}>
                  {sensor.value} <span style={{ fontSize: '12px', color: '#888' }}>{sensor.unit}</span>
                </span>
                <span style={{ fontSize: '11px', color: sensor.change.startsWith('+') ? 'var(--neon-red)' : 'var(--neon-lime)', fontFamily: 'var(--font-header)' }}>
                  {sensor.change} {sensor.unit === 'm' ? 'm/h' : ''}
                </span>
              </div>

              {/* Waveform Sparkline for Seismic nodes */}
              {sensor.type === 'seismic' && sensor.waveform && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '30px', background: 'rgba(0,0,0,0.4)', padding: '3px', borderRadius: '3px' }}>
                  {sensor.waveform.map((val, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: `${Math.min(100, val * 160)}%`,
                        background: val > sensor.alertThreshold ? 'var(--neon-red)' : 'var(--neon-cyan)',
                        boxShadow: val > sensor.alertThreshold ? '0 0 5px var(--neon-red)' : 'none',
                        borderRadius: '1px',
                        transition: 'height 0.2s ease'
                      }}
                    ></div>
                  ))}
                </div>
              )}

              {/* Capacity/Threshold Limit Bar */}
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', marginBottom: '3px', textTransform: 'uppercase' }}>
                  <span>Gauge Capacity</span>
                  <span>Max: {sensor.max}{sensor.unit}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: statusColor,
                      boxShadow: `0 0 5px ${statusColor}`,
                      transition: 'width 0.5s ease-in-out'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
