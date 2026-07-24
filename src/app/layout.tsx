import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import { STATION } from "@/config/station";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const pageTitle = `${STATION.name} | ${STATION.tagline}`;

export const metadata: Metadata = {
  title: pageTitle,
  description: `Escucha ${STATION.name} en vivo, ${STATION.tagline}. Música, entretenimiento y más.`,
  keywords: ["radio", "online", STATION.name, "en vivo", "música"],
  authors: [{ name: STATION.name }],
  creator: STATION.name,
  publisher: STATION.name,
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: STATION.website,
    siteName: STATION.name,
    title: pageTitle,
    description: `Escucha ${STATION.name} en vivo, ${STATION.tagline}.`,
    images: [
      {
        url: STATION.logo,
        width: 1200,
        height: 630,
        alt: `${STATION.name} Radio`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: `Escucha ${STATION.name} en vivo, ${STATION.tagline}.`,
    images: [STATION.logo],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: STATION.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#f9f9ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${sora.variable} light h-dvh w-screen overflow-hidden`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-dvh w-screen bg-background text-on-background font-[family-name:var(--font-sora)] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
