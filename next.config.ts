import type { NextConfig } from "next";

// Static export for GitHub Pages at kamalsoft.github.io/holidaydeals.
const nextConfig: NextConfig = {
  output: "export",
  // Production (GitHub Pages) lives under /holidaydeals; local dev serves from the root.
  basePath: process.env.NODE_ENV === "production" ? "/holidaydeals" : "",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
