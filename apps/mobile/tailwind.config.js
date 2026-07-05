/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1a73e8",
        secondary: "#e94560",
        success: "#2ecc71",
        warning: "#f39c12",
        danger: "#e74c3c",
        dark: {
          50: "#1a1a2e",
          100: "#16213e",
          200: "#0f3460",
        },
      },
    },
  },
  plugins: [],
};
