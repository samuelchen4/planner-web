const { palette, typeScale } = require('./tokens.cjs');

const colors = Object.fromEntries(
  Object.keys(palette.light).map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`]),
);

module.exports = {
  theme: {
    extend: {
      colors,
      fontSize: typeScale,
      fontFamily: {
        rounded: ['ui-rounded', 'SF Pro Rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
};
