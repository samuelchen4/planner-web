const plugin = require('tailwindcss/plugin');
const { themeVariables } = require('./design/tokens.cjs');

module.exports = {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [require('./design/tailwind-preset.cjs')],
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': themeVariables('light'),
        '@media (prefers-color-scheme: dark)': { ':root': themeVariables('dark') },
      });
    }),
  ],
};
