import React, { useState } from 'react';
import { ShieldAlert, Compass, Image, Eye, HelpCircle, Layers, Sliders } from 'lucide-react';

export default function SatelliteViewer() {
  const [band, setBand] = useState('optical'); // 'optical', 'sar', 'ndwi', 'ndvi'
  const [splitRatio, setSplitRatio] = useState(50); // comparison split bar percentage
  const [satelliteId, setSatelliteId] = useState('Sentinel-1B (Radar/SAR)');
  
  // Custom mock analytics for Sentinel observations
  const observations = {
    'Sentinel-1B (Radar/SAR)': { orbit: 'Descending', polar: 'VV+VH', sweepTime: 'Today, 14:32 UTC', resolution: '10m C-band', status: 'Active Ingest' },
    'Sentinel-2A (Optical/MSI)': { orbit: 'Ascending', polar: 'Bands 2,3,4,8,11', sweepTime: 'Yesterday, 06:12 UTC', resolution: '10m/20m Visible', status: 'Cached' }
  };

  const currentObs = observations[satelliteId] || observations['Sentinel-1B (Radar/SAR)'];

  const getBandExplanation = () => {
    switch (band) {
      case 'optical':
        return "True Color composite (RGB bands 4-3-2). Reveals optical cloud layers and muddy water ingress.";
      case 'sar':
        return "Synthetic Aperture Radar. Microwaves penetrate cloud cover. Highly reflective water bodies appear stark black.";
      case 'ndwi':
        return "Normalized Difference Water Index: (Green - NIR) / (Green + NIR). Isolates flood pools and represents water as bright cyan.";
      default:
        return "Normalized Difference Vegetation Index: (NIR - Red) / (NIR + Red). Highlights high chlorophyll and combustible dry zones (rendered red).";
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '5px' }}>
      
      {/* Upper Control Bar */}
      <div className="glass-panel" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        
        {/* Satellite Ingestion Source Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={18} color="var(--neon-cyan)" />
          <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-header)' }}>Sentinel Hub Stream</span>
          <select 
            value={satelliteId} 
            onChange={(e) => setSatelliteId(e.target.value)}
            style={{ 
              background: '#050510', 
              color: '#fff', 
              border: '1px solid rgba(0, 243, 255, 0.3)', 
              padding: '6px 12px', 
              borderRadius: '4px',
              fontFamily: 'var(--font-body)',
              fontSize: '12px'
            }}
          >
            <option value="Sentinel-1B (Radar/SAR)">Sentinel-1B (Radar / SAR)</option>
            <option value="Sentinel-2A (Optical/MSI)">Sentinel-2A (Optical / MSI)</option>
          </select>
        </div>

        {/* Spectral Band Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['optical', 'sar', 'ndwi', 'ndvi'].map(b => (
            <button
              key={b}
              onClick={() => setBand(b)}
              style={{
                background: band === b ? 'rgba(0, 243, 255, 0.15)' : 'rgba(0,0,0,0.4)',
                border: `1px solid ${band === b ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.1)'}`,
                color: band === b ? '#fff' : 'rgba(255,255,255,0.5)',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-header)',
                fontSize: '11px',
                textTransform: 'uppercase',
                transition: 'all 0.3s'
              }}
            >
              {b}
            </button>
          ))}
        </div>

      </div>

      {/* Main Satellite Comparison Split-Screen Canvas */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Visual Split Screen comparison */}
        <div className="glass-panel" style={{ flex: 3, minWidth: '320px', height: '420px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
          
          {/* Back layer: Post-event inundation (simulated based on band) */}
          <div style={{
            width: '100%',
            height: '100%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: 'url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800")', // premium satellite texture
            filter: 
              band === 'sar' ? 'contrast(2) grayscale(1) invert(1)' :
              band === 'ndwi' ? 'hue-rotate(180deg) saturate(3)' :
              band === 'ndvi' ? 'hue-rotate(90deg) saturate(1.5) sepia(0.5)' :
              'none',
            position: 'absolute',
            top: 0, left: 0
          }}>
            {/* Cyan flooded polygon overlay on top of back layer */}
            {(band === 'sar' || band === 'ndwi') && (
              <div style={{
                position: 'absolute',
                top: '20%', left: '15%',
                width: '50%', height: '60%',
                background: 'rgba(0, 243, 255, 0.25)',
                boxShadow: '0 0 20px rgba(0, 243, 255, 0.4)',
                border: '1px solid #00f3ff',
                borderRadius: '40% 60% 30% 70%',
                backdropFilter: 'blur(1px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'var(--font-header)', background: '#050510aa', padding: '3px 8px', borderRadius: '3px', border: '1px solid #00f3ff55' }}>
                  NDWI INUNDATION CORRIDOR: 4.8 km²
                </span>
              </div>
            )}
          </div>

          {/* Front layer: Pre-event clean reference, clipped by splitRatio slider */}
          <div style={{
            width: `${splitRatio}%`,
            height: '100%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800")', // pre-event imagery
            position: 'absolute',
            top: 0, left: 0,
            overflow: 'hidden',
            borderRight: '2px solid var(--neon-magenta)',
            boxShadow: '0 0 10px rgba(255, 0, 255, 0.5)'
          }}>
            {/* Duplicate satellite texture clipped so it stays in place */}
            <div style={{
              width: '100%',
              height: '100%',
              minWidth: '600px',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800")',
            }}></div>
            
            {/* Indicator label */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(255,0,255,0.7)', color: '#fff', fontSize: '9px', padding: '4px 8px', borderRadius: '2px', fontWeight: 'bold', fontFamily: 'var(--font-header)' }}>
              PRE-EVENT (OPTICAL)
            </div>
          </div>

          {/* Label for post event */}
          <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,243,255,0.7)', color: '#000', fontSize: '9px', padding: '4px 8px', borderRadius: '2px', fontWeight: 'bold', fontFamily: 'var(--font-header)' }}>
            POST-EVENT ({band.toUpperCase()})
          </div>

          {/* Custom sweep line sliding across Split Bar */}
          <div style={{ position: 'absolute', left: `${splitRatio}%`, top: 0, bottom: 0, width: '1px', background: '#ff00ff', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '50%', left: '-15px', width: '30px', height: '30px', background: '#ff00ff', border: '2px solid #fff', borderRadius: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
              ↔
            </div>
          </div>

          {/* Interactive Split Slider Input overlaid on the full map */}
          <input
            type="range"
            min="0"
            max="100"
            value={splitRatio}
            onChange={(e) => setSplitRatio(parseInt(e.target.value))}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              opacity: 0,
              cursor: 'ew-resize',
              zIndex: 10
            }}
          />
        </div>

        {/* Orbit Information & Science Description */}
        <div className="glass-panel" style={{ flex: 1.5, minWidth: '280px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '14px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Compass size={16} /> Sentinel-Radar Parameters
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Active Orbit</span>
                <strong>{currentObs.orbit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Polarization Mode</span>
                <strong>{currentObs.polar}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Geospatial Sweep</span>
                <strong>{currentObs.sweepTime}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                <span style={{ color: '#888' }}>Radar Resolution</span>
                <strong style={{ color: 'var(--neon-lime)' }}>{currentObs.resolution}</strong>
              </div>
            </div>

            <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0, 243, 255, 0.15)', borderRadius: '4px', padding: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', marginBottom: '5px', fontWeight: 'bold' }}>
                <Eye size={12} /> {band.toUpperCase()} BAND SPECTRUM
              </span>
              <p style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.5' }}>
                {getBandExplanation()}
              </p>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 51, 51, 0.05)', border: '1px solid var(--neon-red)', borderRadius: '4px', padding: '12px', display: 'flex', gap: '10px' }}>
            <ShieldAlert size={20} color="var(--neon-red)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--neon-red)', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>NDWI Flood Detected</span>
              <span style={{ fontSize: '11px', color: '#bbb' }}>Inundation calculations verify a 140% surface water expand across central canal coordinates.</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
