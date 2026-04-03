// src/Welcome.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { COLORS, FONTS } from './theme';
import filmoLogo from './assets/filmobot-logo.svg';
import { Sparkles, Search, Heart, Zap, Film, Star, ChevronDown } from 'lucide-react';

const FEATURES = [
  { icon: '🧠', title: 'AI-Powered', desc: 'Understands your mood from natural descriptions like "tired after a long day"' },
  { icon: '🔍', title: 'Smart Search', desc: 'Finds movies even with typos — "usthad hotal" finds "Ustad Hotel" instantly' },
  { icon: '🎭', title: 'Any Language', desc: 'Tamil, Hindi, Korean, English and 15+ languages with accurate recommendations' },
  { icon: '🎵', title: 'Song Search', desc: 'Know a song but not the movie? Just type the song name and find it' },
  { icon: '🎬', title: 'Actor & Director', desc: '"Vijay top movies" or "Nolan films" — get ranked filmographies instantly' },
  { icon: '❤️', title: 'Watchlist', desc: 'Save movies to your personal watchlist and revisit them anytime' },
];

const MOODS = ['😌 Relaxing', '😂 Funny', '😢 Emotional', '🔥 Action', '💀 Horror', '❤️ Romantic', '🧠 Thriller', '🚀 Adventure'];

export default function Welcome() {
  const [activeMood, setActiveMood] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setInterval(() => setActiveMood(m => (m + 1) % MOODS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: FONTS.body, overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,8,16,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={filmoLogo} alt="FilmoBot" style={{ width: '32px', height: '32px' }} />
          <span style={{ fontFamily: FONTS.display, fontSize: '22px', fontWeight: '700', color: COLORS.textMain }}>
            FilmoBot
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login" style={{
            padding: '10px 24px', borderRadius: '10px',
            border: `1px solid ${COLORS.border}`, color: COLORS.textMain,
            textDecoration: 'none', fontSize: '14px', fontWeight: '500',
            transition: 'all 0.2s',
          }}>
            Log in
          </Link>
          <Link to="/signup" style={{
            padding: '10px 24px', borderRadius: '10px',
            background: COLORS.gradientGold, color: '#0a0a14',
            textDecoration: 'none', fontSize: '14px', fontWeight: '700',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', textAlign: 'center', position: 'relative',
        background: COLORS.gradientHero,
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(245,200,66,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '760px', opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.25)',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '32px',
            fontSize: '13px', color: '#f5c842', fontWeight: '500',
          }}>
            <Sparkles size={13} /> AI-Powered Movie Recommendations
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: FONTS.display, fontSize: 'clamp(42px, 7vw, 76px)',
            fontWeight: '900', color: COLORS.textMain, lineHeight: '1.1',
            marginBottom: '12px', letterSpacing: '-2px',
          }}>
            Find Your Perfect
          </h1>
          <h1 style={{
            fontFamily: FONTS.display, fontSize: 'clamp(42px, 7vw, 76px)',
            fontWeight: '900', lineHeight: '1.1', marginBottom: '28px',
            letterSpacing: '-2px',
            background: COLORS.gradientGold,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Movie Tonight
          </h1>

          {/* Mood rotator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
          }}>
            <span style={{ color: COLORS.textSub, fontSize: '16px' }}>I'm in the mood for</span>
            <div style={{
              background: COLORS.bgElevated, border: `1px solid rgba(245,200,66,0.2)`,
              borderRadius: '100px', padding: '8px 20px',
              fontSize: '16px', fontWeight: '600', color: '#f5c842',
              minWidth: '160px', transition: 'all 0.3s',
            }}>
              {MOODS[activeMood]}
            </div>
          </div>

          <p style={{
            color: COLORS.textSub, fontSize: '18px', lineHeight: '1.7',
            marginBottom: '44px', maxWidth: '540px', margin: '0 auto 44px',
          }}>
            Just describe how you feel. FilmoBot understands your mood, language preference,
            favourite actors, and even song names to find exactly what you want.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{
              padding: '16px 36px', borderRadius: '14px',
              background: COLORS.gradientGold, color: '#0a0a14',
              textDecoration: 'none', fontSize: '16px', fontWeight: '700',
              boxShadow: '0 0 40px rgba(245,200,66,0.3)',
              transition: 'all 0.2s',
            }}>
              Start for Free →
            </Link>
            <Link to="/about" style={{
              padding: '16px 36px', borderRadius: '14px',
              border: `1px solid ${COLORS.border}`, color: COLORS.textMain,
              textDecoration: 'none', fontSize: '16px', fontWeight: '500',
              transition: 'all 0.2s',
            }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '100px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <p style={{ color: '#f5c842', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Simple as talking
          </p>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '42px', fontWeight: '700', color: COLORS.textMain }}>
            How FilmoBot Works
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', title: 'Describe your mood', example: '"I\'m tired after a long day at office"', icon: '💬' },
            { step: '02', title: 'FilmoBot understands', example: 'Detects: relaxing mood, your context', icon: '🧠' },
            { step: '03', title: 'Get perfect picks', example: 'Curated, genre-accurate films for you', icon: '🎬' },
          ].map((item, i) => (
            <div key={i} style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: '20px', padding: '32px 28px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '-10px', right: '20px',
                fontFamily: FONTS.display, fontSize: '72px', fontWeight: '900',
                color: 'rgba(245,200,66,0.05)',
              }}>{item.step}</div>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
              <h3 style={{ color: COLORS.textMain, fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{
                color: COLORS.textSub, fontSize: '14px',
                background: COLORS.bgElevated, borderRadius: '8px', padding: '10px 14px',
                fontStyle: 'italic',
              }}>
                {item.example}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <p style={{ color: '#f5c842', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Everything you need
          </p>
          <h2 style={{ fontFamily: FONTS.display, fontSize: '42px', fontWeight: '700', color: COLORS.textMain }}>
            Packed with Features
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: '16px', padding: '28px',
              transition: 'all 0.25s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(245,200,66,0.3)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ color: COLORS.textMain, fontWeight: '700', fontSize: '17px', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ color: COLORS.textSub, fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '100px 24px', textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(245,200,66,0.03), transparent)',
      }}>
        <h2 style={{
          fontFamily: FONTS.display, fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: '900', color: COLORS.textMain, marginBottom: '16px',
        }}>
          Ready to find your next
          <span style={{
            background: COLORS.gradientGold,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}> favourite film?</span>
        </h2>
        <p style={{ color: COLORS.textSub, fontSize: '18px', marginBottom: '36px' }}>
          Free forever. No credit card needed.
        </p>
        <Link to="/signup" style={{
          display: 'inline-block', padding: '18px 48px', borderRadius: '14px',
          background: COLORS.gradientGold, color: '#0a0a14',
          textDecoration: 'none', fontSize: '17px', fontWeight: '700',
          boxShadow: '0 0 50px rgba(245,200,66,0.25)',
        }}>
          Create Free Account →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '40px 24px', borderTop: `1px solid ${COLORS.border}`,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        gap: '16px', maxWidth: '1000px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={filmoLogo} alt="FilmoBot" style={{ width: '24px', height: '24px' }} />
          <span style={{ fontFamily: FONTS.display, fontWeight: '700', color: COLORS.textMain }}>FilmoBot</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'About', to: '/about' },
            { label: 'Contact', to: '/contact' },
          ].map(link => (
            <Link key={link.label} to={link.to} style={{
              color: COLORS.textSub, textDecoration: 'none', fontSize: '14px',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = '#f5c842'}
              onMouseLeave={e => e.target.style.color = COLORS.textSub}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>
          © 2025 FilmoBot. Built for cinema lovers.
        </p>
      </footer>
    </div>
  );
}