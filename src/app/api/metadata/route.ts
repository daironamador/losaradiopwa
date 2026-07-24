import { NextResponse } from "next/server";

export const runtime = "edge";

// AzuraCast Now Playing API shape (partial — only what we consume)
interface AzuraSong {
  title?: string;
  artist?: string;
  text?: string;
  album?: string;
  genre?: string;
  art?: string;
}
interface AzuraHistoryItem {
  played_at?: number;
  duration?: number;
  song?: AzuraSong;
}
interface AzuraNowPlaying {
  is_online?: boolean;
  station?: { name?: string; mounts?: { bitrate?: number; is_default?: boolean }[] };
  listeners?: { current?: number };
  live?: { is_live?: boolean; streamer_name?: string };
  now_playing?: { elapsed?: number; duration?: number; song?: AzuraSong };
  song_history?: AzuraHistoryItem[];
}

// AzuraCast serves a generic placeholder when a track has no embedded cover.
// Drop it so the UI can fall back to the station logo.
function cleanArt(art?: string): string {
  if (!art || art.includes("generic")) return "";
  return art;
}

export async function GET() {
  const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL;
  if (!streamUrl) {
    return NextResponse.json(
      { error: "Stream URL not configured" },
      { status: 500 }
    );
  }

  // Derive the AzuraCast Now Playing endpoint from a /listen/{shortcode}/ URL.
  let apiUrl: string;
  try {
    const u = new URL(streamUrl);
    const shortcode = u.pathname.match(/\/listen\/([^/]+)/)?.[1];
    if (!shortcode) throw new Error("no shortcode");
    apiUrl = `${u.origin}/api/nowplaying/${shortcode}`;
  } catch {
    return NextResponse.json(
      { error: "Invalid stream URL" },
      { status: 500 }
    );
  }

  let data: AzuraNowPlaying;
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }
    data = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Could not fetch stream metadata" },
      { status: 502 }
    );
  }

  const song = data.now_playing?.song ?? {};
  const defaultMount =
    data.station?.mounts?.find((m) => m.is_default) ?? data.station?.mounts?.[0];

  const payload = {
    isOnline: data.is_online ?? true,
    station: data.station?.name ?? "",
    bitrate: defaultMount?.bitrate ? String(defaultMount.bitrate) : "",
    listeners:
      typeof data.listeners?.current === "number" ? data.listeners.current : null,
    isLive: data.live?.is_live ?? false,
    streamer: data.live?.streamer_name ?? "",
    title: song.title ?? "",
    artist: song.artist ?? "",
    text: song.text ?? "",
    album: song.album ?? "",
    genre: song.genre ?? "",
    art: cleanArt(song.art),
    elapsed: data.now_playing?.elapsed ?? 0,
    duration: data.now_playing?.duration ?? 0,
    history: (data.song_history ?? []).slice(0, 15).map((h) => ({
      title: h.song?.title ?? "",
      artist: h.song?.artist ?? "",
      text: h.song?.text ?? "",
      art: cleanArt(h.song?.art),
      playedAt: h.played_at ?? 0,
    })),
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}
