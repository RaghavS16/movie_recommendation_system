// src/AboutPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { COLORS, FONTS } from './theme';

const TECH = [
  { name: 'React', role: 'Frontend UI', icon: '⚛️' },
  { name: 'Flask', role: 'Backend API', icon: '🐍' },
  { name: 'Groq AI', role: 'Intent Detection', icon: '🧠' },
  { name: 'TMDB API', role: 'Movie Database', icon: '🎬' },
  { name: 'SQLite', role: 'Data Storage', icon: '🗃️' },
  { name: 'JWT Auth', role: 'Security', icon: '🔐' },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: FONTS.body, color: COLORS.textMain }}>

      {/* Header */}
      <div style={{
        padding: '24px 40px', borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex', alignItems: 'center', gap: '16px',
        background: COLORS.bgCard,
      }}>
        <button onClick={() => navigate(isLoggedIn ? '/chat' : '/welcome')} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textSub,
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', padding: 0,
        }}>
          <ChevronLeft size={18} /> Back
        </button>
        <h1 style={{ fontFamily: FONTS.display, fontSize: '24px', fontWeight: '700', color: COLORS.textMain }}>
          About FilmoBot
        </h1>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #f5c842, #c9a227)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', margin: '0 auto 24px',
            boxShadow: '0 0 40px rgba(245,200,66,0.3)',
          }}>🎬</div>
          <h2 style={{
            fontFamily: FONTS.display, fontSize: '42px', fontWeight: '900',
            marginBottom: '16px',
          }}>
            About FilmoBot
          </h2>
          <p style={{
            color: COLORS.textSub, fontSize: '18px', lineHeight: '1.8',
            maxWidth: '560px', margin: '0 auto',
          }}>
            FilmoBot is an AI-powered movie recommendation chatbot that understands how you feel
            and suggests the perfect film — in any language, for any mood.
          </p>
        </div>

        {/* Mission */}
        <div style={{
          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
          borderRadius: '20px', padding: '40px', marginBottom: '48px',
        }}>
          <h3 style={{
            fontFamily: FONTS.display, fontSize: '26px', fontWeight: '700',
            marginBottom: '16px', color: '#f5c842',
          }}>
            Our Mission
          </h3>
          <p style={{ color: COLORS.textSub, fontSize: '16px', lineHeight: '1.8' }}>
            We believe finding a great movie shouldn't be hard. Instead of endless scrolling through
            streaming catalogs, just tell FilmoBot how you're feeling in plain language.
            Whether you're exhausted after work, celebrating something special, or just bored —
            FilmoBot understands context, mood, language, and even typos to get you the perfect pick.
          </p>
        </div>

        {/* Tech stack */}
        <h3 style={{
          fontFamily: FONTS.display, fontSize: '26px', fontWeight: '700',
          marginBottom: '24px',
        }}>
          Built With
        </h3>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px', marginBottom: '64px',
        }}>
          {TECH.map(t => (
            <div key={t.name} style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: '14px', padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,200,66,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
            >
              <span style={{ fontSize: '28px' }}>{t.icon}</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{t.name}</div>
                <div style={{ color: COLORS.textSub, fontSize: '13px' }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Developer */}
        <div style={{
          background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
          borderRadius: '20px', padding: '40px', textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 16px',
          }}>
            👨‍💻
          </div>
          <h3 style={{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>
            Student Project
          </h3>
          <p style={{ color: COLORS.textSub, fontSize: '15px', lineHeight: '1.7', maxWidth: '400px', margin: '0 auto 24px' }}>
            FilmoBot is a student project built with passion for cinema and technology.
            Every feature is built to be 100% free using open APIs and free-tier services.
          </p>

        </div>

      </div>
    </div>
  );
}