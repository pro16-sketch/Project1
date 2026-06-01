import React, { useState, useEffect } from 'react';
import { usePrimeState } from '../../utils/PrimeState';
import { AlertCircle, Clock, Heart, Shield, Radio, Check } from 'lucide-react';

export default function PublicAlertFeed() {
  const { simActive, simStage } = usePrimeState();
  const [countdown, setCountdown] = useState({ h: 3, m: 42, s: 15 });

  // Dynamic countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { h: prev.h, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        clearInterval(timer);
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getAlerts = () => {
    const base = [
      { id: 1, severity: 'critical', title: 'Hooghly Basin Flash Flood Ingress', text: 'Extremely high water surge logged on west bank sectors (Howrah / Bally). Water depth expected to rise up to 2.3 meters. Ground floor residents must relocate to higher grounds immediately.', time: '12m ago', shelter: 'Science City Mega Shelter' },
      { id: 2, severity: 'warning', title: 'Severe Tropical Storm Watch', text: 'Storm clouds gathering with wind speeds up to 65 km/h. Secure loose objects and refrain from traveling across bridges.', time: '40m ago', shelter: 'Salt Lake Stadium camp' },
      { id: 3, severity: 'info', title: 'Potable Water Distribution Wave', text: 'Fresh water barrels and dry rations arriving at Rajarhat and New Town shelters. Bring identification details for registration.', time: '2h ago', shelter: 'Rajarhat Evac Center' }
    ];

    if (simActive) {
      if (simStage === 1) return [base[1], base[2]];
      if (simStage >= 2) return base;
    }
    return [base[1], base[2]];
  };

  const activeAlerts = getAlerts();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '10px 0' }}>
      
      {/* Mobile Smartphone Shell Container */}
      <div style={{
        width: '360px',
        height: '520px',
        background: '#070714',
        border: '8px solid #222',
        borderRadius: '36px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0, 243, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {/* Mobile Top Bar */}
        <div style={{ height: '24px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', fontSize: '10px', color: '#666', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <span>NEXUS-net 5G</span>
          <div style={{ width: '40px', height: '10px', background: '#000', borderRadius: '5px' }}></div>
          <span>100% 🔋</span>
        </div>

        {/* Mobile App Header */}
        <div style={{ background: '#0a0a20', padding: '15px', borderBottom: '1px solid rgba(0,243,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} color="var(--neon-red)" className="animate-pulse" />
          <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'var(--font-header)', letterSpacing: '1px', color: 'var(--neon-cyan)' }}>
            SACHET CIVILIAN PORTAL
          </span>
        </div>

        {/* Mobile App Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Countdown Clock Widget */}
          <div style={{ background: 'rgba(255,51,51,0.05)', border: '1px solid rgba(255,51,51,0.2)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="var(--neon-red)" className="animate-pulse" />
            <div>
              <span style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', display: 'block' }}>Storm window remains</span>
              <strong style={{ fontSize: '18px', color: '#fff', fontFamily: 'monospace' }}>
                {countdown.h.toString().padStart(2, '0')}h {countdown.m.toString().padStart(2, '0')}m {countdown.s.toString().padStart(2, '0')}s
              </strong>
            </div>
          </div>

          {/* Active Alerts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Emergency Broadcasts</span>

            {activeAlerts.map(alert => {
              const isCrit = alert.severity === 'critical';
              const isWarn = alert.severity === 'warning';
              
              let alertColor = 'var(--neon-lime)';
              if (isCrit) alertColor = 'var(--neon-red)';
              else if (isWarn) alertColor = 'var(--neon-amber)';

              return (
                <div
                  key={alert.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${alertColor}33`,
                    borderLeft: `4px solid ${alertColor}`,
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: isCrit ? '0 0 10px rgba(255,51,51,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '11px', color: alertColor, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={10} color={alertColor} /> {alert.severity}
                    </strong>
                    <span style={{ fontSize: '9px', color: '#555' }}>{alert.time}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{alert.title}</span>
                  <p style={{ fontSize: '11px', color: '#aaa', lineHeight: '1.4', margin: 0 }}>{alert.text}</p>
                  
                  <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px' }}>
                    <span style={{ color: '#666' }}>Recommended refuge:</span>
                    <strong style={{ color: 'var(--neon-cyan)' }}>{alert.shelter}</strong>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div style={{ height: '48px', background: '#0a0a19', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', fontSize: '10px', color: '#888' }}>
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Shield size={14} /> Alerts</span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Heart size={14} /> Safety</span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><Check size={14} /> Checklist</span>
        </div>

      </div>

    </div>
  );
}
