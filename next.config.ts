import type { NextConfig } from "next";

// Static export for GitHub Pages at kamalsoft.github.io/holidaydeals.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/holidaydeals",
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
