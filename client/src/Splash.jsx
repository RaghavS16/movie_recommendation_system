// src/Splash.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FONTS } from './theme';
import filmoLogo from './assets/filmobot-logo.svg';

export default function Splash() {
  const navigate = useNavigate();
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState('count'); // 'count' | 'logo' | 'fade'

  useEffect(() => {
    // Countdown 3 → 2 → 1
    if (count > 1) {
      const t = setTimeout(() => setCount(c => c - 1), 700);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase('logo'), 700);
      return () => clearTimeout(t);
    }
  }, [count]);

  useEffect(() => {
    if (phase === 'logo') {
      const t = setTimeout(() => setPhase('fade'), 1800);
      return () => clearTimeout(t);
    }
    if (phase === 'fade') {
      const t = setTimeout(() => navigate('/welcome'), 600);
      return () => clearTimeout(t);
    }
  }, [phase, navigate]);

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONTS.body, overflow: 'hidden', position: 'relative',
      transition: 'opacity 0.6s ease',
      opacity: phase === 'fade' ? 0 : 1,
    }}>

      {/* Ambient light */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(245,200,66,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Film strip lines */}
      {[0,1,2,3,4,5].map(i => (
        <div key={i} style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${i * 20}%`, width: '1px',
          background: 'rgba(255,255,255,0.02)',
        }} />
      ))}

      {/* COUNTDOWN phase */}
      {phase === 'count' && (
        <div key={count} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          {/* Film hole dots */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: 'rgba(245,200,66,0.3)',
              }} />
            ))}
          </div>

          <div style={{
            width: '120px', height: '120px',
            border: '2px solid rgba(245,200,66,0.3)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Rotating ring */}
            <div style={{
              position: 'absolute', inset: '-4px',
              border: '2px solid transparent',
              borderTopColor: '#f5c842',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{
              fontFamily: FONTS.display, fontSize: '52px',
              fontWeight: '700', color: '#f5c842',
            }}>{count}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '32px' }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: 'rgba(245,200,66,0.3)',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* LOGO phase */}
      {phase === 'logo' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: 'fadeUp 0.6s ease',
        }}>
          <img
            src={filmoLogo}
            alt="FilmoBot"
            style={{
              width: '120px', height: '120px', marginBottom: '24px',
              animation: 'pulse-gold 2s ease infinite',
              filter: 'drop-shadow(0 0 24px rgba(245,200,66,0.5))',
            }}
          />
          <h1 style={{
            fontFamily: FONTS.display, fontSize: '56px',
            fontWeight: '900', color: '#f0eee8',
            letterSpacing: '-1px', marginBottom: '8px',
          }}>
            FilmoBot
          </h1>
          <p style={{
            color: '#f5c842', fontSize: '14px',
            letterSpacing: '4px', textTransform: 'uppercase',
          }}>
            Your Cinema Guide
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-gold {
          0%,100%{box-shadow:0 0 40px rgba(245,200,66,0.3)}
          50%{box-shadow:0 0 80px rgba(245,200,66,0.5)}
        }
      `}</style>
    </div>
  );
}