/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      colors: {
        erc: "#0A3D91",
        fms: "#0B6E4F",
        super: "#6D2E9B",
        ink: {
          950: "#081017"
        },
        brand: {
          50: "#e9f9f3",
          100: "#cef2e2",
          500: "#1a8f5d",
          700: "#146c47"
        },
        ember: {
          500: "#d9471a"
        },
        ambertone: {
          500: "#d6a300"
        }
      },
      boxShadow: {
        panel: "0 10px 30px rgba(7, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};
