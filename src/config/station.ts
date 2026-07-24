// Central per-station branding. Copy this app to another station by changing
// only this file, the logo asset in /public, and NEXT_PUBLIC_STREAM_URL.
export const STATION = {
  name: "LOSA Radio",
  liveName: "LOSA Radio en Vivo",
  tagline: "La más completa",
  description:
    "LOSA Radio, la más completa. Música, entretenimiento y buena compañía las 24 horas del día. 🇩🇴",
  location: "República Dominicana",
  website: "https://losaradio.com",
  shareText: "Escucha LOSA Radio en vivo - La más completa",
  // Logo lives in /public. Always shown as the cover, never the album art.
  logo: "/losaimg.jpeg",
  themeColor: "#31536c",
  defaultBitrate: "192",
} as const;
