// src/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { COLORS, FONTS } from './theme';
import { API_BASE_URL } from './config';

// ── Shared focused input wrapper ───────────────────────────────────────────────
const Field = ({ icon: Icon, type: initialType, placeholder, value, onChange, required = true }) => {
  const [focused, setFocused]   = useState(false);
  const [showPw,  setShowPw]    = useState(false);
  const isPassword = initialType === 'password';
  const type       = isPassword ? (showPw ? 'text' : 'password') : initialType;

  return (
    <div style={{
      borderRadius: '14px', padding: '2px',
      background: focused ? 'linear-gradient(135deg, #f5c842, #c9a227)' : 'transparent',
      border:     focused ? 'none' : `1px solid ${COLORS.border}`,
      transition: 'all 0.25s',
    }}>
      <div style={{
        background: COLORS.bgElevated, borderRadius: '12px',
        display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px',
      }}>
        <Icon size={18} color={focused ? '#f5c842' : COLORS.textMuted}
          style={{ minWidth: 18, transition: 'color 0.2s' }} />
        <input
          type={type} placeholder={placeholder} value={value} onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
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

// ── Single OTP digit box ────────────────────────────────────────────────────────
const OtpBox = ({ value, onChange, onKeyDown, onFocus, onBlur, focused }) => (
  <div style={{
    borderRadius: '12px', padding: '2px', flex: 1,
    background: focused ? 'linear-gradient(135deg, #f5c842, #c9a227)' : 'transparent',
    border:     focused ? 'none' : `1px solid ${COLORS.border}`,
    transition: 'all 0.25s',
  }}>
    <input
      type="text" maxLength="1" value={value}
      onChange={onChange} onKeyDown={onKeyDown}
      onFocus={onFocus} onBlur={onBlur}
      style={{
        width: '100%', height: '58px', background: COLORS.bgElevated,
        border: 'none', outline: 'none', borderRadius: '10px',
        textAlign: 'center', fontSize: '24px', fontWeight: '700',
        color: focused ? '#f5c842' : COLORS.textMain,
        fontFamily: FONTS.display, transition: 'color 0.2s',
      }}
    />
  </div>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]                   = useState(1); // 1=email, 2=otp+password, 3=done
  const [email, setEmail]                 = useState('');
  const [otp, setOtp]                     = useState(Array(6).fill(''));
  const [focusedOtp, setFocusedOtp]       = useState(-1);
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPw]   = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  // ── OTP helpers ──────────────────────────────────────────────────────────────
  const handleOtpChange = (el, idx) => {
    if (isNaN(el.value)) return;
    const next = [...otp];
    next[idx] = el.value;
    setOtp(next);
    if (el.value) {
      const nw = el.parentElement?.nextElementSibling?.querySelector('input');
      nw?.focus();
    }
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx]) {
      const pw = e.target.parentElement?.previousElementSibling?.querySelector('input');
      pw?.focus();
    }
  };

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────────
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE_URL}/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setStep(2);
      else setError(data.message || 'Failed to send OTP');
    } catch {
      setError('Server error. Make sure the backend is running.');
    } finally { setLoading(false); }
  };

  // ── Step 2: Reset password ───────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpStr, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) setStep(3);
      else setError(data.message || 'Reset failed. Check your OTP and try again.');
    } catch {
      setError('Server error.');
    } finally { setLoading(false); }
  };

  // ── Shared layout ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONTS.body, padding: '32px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Back button */}
        <button
          onClick={() => step === 2 ? setStep(1) : navigate('/login')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: COLORS.textSub, display: 'flex', alignItems: 'center',
            gap: '6px', marginBottom: '40px', fontSize: '14px', padding: 0,
          }}
        >
          <ChevronLeft size={18} /> {step === 2 ? 'Back' : 'Back to Login'}
        </button>

        {/* ── STEP 1: Email ── */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: '36px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <Mail size={24} color="#f5c842" />
              </div>
              <p style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Account Recovery
              </p>
              <h1 style={{ fontFamily: FONTS.display, fontSize: '34px', fontWeight: '900', color: COLORS.textMain, marginBottom: '10px' }}>
                Forgot Password?
              </h1>
              <p style={{ color: COLORS.textSub, fontSize: '15px', lineHeight: '1.6' }}>
                Enter your email and we'll send you a 6-digit code to reset your password.
              </p>
            </div>

            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field icon={Mail} type="email" placeholder="Your email address"
                value={email} onChange={e => setEmail(e.target.value)} />

              {error && <ErrorBox message={error} />}

              <PrimaryBtn loading={loading} label="Send Code" loadingLabel="Sending…" />
            </form>

            <p style={{ textAlign: 'center', color: COLORS.textSub, fontSize: '14px', marginTop: '24px' }}>
              Remember it?{' '}
              <Link to="/login" style={{ color: '#f5c842', textDecoration: 'none', fontWeight: '600' }}>
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* ── STEP 2: OTP + new password ── */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: '36px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <Lock size={24} color="#f5c842" />
              </div>
              <p style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Step 2 of 2
              </p>
              <h1 style={{ fontFamily: FONTS.display, fontSize: '34px', fontWeight: '900', color: COLORS.textMain, marginBottom: '10px' }}>
                Reset Password
              </h1>
              <p style={{ color: COLORS.textSub, fontSize: '15px', lineHeight: '1.6' }}>
                Enter the 6-digit code sent to <strong style={{ color: COLORS.textMain }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* OTP row */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {otp.map((digit, idx) => (
                  <OtpBox
                    key={idx}
                    value={digit}
                    focused={focusedOtp === idx}
                    onChange={e => handleOtpChange(e.target, idx)}
                    onKeyDown={e => handleOtpKey(e, idx)}
                    onFocus={() => setFocusedOtp(idx)}
                    onBlur={() => setFocusedOtp(-1)}
                  />
                ))}
              </div>

              <Field icon={Lock} type="password" placeholder="New password"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Field icon={Lock} type="password" placeholder="Confirm new password"
                value={confirmPassword} onChange={e => setConfirmPw(e.target.value)} />

              {error && <ErrorBox message={error} />}

              <PrimaryBtn loading={loading} label="Reset Password" loadingLabel="Resetting…" />
            </form>

            <button
              onClick={() => handleSendCode({ preventDefault: () => {} })}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: COLORS.textSub, fontSize: '14px', marginTop: '16px',
                display: 'block', width: '100%', textAlign: 'center',
                fontFamily: FONTS.body,
              }}
            >
              Didn't receive the code?{' '}
              <span style={{ color: '#f5c842', fontWeight: '600' }}>Resend</span>
            </button>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircle size={36} color="#4ade80" />
            </div>
            <h1 style={{
              fontFamily: FONTS.display, fontSize: '32px', fontWeight: '900',
              color: COLORS.textMain, marginBottom: '12px',
            }}>
              Password Reset!
            </h1>
            <p style={{ color: COLORS.textSub, fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #f5c842, #c9a227)',
                color: '#0a0a14', border: 'none', borderRadius: '14px', padding: '18px',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: FONTS.body,
                boxShadow: '0 0 30px rgba(245,200,66,0.2)',
              }}
            >
              Sign In →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small shared sub-components ───────────────────────────────────────────────

const ErrorBox = ({ message }) => (
  <div style={{
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px', padding: '12px 16px',
    color: '#f87171', fontSize: '14px', lineHeight: '1.5',
  }}>
    {message}
  </div>
);

const PrimaryBtn = ({ loading, label, loadingLabel }) => (
  <button type="submit" disabled={loading} style={{
    width: '100%',
    background: loading ? '#1a1a2e' : 'linear-gradient(135deg, #f5c842, #c9a227)',
    color: loading ? COLORS.textSub : '#0a0a14',
    border: 'none', borderRadius: '14px', padding: '18px',
    fontSize: '16px', fontWeight: '700',
    cursor: loading ? 'default' : 'pointer',
    fontFamily: FONTS.body, marginTop: '4px',
    boxShadow: loading ? 'none' : '0 0 30px rgba(245,200,66,0.2)',
    transition: 'all 0.25s',
  }}>
    {loading ? loadingLabel : label}
  </button>
);