"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { STATION } from "@/config/station";

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [showVolume, setShowVolume] = useState(false);

  const streamUrl =
    process.env.NEXT_PUBLIC_STREAM_URL ||
    "https://streaming.shoutcast.com/your-stream-id";

  const updateTime = useCallback(() => {
    if (audioRef.current) {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-DO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlay = async () => {
    if (!audioRef.current) return;

    setError(null);
    setIsLoading(true);

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.src = streamUrl;
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch {
      setError("No se pudo conectar a la emisora");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" />

      {/* Main Player */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="glass border-t border-white/5">
          <div className="max-w-lg mx-auto px-6 py-4">
            {/* Now Playing Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isPlaying && (
                    <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                  <p className="text-sm font-medium text-text-primary truncate">
                    {isPlaying ? STATION.liveName : STATION.name}
                  </p>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {isPlaying ? currentTime : "Toca para escuchar"}
                </p>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-4">
              {/* Volume Button */}
              <div className="relative">
                <button
                  onClick={toggleMute}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                >
                  {isMuted || volume === 0 ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  ) : volume < 50 ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  )}
                </button>

                {/* Volume Slider Popup */}
                {showVolume && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 glass rounded-xl">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 accent-accent"
                      style={{
                        writingMode: "vertical-lr" as const,
                        direction: "rtl",
                        height: "100px",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Play Button */}
              <button
                onClick={handlePlay}
                disabled={isLoading}
                className={`
                  relative flex items-center justify-center w-14 h-14 rounded-full
                  transition-all duration-300 transform
                  ${
                    isPlaying
                      ? "bg-accent animate-pulse-glow scale-105"
                      : "bg-accent hover:bg-accent-hover hover:scale-105"
                  }
                  ${isLoading ? "opacity-70 cursor-wait" : "active:scale-95"}
                `}
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isLoading ? (
                  <svg
                    className="w-6 h-6 text-white animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : isPlaying ? (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Volume Slider (Desktop) */}
              <div
                className="hidden sm:flex items-center gap-2 flex-1 max-w-[140px]"
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
              >
                <button
                  onClick={toggleMute}
                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 accent-accent cursor-pointer"
                />
              </div>

              {/* Live Badge */}
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/20 rounded-full border border-accent/30">
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
