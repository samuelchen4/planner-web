const plugin = require('tailwindcss/plugin');
const { noteColors, themeVariables } = require('./design/tokens.cjs');

const noteVariables = (scheme) =>
  Object.fromEntries(
    Object.entries(noteColors[scheme]).flatMap(([name, c]) => [
      [`--note-${name}-paper`, c.paper],
      [`--note-${name}-edge`, c.edge],
    ]),
  );

module.exports = {
  darkMode: 'media',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  presets: [require('./design/tailwind-preset.cjs')],
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...themeVariables('light'), ...noteVariables('light') },
        '@media (prefers-color-scheme: dark)': {
          ':root': { ...themeVariables('dark'), ...noteVariables('dark') },
        },
      });
    }),
  ],
};
