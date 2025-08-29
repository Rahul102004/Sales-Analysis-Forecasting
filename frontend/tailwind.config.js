/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { inter: ['Inter','system-ui','-apple-system','Segoe UI','Roboto','Ubuntu','Cantarell','Noto Sans','Helvetica Neue','Arial','sans-serif'] },
      colors: {
        navy: "#0F1B3B", // sampled background
        navy2: "#0B132B",
        panel: "#101E3F",
        card: "#0F1B3B",
        outline: "#2EACC1",
        aqua: "#36D0E4",
        cyan: "#2EACC1",
        tick: "#2EACC1",
        textPrimary: "#E6EDF5",
        textSecondary: "#AAB6CA",
        badgeGreen: "#70C839",
        badgeGreenBg: "#123418",
        danger: "#E74C3C",
        dangerBg: "#3A1212",
        tableBorder: "#1F2A4A"
      },
      boxShadow: {
        card: "0 0 0 1px rgba(46,172,193,0.08), inset 0 1px 0 rgba(255,255,255,0.02)"
      },
      borderRadius: {
        '2xl': '1rem'
      }
    },
  },
  plugins: [],
}
