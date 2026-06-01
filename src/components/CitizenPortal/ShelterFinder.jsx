import React, { useState, useEffect } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Tent, Compass, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

const CIVILIAN_LOCATION = [22.5626, 88.3639]; // Central EOC node location

const createShelterIcon = () => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{
      backgroundColor: '#050510',
      border: '2px solid #ffaa00',
      boxShadow: '0 0 10px #ffaa00, inset 0 0 5px #ffaa00',
      borderRadius: '50%',
      padding: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffaa00'
    }}>
      <Tent size={14} />
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-shelter-pin',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
};

const createCivilianIcon = () => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{
      width: '16px', height: '16px',
      backgroundColor: '#00f3ff',
      border: '2px solid #fff',
      borderRadius: '50%',
      boxShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff'
    }}></div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-civilian-pin',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

export default function ShelterFinder() {
  const { mapZones, requests } = usePrimeState();
  const [shelterIcon, setShelterIcon] = useState(null);
  const [civilianIcon, setCivilianIcon] = useState(null);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    setShelterIcon(createShelterIcon());
    setCivilianIcon(createCivilianIcon());
  }, []);

  const triggerSosDistress = () => {
    setSosSent(true);

    // Inject a new request into sessionStorage to trigger simulation responses
    const nextRequest = {
      id: Date.now(),
      name: "Emergency Beacon User",
      age: "24",
      gender: "Male/Female",
      disease: "Stranded - Water Surge Level Ingress",
      resource: "Rescue Boat",
      priority: 1,
      description: "SOS beacon triggered directly from Sachet Citizen Interface. Critical evacuation needed.",
      status: "pending",
      location: "Central Station",
      time: Date.now()
    };

    try {
      const rawReqs = sessionStorage.getItem('disaster_requests') || '[]';
      const parsed = JSON.parse(rawReqs);
      parsed.push(nextRequest);
      sessionStorage.setItem('disaster_requests', JSON.stringify(parsed));
      
      const rawLogs = sessionStorage.getItem('sim_logs') || '[]';
      const parsedLogs = JSON.parse(rawLogs);
      parsedLogs.push({
        time: new Date().toLocaleTimeString(),
        text: `[BEACON RECEIVED] Critical SOS Distress Signal from sector coordinates: Central Station!`
      });
      sessionStorage.setItem('sim_logs', JSON.stringify(parsedLogs));
    } catch (err) {}

    alert("SOS DISTRESS BEACON TRANSMITTED! Mesh emergency dispatch responders alerted. Keep your mobile device powered.");
  };

  const safeShelters = React.useMemo(() => {
    // Return only safe zone coordinates (Dum Dum, New Town, Salt Lake)
    return [
      { name: 'Salt Lake Stadium camp', pos: [22.5680, 88.4090], capacity: '85% Full', distance: '3.4 km' },
      { name: 'Science City Mega Shelter', pos: [22.5400, 88.3960], capacity: '42% Capacity remaining', distance: '4.8 km' },
      { name: 'Rajarhat Evac Center', pos: [22.6100, 88.4500], capacity: '12% Capacity remaining', distance: '7.1 km' }
    ];
  }, []);

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', overflowY: 'auto', flexWrap: 'wrap', paddingRight: '5px' }}>
      
      {/* Map locator display */}
      <div style={{ flex: 3, minWidth: '320px', height: '420px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0, 243, 255, 0.2)', boxShadow: 'var(--border-glow)' }}>
        <MapContainer center={CIVILIAN_LOCATION} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {civilianIcon && (
            <>
              <Marker position={CIVILIAN_LOCATION} icon={civilianIcon}>
                <Popup>
                  <div style={{ color: '#050510', fontSize: '11px' }}>Your current estimated GPS coordinates</div>
                </Popup>
              </Marker>
              <Circle center={CIVILIAN_LOCATION} radius={500} pathOptions={{ color: '#00f3ff', fillColor: '#00f3ff', fillOpacity: 0.05, weight: 1 }} />
            </>
          )}

          {shelterIcon && safeShelters.map((s, idx) => (
            <Marker key={idx} position={s.pos} icon={shelterIcon}>
              <Popup>
                <div style={{ color: '#050510', fontFamily: 'var(--font-body)', minWidth: '150px' }}>
                  <strong style={{ fontSize: '12px' }}>{s.name}</strong>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>Distance: {s.distance}</div>
                  <div style={{ fontSize: '11px', color: '#ffaa00', fontWeight: 'bold', marginTop: '2px' }}>Capacity: {s.capacity}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* SOS Distress Box */}
      <div style={{ flex: 1.5, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* SOS Emergency Button */}
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--neon-red)', background: 'rgba(255, 51, 51, 0.03)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--neon-red)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>
            <ShieldAlert size={16} /> EMERGENCY SOS DISTRESS BEACON
          </h4>
          <p style={{ fontSize: '11px', color: '#ccc', lineHeight: '1.4', margin: 0 }}>
            If you are stranded, injured, or require immediate tactical marine evacuation, trigger the beacon below. Your GPS sector will broadcast an alert.
          </p>

          <button
            onClick={triggerSosDistress}
            disabled={sosSent}
            style={{
              width: '100%',
              padding: '15px',
              background: sosSent ? 'rgba(0,0,0,0.5)' : 'var(--neon-red)',
              color: sosSent ? '#666' : '#000',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: sosSent ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-header)',
              boxShadow: sosSent ? 'none' : '0 0 15px rgba(255, 51, 51, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <Navigation size={14} className={sosSent ? '' : 'animate-pulse'} />
            {sosSent ? "BEACON TRANSMITTING..." : "TRANSMIT SOS DISTRESS BEACON"}
          </button>
        </div>

        {/* Shelter List HUD */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Compass size={15} /> Nearest Safe Havens
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {safeShelters.map((s, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div>
                  <strong style={{ color: '#fff', fontSize: '12px' }}>{s.name}</strong>
                  <div style={{ color: '#888', marginTop: '3px' }}>Distance: {s.distance}</div>
                </div>
                <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>{s.capacity}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
