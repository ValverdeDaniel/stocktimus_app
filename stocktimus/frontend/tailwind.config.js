/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enables dark mode with a "dark" class
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Updated Spotify-inspired brand colors for better contrast
        primary: '#1DB954',      // Spotify green
        background: '#0B0B0B',   // Deeper black background for full-page
        surface: '#1E1E1E',      // Lighter dark gray for cards/panels to stand out
        text: '#FFFFFF',         // Near-white text for strong readability
        muted: '#B3B3B3',        // Spotify's muted gray text
        accent: '#1ED760',       // Spotify's secondary green accent
      },
    },
  },
  plugins: [],
};
