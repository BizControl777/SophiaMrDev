/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sophia: {
          bg: '#07080F',
          bg2: '#0E1020',
          bg3: '#141629',
          card: '#181B30',
          card2: '#1E2240',
          border: '#252A45',
          border2: '#2E3560',
          primary: '#5B6EF5',
          primary2: '#7B8EFF',
          accent: '#00C9A7',
          accent2: '#F5A623',
          danger: '#F55B7A',
          text: '#E8EAF6',
          text2: '#9BA3CC',
          text3: '#5A6494',
        }
      },
      fontFamily: {
        head: ['Syne'],
        body: ['DM Sans'],
      }
    },
  },
  plugins: [],
};
