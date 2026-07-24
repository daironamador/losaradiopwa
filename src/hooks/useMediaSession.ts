import { useEffect } from "react";

interface MediaSessionArgs {
  title: string;
  artist: string;
  artwork: string; // absolute or root-relative URL
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}

// Wires the browser MediaSession API so lock-screen / notification / headset
// controls show the station artwork + current track and can toggle playback.
// This is what keeps playback controllable while the app is backgrounded.
export function useMediaSession({
  title,
  artist,
  artwork,
  isPlaying,
  onPlay,
  onPause,
}: MediaSessionArgs) {
  // Keep action handlers pointed at the latest callbacks.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => onPlay());
    ms.setActionHandler("pause", () => onPause());
    ms.setActionHandler("stop", () => onPause());
    // Live radio: no seeking / track skipping.
    ms.setActionHandler("previoustrack", null);
    ms.setActionHandler("nexttrack", null);
    try {
      ms.setActionHandler("seekto", null);
      ms.setActionHandler("seekbackward", null);
      ms.setActionHandler("seekforward", null);
    } catch {
      // Some browsers throw on unsupported actions; ignore.
    }
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("stop", null);
    };
  }, [onPlay, onPause]);

  // Reflect the playback state on the lock screen.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Push current-track metadata + artwork.
  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator) ||
      typeof MediaMetadata === "undefined"
    )
      return;
    const src =
      artwork.startsWith("http") || typeof window === "undefined"
        ? artwork
        : window.location.origin + artwork;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || artist || "En vivo",
      artist,
      artwork: [
        { src, sizes: "192x192", type: "image/jpeg" },
        { src, sizes: "512x512", type: "image/jpeg" },
      ],
    });
  }, [title, artist, artwork]);
}
