import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta de marca Alleanza (cian)
        brand: {
          50: "#e8f7fe",
          100: "#c7ecfd",
          500: "#14b4ee",
          600: "#0c93cf",
          700: "#0a78ab",
        },
      },
    },
  },
  plugins: [],
};

export default config;
