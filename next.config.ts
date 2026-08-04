import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Lets the dev server accept requests coming in via the machine's LAN IP
  // (e.g. a colleague opening a link from a Teams notification) instead of
  // only `localhost` — without this, Next.js silently blocks/degrades
  // cross-origin dev requests (HMR, Server Actions, etc.), which shows up as
  // lag, unresponsive buttons, and stalls on form submits.
  allowedDevOrigins: ["192.168.0.120"],
};

export default nextConfig;
