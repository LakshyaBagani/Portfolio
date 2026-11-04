import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // the "N" dev badge sits on top of the site's own bottom-left "Back to the doors" button;
  // compile and runtime errors still show without it
  devIndicators: false,
};

export default nextConfig;
