const SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

export interface YouTubeSearchParams {
  query: string;
  duration?: "any" | "short" | "medium" | "long";
  order?: "relevance" | "date" | "viewCount" | "rating" | "title";
  safeSearch?: "none" | "moderate" | "strict";
  regionCode?: string;
  publishedAfter?: string; // ISO date, e.g. 2026-01-01
  pageToken?: string;
}

export class YouTubeApiError extends Error {
  status: number;
  reason?: string;
  constructor(message: string, status: number, reason?: string) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callYouTube(url: string, params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${url}?${qs.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    const reason = data?.error?.errors?.[0]?.reason;
    throw new YouTubeApiError(
      data?.error?.message || "YouTube API request failed",
      res.status,
      reason
    );
  }
  return data;
}

/**
 * Runs search.list to find matching video IDs, then videos.list to pull
 * duration/view-count/etc for each — search.list alone doesn't return those.
 */
export async function searchVideos(apiKey: string, params: YouTubeSearchParams) {
  const query: Record<string, string> = {
    key: apiKey,
    part: "snippet",
    type: "video",
    maxResults: "50",
    q: params.query,
    order: params.order ?? "relevance",
    safeSearch: params.safeSearch ?? "none",
  };
  if (params.regionCode && params.regionCode !== "worldwide") {
    query.regionCode = params.regionCode;
  }
  if (params.duration && params.duration !== "any") {
    query.videoDuration = params.duration;
  }
  if (params.publishedAfter) {
    // YouTube requires an RFC 3339 datetime; a bare date like "2026-01-01" is
    // normalized to midnight UTC so the filter is applied predictably.
    const parsed = new Date(params.publishedAfter);
    if (!Number.isNaN(parsed.getTime())) {
      query.publishedAfter = parsed.toISOString();
    }
  }
  if (params.pageToken) {
    query.pageToken = params.pageToken;
  }

  const searchData = await callYouTube(SEARCH_URL, query);
  const ids: string[] = (searchData.items ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => item.id?.videoId)
    .filter(Boolean);

  if (ids.length === 0) {
    return { items: [] as unknown[], nextPageToken: undefined as string | undefined };
  }

  const detailData = await callYouTube(VIDEOS_URL, {
    key: apiKey,
    part: "snippet,contentDetails,statistics",
    id: ids.join(","),
  });

  return {
    items: detailData.items ?? [],
    nextPageToken: searchData.nextPageToken as string | undefined,
  };
}

export function parseISODurationToSeconds(iso: string | undefined): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? "");
  if (!match) return 0;
  const h = parseInt(match[1] ?? "0", 10);
  const m = parseInt(match[2] ?? "0", 10);
  const s = parseInt(match[3] ?? "0", 10);
  return h * 3600 + m * 60 + s;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
