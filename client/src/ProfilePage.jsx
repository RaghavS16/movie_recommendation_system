// src/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { User, Mail, Shield, Edit2, Check, X, Camera } from 'lucide-react';
import { COLORS, FONTS } from './theme';
import { API_BASE_URL } from './config';

const Field = ({ label, value, type = 'text', editing, onChange }) => {
  const [focused, setFocused] = useState(false);
  if (!editing) {
    return (
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '20px' }}>
        <label style={{ color: COLORS.textSub, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{label}</label>
        <span style={{ fontSize: '17px', color: COLORS.textMain }}>{value || '—'}</span>
      </div>
    );
  }
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '20px' }}>
      <label style={{ color: COLORS.textSub, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{label}</label>
      <div style={{
        borderRadius: '12px', padding: '2px',
        background: focused ? 'linear-gradient(135deg, #f5c842, #c9a227)' : 'transparent',
        border: focused ? 'none' : `1px solid ${COLORS.border}`,
      }}>
        <input
          type={type} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', background: COLORS.bgElevated, border: 'none', outline: 'none',
            borderRadius: '10px', padding: '14px 16px',
            color: COLORS.textMain, fontSize: '16px', fontFamily: FONTS.body,
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
};

export default function ProfilePage({ user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  // Initialize directly from user prop so the image shows on first render
  const [form, setForm] = useState(() => ({
    username:     user?.username     || '',
    email:        user?.email        || '',
    profileImage: user?.profileImage || null,
  }));
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    if (user) setForm({ username: user.username || '', email: user.email || '', profileImage: user.profileImage || null });
  }, [user]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, profileImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const fd = new FormData();
      fd.append('username', form.username);
      fd.append('email', form.email);
      if (imageFile) fd.append('profileImage', imageFile);
      const res = await fetch(`${API_BASE_URL}/update-profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const result = await res.json();
        setUser({ ...user, username: result.username, email: result.email, profileImage: result.profile_image });
        localStorage.setItem('username', result.username);
        localStorage.setItem('email', result.email);
        if (result.profile_image) localStorage.setItem('profileImage', result.profile_image);
        setEditing(false);
        setImageFile(null);
      } else {
        alert('Update failed. Please try again.');
      }
    } catch { alert('Connection error.'); }
    finally { setLoading(false); }
  };

  const handleCancel = () => {
    setForm({ username: user?.username || '', email: user?.email || '', profileImage: user?.profileImage || null });
    setEditing(false);
    setImageFile(null);
  };

  return (
    <>
    <div style={{ display: 'flex', height: '100vh', background: COLORS.bg, fontFamily: FONTS.body }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto' }}>

        <div style={{
          padding: '32px 40px', borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.bgCard, position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={22} color="#f5c842" />
            <h1 style={{ fontFamily: FONTS.display, fontSize: '26px', fontWeight: '700', color: COLORS.textMain }}>
              My Profile
            </h1>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
              borderRadius: '10px', padding: '10px 18px',
              color: COLORS.textMain, cursor: 'pointer',
              fontSize: '14px', fontWeight: '500', fontFamily: FONTS.body,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,200,66,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
            >
              <Edit2 size={15} /> Edit Profile
            </button>
          )}
        </div>

        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>

          {/* Avatar + name block */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '28px',
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: '20px', padding: '32px', marginBottom: '28px',
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                onClick={() => { if (!editing && form.profileImage) setShowFullImage(true); }}
                style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: COLORS.bgElevated, overflow: 'hidden',
                  border: editing ? '3px solid #f5c842' : `3px solid ${COLORS.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  cursor: (!editing && form.profileImage) ? 'zoom-in' : 'default',
                  boxShadow: (!editing && form.profileImage) ? '0 0 0 0 rgba(245,200,66,0)' : 'none',
                }}
                onMouseEnter={e => { if (!editing && form.profileImage) e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,200,66,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                {form.profileImage
                  ? <img src={form.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={44} color={COLORS.textMuted} />
                }
              </div>
              {editing && (
                <label style={{
                  position: 'absolute', bottom: 0, right: 0,
                  background: 'linear-gradient(135deg, #f5c842, #c9a227)',
                  borderRadius: '50%', width: '30px', height: '30px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <Camera size={14} color="#0a0a14" />
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
                </label>
              )}
            </div>
            <div>
              <h2 style={{ fontFamily: FONTS.display, fontSize: '26px', fontWeight: '700', color: COLORS.textMain, marginBottom: '6px' }}>
                {form.username || 'User'}
              </h2>
              <span style={{
                background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.25)',
                borderRadius: '100px', padding: '4px 14px',
                fontSize: '13px', color: '#f5c842', fontWeight: '600',
              }}>
                {user?.plan || 'Free Plan'}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div style={{
            background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: '20px', padding: '32px',
            display: 'flex', flexDirection: 'column', gap: '24px',
          }}>
            <Field label="Username" value={form.username} editing={editing}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            <Field label="Email Address" type="email" value={form.email} editing={editing}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />

            <div>
              <label style={{ color: COLORS.textSub, fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Security
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80' }}>
                <Shield size={18} />
                <span style={{ fontSize: '15px', fontWeight: '500' }}>Account Verified</span>
              </div>
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button onClick={handleSave} disabled={loading} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #f5c842, #c9a227)',
                  color: '#0a0a14', border: 'none', borderRadius: '12px', padding: '14px',
                  fontSize: '15px', fontWeight: '700', cursor: loading ? 'default' : 'pointer',
                  fontFamily: FONTS.body,
                }}>
                  <Check size={17} /> {loading ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={handleCancel} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: COLORS.bgElevated, color: COLORS.textSub,
                  border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '14px',
                  fontSize: '15px', fontWeight: '500', cursor: 'pointer', fontFamily: FONTS.body,
                }}>
                  <X size={17} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ── FULL IMAGE MODAL ── */}
    {showFullImage && form.profileImage && (
      <div
        onClick={() => setShowFullImage(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          cursor: 'zoom-out',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setShowFullImage(false)}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', fontSize: '20px',
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>

        {/* Image */}
        <img
          src={form.profileImage}
          alt="Profile"
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: '16px',
            objectFit: 'contain',
            boxShadow: '0 0 80px rgba(245,200,66,0.2), 0 0 0 4px rgba(245,200,66,0.3)',
            cursor: 'default',
          }}
        />
      </div>
    )}
    </>
  );
}