import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
});

// Allow next/image to load album art from the configured stream host.
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
try {
  if (process.env.NEXT_PUBLIC_STREAM_URL) {
    const u = new URL(process.env.NEXT_PUBLIC_STREAM_URL);
    remotePatterns.push({
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
    });
  }
} catch {
  // Ignore malformed stream URL; fall back to wildcard below.
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns:
      remotePatterns.length > 0
        ? remotePatterns
        : [{ protocol: "https", hostname: "**" }],
  },
};

export default withPWA(nextConfig);
