/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        clinical: "0 20px 60px rgba(15, 23, 42, 0.08)",
        soft: "0 12px 35px rgba(37, 99, 235, 0.10)",
      },
      colors: {
        blue: { 50:'#eef8f5', 100:'#d3ebe3', 200:'#b3dbce', 300:'#81c3ae', 500:'#168579', 600:'#0f766e', 700:'#115e59', 900:'#164e43', 950:'#10362e' },
        slate: { 50:'#f5f7f6', 100:'#edf1ef', 200:'#d9e1df', 300:'#bcc9c4', 400:'#849890', 500:'#52665d', 600:'#43584e', 700:'#35473e', 800:'#293a31', 900:'#1e2725', 950:'#151b1a' },
        clinical: {
          blue: "#0f766e",
          cyan: "#0f766e",
          ink: "#202827",
          mist: "#f4f6f5",
        },
      },
    },
  },
  plugins: [],
};
