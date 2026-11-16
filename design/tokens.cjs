const palette = {
  light: {
    app: '#F4F4F8',
    card: '#FFFFFF',
    ink: '#111114',
    muted: '#6E6E76',
    subtle: '#A1A1AA',
    border: '#E5E5EA',
    accent: '#7C5CFA',
    'on-accent': '#FFFFFF',
    done: '#34C759',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
  },
  dark: {
    app: '#000000',
    card: '#1C1C1E',
    ink: '#F5F5F7',
    muted: '#98989F',
    subtle: '#636366',
    border: '#2C2C2E',
    accent: '#9D85FF',
    'on-accent': '#FFFFFF',
    done: '#30D158',
    success: '#30D158',
    warning: '#FF9F0A',
    danger: '#FF453A',
  },
};

const noteColors = {
  light: {
    yellow: { paper: '#FFF7CC', edge: '#EBCB4B' },
    pink: { paper: '#FFE4EC', edge: '#EE9AB6' },
    blue: { paper: '#E1F0FF', edge: '#86BCEB' },
    orange: { paper: '#FFEAD6', edge: '#F0AC6E' },
    lavender: { paper: '#EEE8FF', edge: '#B3A0F7' },
  },
  dark: {
    yellow: { paper: '#37301A', edge: '#8C7628' },
    pink: { paper: '#381F28', edge: '#8F4A63' },
    blue: { paper: '#1A2A38', edge: '#3F6C93' },
    orange: { paper: '#382819', edge: '#8F5E33' },
    lavender: { paper: '#28233D', edge: '#6A58B5' },
  },
};

const typeScale = {
  'large-title': ['34px', '41px'],
  title1: ['28px', '34px'],
  title2: ['22px', '28px'],
  title3: ['20px', '25px'],
  headline: ['17px', '22px'],
  body: ['17px', '22px'],
  callout: ['16px', '21px'],
  subhead: ['15px', '20px'],
  footnote: ['13px', '18px'],
  caption: ['12px', '16px'],
  caption2: ['11px', '13px'],
};

function hexToChannels(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function themeVariables(scheme) {
  return Object.fromEntries(
    Object.entries(palette[scheme]).map(([name, hex]) => [`--color-${name}`, hexToChannels(hex)]),
  );
}

module.exports = { palette, noteColors, typeScale, themeVariables };
