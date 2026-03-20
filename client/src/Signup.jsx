// src/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Mail, Lock, User, Camera } from 'lucide-react';
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
          type={type} placeholder={placeholder} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: COLORS.textMain, fontSize: '16px', padding: '18px 0',
            fontFamily: FONTS.body,
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(s => !s)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, display: 'flex', padding: '4px',
          }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!pwRegex.test(form.password)) {
      setError('Password needs 8+ chars, uppercase, lowercase, number and special character.');
      return;
    }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('username', form.username);
      fd.append('email', form.email);
      fd.append('password', form.password);
      if (imageFile) fd.append('profileImage', imageFile);
      const res = await fetch(`${API_BASE_URL}/register`, { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) { alert('Account created! Please sign in.'); navigate('/login'); }
      else setError(data.message || 'Registration failed');
    } catch { setError('Failed to connect to server.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONTS.body, padding: '32px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: COLORS.textSub, display: 'flex', alignItems: 'center',
          gap: '6px', marginBottom: '36px', fontSize: '14px', padding: 0,
        }}>
          <ChevronLeft size={18} /> Back
        </button>

        <div style={{ marginBottom: '32px' }}>
          <p style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Join FilmoBot
          </p>
          <h1 style={{
            fontFamily: FONTS.display, fontSize: '36px', fontWeight: '900',
            color: COLORS.textMain, marginBottom: '8px',
          }}>Create Account</h1>
          <p style={{ color: COLORS.textSub, fontSize: '15px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#f5c842', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
          </p>
        </div>

        {/* Avatar upload */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: COLORS.bgElevated,
              border: `2px dashed ${COLORS.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', transition: 'border-color 0.2s',
            }}>
              {preview
                ? <img src={preview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={32} color={COLORS.textMuted} />
              }
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'linear-gradient(135deg, #f5c842, #c9a227)',
              borderRadius: '50%', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={14} color="#0a0a14" />
            </div>
            <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          </label>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field icon={User}  type="text"     placeholder="Username"         value={form.username} onChange={set('username')} />
          <Field icon={Mail}  type="email"    placeholder="Email address"    value={form.email}    onChange={set('email')} />
          <Field icon={Lock}  type="password" placeholder="Password"         value={form.password} onChange={set('password')} />
          <Field icon={Lock}  type="password" placeholder="Confirm password" value={form.confirm}  onChange={set('confirm')} />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '12px 16px', color: '#f87171', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? '#333' : 'linear-gradient(135deg, #f5c842, #c9a227)',
            color: loading ? COLORS.textSub : '#0a0a14',
            border: 'none', borderRadius: '14px', padding: '18px',
            fontSize: '16px', fontWeight: '700', cursor: loading ? 'default' : 'pointer',
            fontFamily: FONTS.body, marginTop: '8px',
            boxShadow: loading ? 'none' : '0 0 30px rgba(245,200,66,0.2)',
          }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>
      </div>
    </div>
  );
}