// src/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { COLORS, FONTS } from './theme';
import { API_BASE_URL } from './config';

const Field = ({ icon: Icon, type: initialType, placeholder, value, onChange }) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = initialType === 'password';
  const type = isPassword ? (showPw ? 'text' : 'password') : initialType;

  return (
    <div style={{
      borderRadius: '14px', padding: '2px',
      background: focused ? 'linear-gradient(135deg, #f5c842, #c9a227)' : 'transparent',
      border: focused ? 'none' : `1px solid ${COLORS.border}`,
      transition: 'all 0.25s',
    }}>
      <div style={{
        background: COLORS.bgElevated, borderRadius: '12px',
        display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px',
      }}>
        <Icon size={18} color={focused ? '#f5c842' : COLORS.textMuted} style={{ minWidth: 18, transition: 'color 0.2s' }} />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: COLORS.textMain, fontSize: '16px', padding: '18px 0',
            fontFamily: FONTS.body,
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(s => !s)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: COLORS.textMuted, display: 'flex', padding: '4px',
          }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        if (data.profile_image) localStorage.setItem('profileImage', data.profile_image);
        else localStorage.removeItem('profileImage');
        window.location.href = '/chat';
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Failed to connect. Check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bg,
      display: 'flex', fontFamily: FONTS.body,
    }}>
      {/* Left decorative panel */}
      <div style={{
        flex: 1, display: 'none', // hidden on small screens via inline — use media query in CSS
        background: 'linear-gradient(160deg, #0e0e1a, #13131f)',
        borderRight: `1px solid ${COLORS.border}`,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        padding: '60px',
      }} className="login-panel">
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎬</div>
        <h2 style={{
          fontFamily: FONTS.display, fontSize: '36px', fontWeight: '900',
          color: COLORS.textMain, textAlign: 'center', marginBottom: '16px',
        }}>
          Your cinema companion
        </h2>
        <p style={{ color: COLORS.textSub, textAlign: 'center', lineHeight: '1.7', maxWidth: '320px' }}>
          Discover films that match exactly how you feel, in any language, at any time.
        </p>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: COLORS.textSub, display: 'flex', alignItems: 'center',
            gap: '6px', marginBottom: '40px', fontSize: '14px', padding: 0,
          }}>
            <ChevronLeft size={18} /> Back
          </button>

          <div style={{ marginBottom: '36px' }}>
            <p style={{
              color: '#f5c842', fontSize: '12px', letterSpacing: '3px',
              textTransform: 'uppercase', marginBottom: '8px',
            }}>
              Welcome back
            </p>
            <h1 style={{
              fontFamily: FONTS.display, fontSize: '38px', fontWeight: '900',
              color: COLORS.textMain, marginBottom: '8px',
            }}>
              Sign In
            </h1>
            <p style={{ color: COLORS.textSub, fontSize: '15px' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#f5c842', textDecoration: 'none', fontWeight: '600' }}>
                Create one free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field icon={Mail} type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)} />
            <Field icon={Lock} type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)} />

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '12px 16px',
                color: '#f87171', fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <span onClick={() => navigate('/forgot-password')} style={{
                color: '#f5c842', fontSize: '14px', cursor: 'pointer', fontWeight: '600',
              }}>
                Forgot Password?
              </span>
            </div>

            <button type="submit" disabled={loading} style={{
              background: loading ? '#333' : 'linear-gradient(135deg, #f5c842, #c9a227)',
              color: loading ? COLORS.textSub : '#0a0a14',
              border: 'none', borderRadius: '14px', padding: '18px',
              fontSize: '16px', fontWeight: '700', cursor: loading ? 'default' : 'pointer',
              fontFamily: FONTS.body, marginTop: '8px',
              transition: 'all 0.25s',
              boxShadow: loading ? 'none' : '0 0 30px rgba(245,200,66,0.2)',
            }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .login-panel { display: flex !important; } }
      `}</style>
    </div>
  );
}