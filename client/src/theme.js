// src/theme.js

export const COLORS = {
  // The dark gradient background from your files
  bgGradient: 'linear-gradient(to bottom, #1a1a1a, #0f0f0f)', 
  cardBg: '#2a2a2a',    // The lighter dark used for inputs
  primaryGradient: 'linear-gradient(to right, #6366F1, #8b5cf6)', // Purple/Blue button
  primaryHover: 'linear-gradient(to right, #7c3aed, #a855f7)',
  textMain: '#FFFFFF',
  textSub: '#9CA3AF',   // gray-400
  border: '#333333',
};

export const COMMON_STYLES = {
  container: {
    minHeight: '100vh',
    background: COLORS.bgGradient,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    padding: '32px 24px', // px-6 py-8
  },
  wrapper: {
    width: '100%',
    maxWidth: '475px', // max-w-sm
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    color: 'white',
    padding: '20px 16px', // py-3 px-4
    borderRadius: '8px',  // rounded-lg
    outline: 'none',
    border: 'none',
    fontSize: '20px',
    marginTop: '8px',
    boxSizing: 'border-box', // Crucial for inputs
  },
  buttonPrimary: {
    width: '100%',
    background: COLORS.primaryGradient,
    color: 'white',
    fontWeight: '600',
    padding: '20px 24px',
    borderRadius: '9999px', // rounded-full
    border: 'none',
    cursor: 'pointer',
    marginTop: '32px',
    transition: 'all 0.2s',
    fontSize: '20px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    marginBottom: '32px',
    alignSelf: 'flex-start',
    display: 'flex',
  }
};