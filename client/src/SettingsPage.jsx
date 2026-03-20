// src/SettingsPage.jsx
// Settings are persisted to localStorage so they survive navigation.
// ChatPage reads 'filmobot_settings' on every message send.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Globe, Bell, Shield, Trash2, ChevronRight, Check } from 'lucide-react';
import Sidebar from './Sidebar';
import { COLORS, FONTS } from './theme';
import { API_BASE_URL } from './config';

const LANGUAGES = [
  { code: 'all', label: 'All Languages' },
  { code: 'ta',  label: 'Tamil' },
  { code: 'hi',  label: 'Hindi' },
  { code: 'en',  label: 'English' },
  { code: 'ml',  label: 'Malayalam' },
  { code: 'te',  label: 'Telugu' },
  { code: 'ko',  label: 'Korean' },
  { code: 'ja',  label: 'Japanese' },
  { code: 'fr',  label: 'French' },
  { code: 'es',  label: 'Spanish' },
];

// ── Default settings ───────────────────────────────────────────────────────
const DEFAULTS = {
  defaultLang:      'all',
  movieCount:       '5',
  notifyNew:        false,
  notifyTrending:   false,
  saveHistory:      true,
};

// ── Public helper: other components call this to read current settings ─────
export function getSettings() {
  try {
    const saved = localStorage.getItem('filmobot_settings');
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

// ── Components ─────────────────────────────────────────────────────────────

const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    style={{
      width: '46px', height: '26px', borderRadius: '13px',
      background: value ? 'linear-gradient(135deg, #f5c842, #c9a227)' : '#1a1a2e',
      border: `1px solid ${value ? '#f5c842' : COLORS.border}`,
      cursor: 'pointer', position: 'relative', transition: 'all 0.25s', flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute', top: '4px',
      left: value ? '24px' : '4px',
      width: '16px', height: '16px', borderRadius: '50%',
      background: value ? '#0a0a14' : COLORS.textMuted,
      transition: 'left 0.25s',
    }} />
  </button>
);

const Section = ({ title, icon: Icon, children }) => (
  <div style={{
    background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
    borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
  }}>
    <div style={{
      padding: '18px 24px', borderBottom: `1px solid ${COLORS.border}`,
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <Icon size={18} color="#f5c842" />
      <h3 style={{ fontWeight: '600', fontSize: '15px', color: COLORS.textMain, margin: 0 }}>{title}</h3>
    </div>
    <div style={{ padding: '8px 0' }}>{children}</div>
  </div>
);

const Row = ({ label, desc, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 24px', gap: '16px',
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '15px', color: COLORS.textMain, fontWeight: '500' }}>{label}</div>
      {desc && <div style={{ fontSize: '13px', color: COLORS.textSub, marginTop: '2px' }}>{desc}</div>}
    </div>
    {children}
  </div>
);

const selectStyle = {
  background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
  borderRadius: '8px', padding: '8px 12px', color: COLORS.textMain,
  fontSize: '14px', fontFamily: FONTS.body, cursor: 'pointer', outline: 'none',
};

// ── Main component ──────────────────────────────────────────────────────────
export default function SettingsPage() {
  const navigate = useNavigate();
  const [saved,  setSaved]  = useState(false); // shows "Saved" toast

  // Load from localStorage on mount — never reset on navigation
  const [prefs, setPrefs] = useState(() => getSettings());

  // Save to localStorage whenever prefs change
  useEffect(() => {
    localStorage.setItem('filmobot_settings', JSON.stringify(prefs));
    // Show brief "Saved" indicator
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(t);
  }, [prefs]);

  const set = k => v => setPrefs(p => ({ ...p, [k]: v }));

  const [clearing, setClearing] = useState(false);

  const clearHistory = async () => {
    if (!window.confirm('Clear ALL chat history? This deletes every saved chat permanently and cannot be undone.')) return;

    setClearing(true);
    const token = localStorage.getItem('token');

    try {
      // 1. Get every saved session from localStorage
      const saved = JSON.parse(localStorage.getItem('chat_sessions') || '[]');

      // 2. Delete each one from the database
      const deletePromises = saved.map(session =>
        fetch(`${API_BASE_URL}/delete-session/${session.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {}) // ignore individual failures
      );
      await Promise.all(deletePromises);

      // 3. Clear localStorage
      localStorage.removeItem('chat_sessions');

      alert('All chat history deleted successfully.');
    } catch {
      // Even if API fails, clear localStorage
      localStorage.removeItem('chat_sessions');
      alert('Chat history cleared locally.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: COLORS.bg, fontFamily: FONTS.body }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Header */}
        <div style={{
          padding: '28px 40px', borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: COLORS.bgCard, position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={22} color="#f5c842" />
            <h1 style={{ fontFamily: FONTS.display, fontSize: '26px', fontWeight: '700', color: COLORS.textMain, margin: 0 }}>
              Settings
            </h1>
          </div>
          {/* Auto-save indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            opacity: saved ? 1 : 0, transition: 'opacity 0.3s',
            color: '#4ade80', fontSize: '13px', fontWeight: '500',
          }}>
            <Check size={15} /> Saved
          </div>
        </div>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '36px 24px' }}>

          {/* ── Recommendations ── */}
          <Section title="Recommendations" icon={Globe}>
            <Row
              label="Default Language"
              desc="Shown to FilmoBot when you don't specify a language"
            >
              <select
                value={prefs.defaultLang}
                onChange={e => set('defaultLang')(e.target.value)}
                style={selectStyle}
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </Row>
            <div style={{ height: '1px', background: COLORS.border, margin: '0 24px' }} />
            <Row
              label="Movies per Response"
              desc="How many movies FilmoBot shows per recommendation"
            >
              <select
                value={prefs.movieCount}
                onChange={e => set('movieCount')(e.target.value)}
                style={selectStyle}
              >
                {['3', '5', '7', '10'].map(n => (
                  <option key={n} value={n}>{n} movies</option>
                ))}
              </select>
            </Row>
            {/* Current value reminder */}
            <div style={{
              margin: '0 24px 12px',
              padding: '10px 14px',
              background: 'rgba(245,200,66,0.06)',
              border: '1px solid rgba(245,200,66,0.15)',
              borderRadius: '10px',
              fontSize: '13px', color: '#f5c842',
            }}>
              Active: <strong>{prefs.movieCount} movies</strong> per reply
              {prefs.defaultLang !== 'all' && (
                <> · <strong>{LANGUAGES.find(l => l.code === prefs.defaultLang)?.label}</strong> only</>
              )}
            </div>
          </Section>

          {/* ── Notifications ── */}
          <Section title="Notifications" icon={Bell}>
            <Row label="New Releases" desc="Get notified about new movies in your preferred genres">
              <Toggle value={prefs.notifyNew} onChange={set('notifyNew')} />
            </Row>
            <div style={{ height: '1px', background: COLORS.border, margin: '0 24px' }} />
            <Row label="Trending Now" desc="Weekly digest of trending films">
              <Toggle value={prefs.notifyTrending} onChange={set('notifyTrending')} />
            </Row>
          </Section>

          {/* ── Privacy ── */}
          <Section title="Privacy & Data" icon={Shield}>
            <Row label="Save Chat History" desc="Keep your conversation history across sessions">
              <Toggle value={prefs.saveHistory} onChange={set('saveHistory')} />
            </Row>
            <div style={{ height: '1px', background: COLORS.border, margin: '0 24px' }} />
            <Row label="Clear Chat History" desc="Permanently delete all saved conversations">
              <button
                type="button"
                onClick={clearHistory}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '8px', padding: '8px 16px',
                  color: '#f87171', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: FONTS.body,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Trash2 size={14} /> {clearing ? 'Clearing…' : 'Clear All'}
              </button>
            </Row>
          </Section>

          {/* ── App links ── */}
          <div style={{
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: '16px', overflow: 'hidden',
          }}>
            {[
              { label: 'About FilmoBot',    action: () => navigate('/about') },
              { label: 'Contact & Support', action: () => navigate('/contact') },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <div style={{ height: '1px', background: COLORS.border }} />}
                <button
                  type="button"
                  onClick={item.action}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer',
                    color: COLORS.textMain, fontFamily: FONTS.body, fontSize: '15px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.bgElevated}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {item.label}
                  <ChevronRight size={16} color={COLORS.textMuted} />
                </button>
              </React.Fragment>
            ))}
          </div>

          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '13px', marginTop: '28px' }}>
            Settings are saved automatically · FilmoBot v2.0 🎬
          </p>
        </div>
      </div>
    </div>
  );
}