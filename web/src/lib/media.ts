import type { MediaItem } from "@/api/types";

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);

/**
 * youtube.com/watch?v=ID (także z &t=…, http://), youtu.be/ID, youtube.com/embed/ID → ID;
 * inne adresy → null.
 */
export function youtubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be" || host === "www.youtu.be") {
    id = u.pathname.split("/")[1] ?? null;
  } else if (YT_HOSTS.has(host)) {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = /^\/(?:embed|shorts|live)\/([^/]+)/.exec(u.pathname);
      id = m?.[1] ?? null;
    }
  }
  return id && ID_RE.test(id) ? id : null;
}

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function youtubeThumbUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Pierwszy element type="video" z poprawnym id YouTube. */
export function firstVideo(media: MediaItem[]): { item: MediaItem; id: string } | null {
  for (const item of media) {
    if (item.type !== "video") continue;
    const id = youtubeId(item.url);
    if (id) return { item, id };
  }
  return null;
}
