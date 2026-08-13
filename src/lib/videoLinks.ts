import type { VideoResult, VideoSource } from "@/types/video";

type StoredSource = Exclude<VideoSource, "all">;

const SOURCE_LABELS: Record<StoredSource, string> = {
  youtube: "YouTube",
  dailymotion: "Dailymotion",
  peertube: "PeerTube",
  archive: "Internet Archive",
  reddit: "Reddit",
};

export function getSourceLabel(source: StoredSource): string {
  return SOURCE_LABELS[source];
}

export function parseStoredVideoId(id: string): {
  source: StoredSource;
  rawId: string;
  host?: string;
  embedId?: string;
} {
  const parts = id.split(":");
  if (parts[0] === "dailymotion" && parts[1]) {
    return { source: "dailymotion", rawId: parts[1] };
  }
  if (parts[0] === "archive" && parts[1]) {
    return { source: "archive", rawId: parts.slice(1).join(":") };
  }
  if (parts[0] === "reddit" && parts[1]) {
    return { source: "reddit", rawId: parts[1] };
  }
  if (parts[0] === "peertube" && parts[1] && parts[2]) {
    return { source: "peertube", host: parts[1], rawId: parts[2], embedId: parts[3] };
  }
  return { source: "youtube", rawId: id };
}

export function buildVideoUrl(id: string): string {
  const parsed = parseStoredVideoId(id);
  if (parsed.source === "youtube") return `https://www.youtube.com/watch?v=${parsed.rawId}`;
  if (parsed.source === "dailymotion") return `https://www.dailymotion.com/video/${parsed.rawId}`;
  if (parsed.source === "archive") return `https://archive.org/details/${parsed.rawId}`;
  if (parsed.source === "reddit") return `https://www.reddit.com/comments/${parsed.rawId}`;
  if (parsed.host) return `https://${parsed.host}/videos/watch/${parsed.rawId}`;
  return "";
}

export function buildEmbedUrl(id: string): string | undefined {
  const parsed = parseStoredVideoId(id);
  if (parsed.source === "youtube") return `https://www.youtube.com/embed/${parsed.rawId}`;
  if (parsed.source === "dailymotion") return `https://www.dailymotion.com/embed/video/${parsed.rawId}`;
  if (parsed.source === "archive") return `https://archive.org/embed/${parsed.rawId}`;
  if (parsed.source === "reddit") return `https://www.redditmedia.com/mediaembed/${parsed.rawId}`;
  if (parsed.host) return `https://${parsed.host}/videos/embed/${parsed.embedId ?? parsed.rawId}`;
  return undefined;
}

export function hydrateVideoLinks(video: Omit<VideoResult, "source" | "sourceLabel" | "videoUrl" | "embedUrl">): VideoResult {
  const parsed = parseStoredVideoId(video.id);
  return {
    ...video,
    source: parsed.source,
    sourceLabel: getSourceLabel(parsed.source),
    videoUrl: buildVideoUrl(video.id),
    embedUrl: buildEmbedUrl(video.id),
  };
}
