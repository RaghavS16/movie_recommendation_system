
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { COLORS, FONTS } from './theme';

// ── EmailJS credentials — loaded from .env (REACT_APP_ prefix required) ───
const EMAILJS_SERVICE_ID  = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY  = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
// ────────────────────────────────────────────────────────────────────────────

// ── Shared styles (defined outside component to prevent focus-loss bug) ─────
const inputStyle = {
  background: COLORS.bgElevated,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '14px 16px',
  color: COLORS.textMain,
  fontSize: '15px',
  fontFamily: FONTS.body,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
const onFocus = e => { e.target.style.borderColor = 'rgba(245,200,66,0.4)'; };
const onBlur  = e => { e.target.style.borderColor = COLORS.border; };

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ color: COLORS.textSub, fontSize: '13px', fontWeight: '500', letterSpacing: '0.5px' }}>
      {label}
    </label>
    {children}
  </div>
);
// ────────────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const navigate   = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const formRef    = useRef(null);

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent,    setSent]    = useState(false);
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');

  // Load EmailJS SDK once
  useEffect(() => {
    if (window.emailjs) return; // already loaded
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.async = true;
    script.onload = () => {
      window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    };
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');

    // Check credentials are set (guard against placeholder values)
    if (
      !EMAILJS_SERVICE_ID  ||
      !EMAILJS_TEMPLATE_ID ||
      !EMAILJS_PUBLIC_KEY
    ) {
      setError(
        'EmailJS is not configured yet. ' +
        'Please follow the setup steps in ContactPage.jsx comments, ' +
        'or email directly: 2023242015@student.annauniv.edu'
      );
      setSending(false);
      return;
    }

    try {
      if (!window.emailjs) throw new Error('EmailJS not loaded');

      await window.emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name:  name,
          from_email: email,
          subject:    subject || 'FilmoBot Contact',
          message:    message,
          to_email:   'raghav17radha@gmail.com',
        }
      );

      setSent(true);
      // Reset form
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err) {
      console.error('EmailJS error:', err);
      setError(
        'Failed to send message. ' +
        'Please email directly:raghav17radha@gmail.com'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: FONTS.body, color: COLORS.textMain }}>

      {/* Header */}
      <div style={{
        padding: '24px 40px', borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex', alignItems: 'center', gap: '16px',
        background: COLORS.bgCard,
      }}>
        <button
          type="button"
          onClick={() => navigate(isLoggedIn ? '/chat' : '/welcome')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: COLORS.textSub, display: 'flex', alignItems: 'center',
            gap: '6px', fontSize: '14px', padding: 0, fontFamily: FONTS.body,
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <h1 style={{ fontFamily: FONTS.display, fontSize: '24px', fontWeight: '700', color: COLORS.textMain }}>
          Contact Us
        </h1>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '60px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Mail size={28} color="#f5c842" />
          </div>
          <h2 style={{
            fontFamily: FONTS.display, fontSize: '36px',
            fontWeight: '700', marginBottom: '12px', color: COLORS.textMain,
          }}>
            Get in Touch
          </h2>
          <p style={{ color: COLORS.textSub, fontSize: '16px', lineHeight: '1.7' }}>
            Have a suggestion, found a bug, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        {/* Success */}
        {sent ? (
          <div style={{
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '20px', padding: '60px', textAlign: 'center',
          }}>
            <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{
              fontFamily: FONTS.display, fontSize: '24px',
              fontWeight: '700', marginBottom: '8px', color: COLORS.textMain,
            }}>
              Message Sent!
            </h3>
            <p style={{ color: COLORS.textSub, marginBottom: '24px' }}>
              Thanks for reaching out. We'll get back to you soon.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              style={{
                background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.25)',
                borderRadius: '10px', padding: '10px 24px',
                color: '#f5c842', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          /* Form */
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: '20px', padding: '40px',
              display: 'flex', flexDirection: 'column', gap: '20px',
            }}
          >
            {/* Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Your Name">
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Enter your name" required
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </Field>
              <Field label="Email Address">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                />
              </Field>
            </div>

            <Field label="Subject">
              <input
                value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="What's this about?"
                style={inputStyle} onFocus={onFocus} onBlur={onBlur}
              />
            </Field>

            <Field label="Message">
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Tell us more…" required rows={6}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </Field>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px', padding: '12px 16px',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                color: '#f87171', fontSize: '14px', lineHeight: '1.5',
              }}>
                <AlertCircle size={16} style={{ minWidth: 16, marginTop: '2px' }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                background: sending ? '#1a1a2e' : 'linear-gradient(135deg, #f5c842, #c9a227)',
                color: sending ? '#7a7a9a' : '#0a0a14',
                border: 'none', borderRadius: '12px', padding: '16px',
                fontSize: '16px', fontWeight: '700',
                cursor: sending ? 'default' : 'pointer',
                fontFamily: FONTS.body, transition: 'all 0.2s',
                boxShadow: sending ? 'none' : '0 0 30px rgba(245,200,66,0.2)',
              }}
            >
              <Send size={18} />
              {sending ? 'Sending…' : 'Send Message'}
            </button>

            {/* Direct email fallback */}
            <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '13px', marginTop: '-4px' }}>
              Or email directly:{' '}
              <a
                href="mailto:raghav17radha@gmail.com"
                style={{ color: '#f5c842', textDecoration: 'none' }}
              >
                raghav17radha@gmail.com
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}