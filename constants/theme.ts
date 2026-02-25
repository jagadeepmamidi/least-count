export const COLORS = {
  // Nothing-inspired pure blacks
  background: '#000000',
  surface: '#0c0c0c',
  surfaceLight: '#161616',
  surfaceHighlight: '#1e1e1e',

  // Primary accent — warm ivory, like aged playing card paper
  accent: '#e8dcc8',
  accentDim: '#c4b9a8',
  accentGlow: 'rgba(232, 220, 200, 0.06)',
  accentSoft: 'rgba(232, 220, 200, 0.12)',

  // Card suits — red only for hearts/diamonds
  suitRed: '#e63946',
  suitRedGlow: 'rgba(230, 57, 70, 0.10)',
  suitBlack: '#999999',

  // Winner gold
  gold: '#d4a574',
  goldGlow: 'rgba(212, 165, 116, 0.12)',

  // Status
  warning: '#e6a23c',
  warningGlow: 'rgba(230, 162, 60, 0.10)',
  danger: '#e63946',
  dangerGlow: 'rgba(230, 57, 70, 0.10)',
  success: '#4ade80',
  successGlow: 'rgba(74, 222, 128, 0.10)',

  // Typography
  text: '#f5f0e8',
  textSecondary: '#8a8278',
  textMuted: '#5a554e',

  // Borders
  border: '#1a1917',
  borderLight: '#2a2825',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.85)',
  white: '#ffffff',
  black: '#000000',
};

// Card suit symbols
export const SUITS = {
  spade: '♠',
  heart: '♥',
  diamond: '♦',
  club: '♣',
  all: '♠ ♥ ♦ ♣',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  full: 999,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 40,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#e8dcc8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#e8dcc8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#e8dcc8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const ELIMINATION_THRESHOLD = 201;
export const WARNING_THRESHOLD = 150;
