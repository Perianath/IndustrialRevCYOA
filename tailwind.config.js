/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        paper: "#f7f3ea",
        soot: "#32302f",
        brick: "#9f3f2f",
        brass: "#b87924",
        canal: "#2f6f73",
        reform: "#5667a8",
        fog: "#d9d3c7"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(31, 41, 51, 0.14)"
      }
    }
  },
  plugins: []
};
