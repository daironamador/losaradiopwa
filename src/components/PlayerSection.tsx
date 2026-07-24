"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { STATION } from "@/config/station";
import { useMediaSession } from "@/hooks/useMediaSession";

interface HistoryEntry {
  title: string;
  artist: string;
  text: string;
  art: string;
  playedAt: number;
}

// Unix seconds (UTC) → local HH:mm
function formatPlayedAt(unixSeconds: number): string {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface StreamMetadata {
  isOnline?: boolean;
  station?: string;
  bitrate?: string;
  listeners?: number | null;
  isLive?: boolean;
  streamer?: string;
  title?: string;
  artist?: string;
  text?: string;
  album?: string;
  genre?: string;
  art?: string;
  elapsed?: number;
  duration?: number;
  history?: HistoryEntry[];
}

export default function PlayerSection() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [metadata, setMetadata] = useState<StreamMetadata>({});
  const [songHistory, setSongHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const streamUrl =
    process.env.NEXT_PUBLIC_STREAM_URL ||
    "https://streaming.shoutcast.com/your-stream-id";

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await fetch("/api/metadata", { cache: "no-store" });
      if (!res.ok) return;
      const data: StreamMetadata = await res.json();
      setMetadata(data);
      setSongHistory(Array.isArray(data.history) ? data.history : []);
    } catch {
      // Silently fail
    }
  }, []);

  // Poll metadata while playing. Even when the tab is backgrounded the timer
  // keeps the lock-screen (MediaSession) info fresh whenever it does fire.
  useEffect(() => {
    if (!isPlaying) return;
    fetchMetadata();
    const interval = setInterval(fetchMetadata, 10000);
    // Refresh immediately when the app returns to the foreground.
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchMetadata();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isPlaying, fetchMetadata]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.8;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const on = () => setIsPlaying(true);
    const off = () => setIsPlaying(false);
    const onErr = () => {
      setIsPlaying(false);
      setError("Se perdió la conexión con la emisora.");
    };
    audio.addEventListener("play", on);
    audio.addEventListener("playing", on);
    audio.addEventListener("pause", off);
    audio.addEventListener("ended", off);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("play", on);
      audio.removeEventListener("playing", on);
      audio.removeEventListener("pause", off);
      audio.removeEventListener("ended", off);
      audio.removeEventListener("error", onErr);
    };
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    setIsLoading(true);
    try {
      // Reconnect to the live edge on every start (live streams have no buffer
      // to resume from once paused/stalled).
      audio.src = streamUrl;
      audio.load();
      await audio.play();
      fetchMetadata();
    } catch {
      setError("No se pudo conectar. Verifica tu conexión.");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [streamUrl, fetchMetadata]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: STATION.name,
        text: STATION.shareText,
        url: window.location.href,
      });
    }
  };

  const songTitle = metadata.title?.trim() || "";
  const songArtist = metadata.artist?.trim() || "";
  // App branding stays the station brand regardless of the AzuraCast name.
  const stationName = STATION.name;
  const genre = metadata.genre?.trim() || "";
  const hasSong = isPlaying && (songTitle.length > 0 || !!metadata.text);
  const artwork = metadata.art?.trim() || STATION.logo;

  // Lock-screen / background media controls.
  useMediaSession({
    title: songTitle || metadata.text?.trim() || STATION.liveName,
    artist: songArtist || STATION.name,
    artwork,
    isPlaying,
    onPlay: play,
    onPause: pause,
  });

  const subtitle = isPlaying
    ? genre ||
      (metadata.bitrate ? `${metadata.bitrate} KBPS` : "EN VIVO") ||
      "RADIO ONLINE"
    : "RADIO ONLINE";

  const nowPlaying = hasSong
    ? songArtist && songTitle
      ? `${songArtist} — ${songTitle}`
      : metadata.text?.trim() || songTitle
    : isPlaying
    ? "Sintonizando la emisora…"
    : "Presiona play para escuchar";

  return (
    <div
      className="relative h-dvh w-screen flex flex-col overflow-hidden text-[#1c1f2e]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" playsInline />

      {/* Glassmorphism backdrop — heavily blurred logo, fixed for every song. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <Image
          src={STATION.logo}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover scale-150 blur-3xl"
        />
        {/* Soft brand glow so the frosted glass reads even behind the
            light logo. */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b5bdb]/25 via-transparent to-[#7aa8d8]/20" />
        {/* Frosted veil — clearer glass at the top, whiter toward the controls. */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/55 to-white/85" />
      </div>

      {/* ── Top nav ─────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <button
          onClick={() => setShowInfo(true)}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-black/5 transition-colors"
          aria-label="Menú"
        >
          <span className="material-symbols-outlined text-[26px] text-[#1c1f2e]">
            menu
          </span>
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full active:bg-black/5 transition-colors"
          aria-label="Opciones"
        >
          <span className="material-symbols-outlined text-[24px] text-[#1c1f2e]">
            tune
          </span>
        </button>
      </header>

      {/* ── Main ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col justify-center px-6 min-h-0">
        {/* Circular player */}
        <div className="relative mx-auto w-60 h-60 shrink-0">
          <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full">
            <defs>
              {/* Dominican Republic flag ribbon: blue · white · red */}
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#002D62" />
                <stop offset="34%" stopColor="#0A3D91" />
                <stop offset="44%" stopColor="#ffffff" />
                <stop offset="56%" stopColor="#ffffff" />
                <stop offset="66%" stopColor="#CE1126" />
                <stop offset="100%" stopColor="#A50E1E" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke="#eef0f7"
              strokeWidth="6"
            />
            {/* Outline so the white band of the flag stays visible on a white bg */}
            <path
              d="M 91.46 226.26 A 110 110 0 1 1 148.54 226.26"
              fill="none"
              stroke="#d7dce8"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Tricolor ribbon */}
            <path
              d="M 91.46 226.26 A 110 110 0 1 1 148.54 226.26"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Knob */}
            <circle
              cx="148.54"
              cy="226.26"
              r="9"
              fill="#ffffff"
              stroke="#CE1126"
              strokeWidth="4"
            />
          </svg>

          {/* Station logo — always the brand, never the album cover */}
          <div className="absolute rounded-full overflow-hidden shadow-[0_18px_40px_-14px_rgba(59,91,219,0.45)]"
            style={{ top: 25, left: 25, width: 190, height: 190 }}
          >
            <Image
              src={STATION.logo}
              alt={STATION.name}
              fill
              className="object-cover"
              sizes="190px"
              priority
            />
          </div>
        </div>

        {/* Title block */}
        <div className="mt-8">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#f0353f] animate-pulse-live" />
            <span className="text-[11px] font-bold tracking-widest text-[#f0353f] uppercase">
              En vivo
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#1c1f2e] truncate">
              {stationName}
            </h1>
            <div className="flex items-center gap-4 shrink-0 text-[#2b2e3d]">
              <button aria-label="Descargar" className="active:scale-90 transition-transform opacity-90">
                <span className="material-symbols-outlined text-[22px]">download</span>
              </button>
              <button onClick={handleShare} aria-label="Compartir" className="active:scale-90 transition-transform opacity-90">
                <span className="material-symbols-outlined text-[22px]">share</span>
              </button>
              <button
                onClick={() => setLiked((v) => !v)}
                aria-label="Favorito"
                className="active:scale-90 transition-transform"
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{
                    fontVariationSettings: liked ? '"FILL" 1' : '"FILL" 0',
                    color: liked ? "#f0353f" : "#2b2e3d",
                  }}
                >
                  favorite
                </span>
              </button>
            </div>
          </div>

          <p className="text-[13px] font-medium text-[#a0a3b1] mt-1 uppercase tracking-wide truncate">
            {subtitle}
          </p>
        </div>

        {/* Now playing */}
        <div className="mt-7 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[#a0a3b1] mb-2">
            <span className="material-symbols-outlined text-[16px]">mic</span>
            <span className="text-[13px] font-medium">Sonando ahora</span>
          </div>
          <p className="text-[15px] font-semibold text-[#2b2e3d] leading-snug line-clamp-2 px-2">
            {nowPlaying}
          </p>
          {error && <p className="text-xs text-[#f0353f] mt-2">{error}</p>}
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-10">
          <button
            aria-label="Anterior"
            className="text-[#b6b9c6] active:scale-90 transition-transform"
          >
            <span
              className="material-symbols-outlined text-[34px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              skip_previous
            </span>
          </button>

          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-[#3b5bdb] text-white flex items-center justify-center shadow-[0_12px_28px_-8px_rgba(59,91,219,0.7)] hover:bg-[#3350c6] active:scale-95 transition-all disabled:opacity-60"
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isLoading ? (
              <span className="material-symbols-outlined text-[32px] animate-spin">
                progress_activity
              </span>
            ) : (
              <span
                className="material-symbols-outlined text-[34px]"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            )}
          </button>

          <button
            aria-label="Siguiente"
            className="text-[#b6b9c6] active:scale-90 transition-transform"
          >
            <span
              className="material-symbols-outlined text-[34px]"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              skip_next
            </span>
          </button>
        </div>
      </main>

      {/* ── Track day list (bottom sheet peek) ──────────── */}
      <button
        onClick={() => setShowHistory(true)}
        className="shrink-0 w-full pt-3 pb-6 rounded-t-[28px] bg-white shadow-[0_-10px_30px_-18px_rgba(0,0,0,0.25)] active:bg-black/[0.02] transition-colors"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <span className="block w-10 h-1.5 rounded-full bg-[#e6e8f0] mx-auto mb-3" />
        <span className="text-[12px] font-semibold tracking-[0.2em] text-[#bcbfca] uppercase">
          Canciones del día
        </span>
      </button>

      {/* ── History Drawer ──────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1.5 bg-[#e6e8f0] rounded-full mx-auto mb-5" />
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#1c1f2e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3b5bdb]">
                  queue_music
                </span>
                Canciones del día
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="material-symbols-outlined p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                close
              </button>
            </div>

            {songHistory.length === 0 ? (
              <div className="text-center py-10">
                <span className="material-symbols-outlined text-5xl text-[#c9ccd6] mb-3 block">
                  music_note
                </span>
                <p className="text-[#a0a3b1] text-sm">
                  {isPlaying
                    ? "Esperando la primera canción..."
                    : "Inicia la reproducción para ver el historial"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {songHistory.map((song, i) => (
                  <div
                    key={`${song.playedAt}-${i}`}
                    className="flex items-center gap-3 p-3 hover:bg-black/[0.03] rounded-xl transition-colors"
                  >
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#3b5bdb]/10 flex items-center justify-center shrink-0">
                      {song.art ? (
                        <Image
                          src={song.art}
                          alt=""
                          width={44}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[#3b5bdb] text-xl">
                          music_note
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1c1f2e] truncate">
                        {song.title || song.text || "Canción"}
                      </p>
                      <p className="text-xs text-[#a0a3b1] truncate">
                        {[song.artist, formatPlayedAt(song.playedAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Station Info Drawer ──────────────────────────── */}
      {showInfo && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1.5 bg-[#e6e8f0] rounded-full mx-auto mb-3" />
            <div className="flex justify-end -mt-1 mb-1">
              <button
                onClick={() => setShowInfo(false)}
                className="material-symbols-outlined p-2 hover:bg-black/5 rounded-full transition-colors text-[#1c1f2e]"
                aria-label="Cerrar"
              >
                close
              </button>
            </div>

            {/* Brand */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
                <Image
                  src={STATION.logo}
                  alt={STATION.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="mt-3 text-xl font-bold text-[#1c1f2e]">
                {STATION.name}
              </h3>
              <p className="text-[13px] text-[#a0a3b1] font-medium">
                {STATION.tagline}
              </p>
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-[#4a4d5c] leading-relaxed text-center">
              {STATION.description}
            </p>

            {/* Details */}
            <div className="mt-5 space-y-1.5">
              {[
                {
                  icon: "location_on",
                  label: "Ubicación",
                  value: STATION.location,
                },
                {
                  icon: "radio",
                  label: "Transmisión",
                  value: "En vivo · 24/7",
                },
                {
                  icon: "graphic_eq",
                  label: "Calidad",
                  value: metadata.bitrate
                    ? `${metadata.bitrate} kbps`
                    : `${STATION.defaultBitrate} kbps`,
                },
                ...(genre
                  ? [{ icon: "genres", label: "Género", value: genre }]
                  : []),
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#f4f6fb]"
                >
                  <span className="material-symbols-outlined text-[#3b5bdb] text-[20px]">
                    {row.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-[#a0a3b1] uppercase tracking-wide">
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-[#1c1f2e] truncate">
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-[#3b5bdb] text-white font-semibold text-sm rounded-full py-3 active:scale-[0.98] transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">
                share
              </span>
              Compartir la emisora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
