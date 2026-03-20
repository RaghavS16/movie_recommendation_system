// src/theme.js — FilmoBot Design System

export const COLORS = {
  // Backgrounds — deep cinematic layers
  bg:           '#080810',
  bgCard:       '#0e0e1a',
  bgElevated:   '#13131f',
  bgSurface:    '#1a1a2e',

  // Accents
  gold:         '#f5c842',
  goldDim:      '#c9a227',
  goldGlow:     'rgba(245,200,66,0.15)',
  indigo:       '#6366f1',
  indigoDim:    '#4f52c9',
  indigoGlow:   'rgba(99,102,241,0.15)',

  // Text
  textMain:     '#f0eee8',
  textSub:      '#7a7a9a',
  textMuted:    '#4a4a6a',

  // Borders
  border:       'rgba(255,255,255,0.07)',
  borderHover:  'rgba(245,200,66,0.3)',

  // Gradients
  gradientGold:   'linear-gradient(135deg, #f5c842, #c9a227)',
  gradientIndigo: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  gradientCard:   'linear-gradient(160deg, #0e0e1a 0%, #13131f 50%, #0a0a14 100%)',
  gradientHero:   'linear-gradient(160deg, #080810 0%, #0e0e2a 50%, #080810 100%)',
};

export const FONTS = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', system-ui, sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

export const COMMON_STYLES = {
  container: {
    minHeight: '100vh',
    background: COLORS.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONTS.body,
    padding: '32px 24px',
  },
  wrapper: {
    width: '100%',
    maxWidth: '460px',
  },
  buttonPrimary: {
    width: '100%',
    background: COLORS.gradientGold,
    color: '#0a0a14',
    fontWeight: '700',
    padding: '18px 24px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '24px',
    transition: 'all 0.25s',
    fontSize: '16px',
    fontFamily: FONTS.body,
    letterSpacing: '0.5px',
  },
  buttonSecondary: {
    width: '100%',
    background: 'transparent',
    color: COLORS.textMain,
    fontWeight: '600',
    padding: '18px 24px',
    borderRadius: '14px',
    border: `1px solid ${COLORS.border}`,
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.25s',
    fontSize: '16px',
    fontFamily: FONTS.body,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.bgElevated,
    color: COLORS.textMain,
    padding: '18px 16px',
    borderRadius: '12px',
    outline: 'none',
    border: `1px solid ${COLORS.border}`,
    fontSize: '16px',
    marginTop: '8px',
    boxSizing: 'border-box',
    fontFamily: FONTS.body,
    transition: 'border-color 0.2s',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    alignSelf: 'flex-start',
    display: 'flex',
    color: COLORS.textSub,
  },
};