// tailwind.config.js
export default {
  content: ["./index.html","./pages/**/*.html","./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      container: { center: true, padding: "1rem" },
      colors: {
        accent:  { 500:"#3b82f6" },
        success: { 500:"#22c55e" },
        danger:  { 500:"#ef4444" }
      },
      boxShadow: {
        soft: "0 10px 25px -10px rgba(0,0,0,0.15)",
        card: "0 6px 16px rgba(17,24,39,0.08)"
      },
      borderRadius: { '2xl': "1.25rem", '3xl': "1.75rem" }
    }
  },
  plugins: [],
};
