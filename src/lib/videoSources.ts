import type { SearchFilters, VideoResult, VideoSource } from "@/types/video";
import { formatDuration, parseISODurationToSeconds, searchVideos, YouTubeApiError } from "@/lib/youtube";
import { getSourceLabel } from "@/lib/videoLinks";

type ConcreteSource = Exclude<VideoSource, "all">;

export interface MultiSourceSearchParams extends SearchFilters {
  pageToken?: string;
  youtubeApiKey?: string;
}

export interface MultiSourceSearchResult {
  results: VideoResult[];
  nextPageToken: string | null;
  notices: string[];
}

const PUBLIC_SOURCES: ConcreteSource[] = ["youtube", "dailymotion", "peertube", "archive", "reddit"];

const ORDERED_SOURCE_WEIGHT: Record<ConcreteSource, number> = {
  youtube: 0,
  dailymotion: 1,
  peertube: 2,
  archive: 3,
  reddit: 4,
};

function fallbackThumbnail(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#161b23"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#97a2b4" font-family="Arial, sans-serif" font-size="34">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function toIsoDate(value: unknown): string {
  if (!value) return "";
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function durationMatches(seconds: number, duration: SearchFilters["duration"]) {
  if (duration === "any") return true;
  if (!seconds) return false;
  if (duration === "short") return seconds < 240;
  if (duration === "medium") return seconds >= 240 && seconds <= 1200;
  return seconds > 1200;
}

function dateMatches(publishedAt: string, publishedAfter: string | undefined) {
  if (!publishedAfter) return true;
  if (!publishedAt) return false;
  return new Date(publishedAt).getTime() >= new Date(publishedAfter).getTime();
}

function applySharedFilters(results: VideoResult[], params: MultiSourceSearchParams) {
  return results.filter(
    (video) =>
      durationMatches(video.durationSeconds, params.duration) &&
      dateMatches(video.publishedAt, params.publishedAfter)
  );
}

function sortResults(results: VideoResult[], order: SearchFilters["order"]) {
  return [...results].sort((a, b) => {
    if (order === "date") {
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    }
    if (order === "viewCount") {
      return b.viewCount - a.viewCount;
    }
    if (order === "title") {
      return a.title.localeCompare(b.title);
    }
    return ORDERED_SOURCE_WEIGHT[a.source] - ORDERED_SOURCE_WEIGHT[b.source];
  });
}

function selectedSources(source: VideoSource, pageToken?: string): ConcreteSource[] {
  if (source !== "all") return [source];
  if (pageToken) return ["youtube"];
  return PUBLIC_SOURCES;
}

async function fetchJson(url: URL, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "ScoutVideoFinder/1.0",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${url.hostname} returned ${res.status}`);
  }
  return res.json();
}

export async function searchAllSources(params: MultiSourceSearchParams): Promise<MultiSourceSearchResult> {
  const sources = selectedSources(params.source, params.pageToken);
  const searches = sources.map((source) => searchOneSource(source, params));
  const settled = await Promise.allSettled(searches);
  const notices: string[] = [];
  let nextPageToken: string | null = null;

  const results = settled.flatMap((entry, index) => {
    const source = sources[index];
    if (entry.status === "fulfilled") {
      if (entry.value.nextPageToken) nextPageToken = entry.value.nextPageToken;
      return entry.value.results;
    }
    notices.push(`${getSourceLabel(source)} could not be searched right now.`);
    return [];
  });

  return {
    results: sortResults(results, params.order),
    nextPageToken: params.source === "youtube" ? nextPageToken : null,
    notices,
  };
}

async function searchOneSource(source: ConcreteSource, params: MultiSourceSearchParams) {
  if (source === "youtube") return searchYouTubeSource(params);
  if (source === "dailymotion") return searchDailymotionSource(params);
  if (source === "peertube") return searchPeerTubeSource(params);
  if (source === "archive") return searchArchiveSource(params);
  return searchRedditSource(params);
}

async function searchYouTubeSource(params: MultiSourceSearchParams) {
  if (!params.youtubeApiKey) {
    throw new YouTubeApiError("YouTube API key is not configured.", 400, "keyMissing");
  }

  const { items, nextPageToken } = await searchVideos(params.youtubeApiKey, {
    query: params.query,
    duration: params.duration,
    order: params.order,
    safeSearch: params.safeSearch,
    regionCode: params.regionCode,
    publishedAfter: params.publishedAfter,
    pageToken: params.pageToken,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: VideoResult[] = items.map((item: any) => {
    const seconds = parseISODurationToSeconds(item.contentDetails?.duration);
    const id = item.id;
    return {
      id,
      source: "youtube",
      sourceLabel: "YouTube",
      title: item.snippet?.title ?? "Untitled",
      channelTitle: item.snippet?.channelTitle ?? "",
      thumbnailUrl:
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        fallbackThumbnail("YouTube"),
      durationSeconds: seconds,
      durationLabel: formatDuration(seconds),
      viewCount: Number(item.statistics?.viewCount ?? 0),
      publishedAt: item.snippet?.publishedAt ?? "",
      videoUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube.com/embed/${id}`,
    };
  });

  return { results, nextPageToken: nextPageToken ?? null };
}

async function searchDailymotionSource(params: MultiSourceSearchParams) {
  const url = new URL("https://api.dailymotion.com/videos");
  url.searchParams.set("search", params.query);
  url.searchParams.set("limit", "30");
  url.searchParams.set("fields", "id,title,thumbnail_360_url,owner.screenname,duration,views_total,created_time,url");
  url.searchParams.set("family_filter", params.safeSearch === "strict" ? "true" : "false");
  if (params.order === "date") url.searchParams.set("sort", "recent");
  if (params.order === "viewCount") url.searchParams.set("sort", "visited");

  const data = await fetchJson(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: VideoResult[] = (data.list ?? []).map((item: any) => {
    const id = String(item.id);
    const seconds = Number(item.duration ?? 0);
    return {
      id: `dailymotion:${id}`,
      source: "dailymotion",
      sourceLabel: "Dailymotion",
      title: item.title ?? "Untitled",
      channelTitle: item["owner.screenname"] ?? "Dailymotion",
      thumbnailUrl: item.thumbnail_360_url ?? fallbackThumbnail("Dailymotion"),
      durationSeconds: seconds,
      durationLabel: seconds ? formatDuration(seconds) : "--",
      viewCount: Number(item.views_total ?? 0),
      publishedAt: toIsoDate(item.created_time),
      videoUrl: item.url ?? `https://www.dailymotion.com/video/${id}`,
      embedUrl: `https://www.dailymotion.com/embed/video/${id}`,
    };
  });

  return { results: applySharedFilters(results, params), nextPageToken: null };
}

async function searchPeerTubeSource(params: MultiSourceSearchParams) {
  const url = new URL("https://sepiasearch.org/api/v1/search/videos");
  url.searchParams.set("search", params.query);
  url.searchParams.set("count", "30");
  url.searchParams.set("nsfw", params.safeSearch === "strict" ? "false" : "both");
  if (params.order === "date") url.searchParams.set("sort", "-publishedAt");
  if (params.order === "viewCount") url.searchParams.set("sort", "-views");

  const data = await fetchJson(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: VideoResult[] = (data.data ?? []).map((item: any) => {
    const host = item.account?.host ?? new URL(item.url).host;
    const uuid = String(item.uuid);
    const shortUUID = item.shortUUID ? String(item.shortUUID) : uuid;
    const seconds = Number(item.duration ?? 0);
    return {
      id: `peertube:${host}:${uuid}:${shortUUID}`,
      source: "peertube",
      sourceLabel: "PeerTube",
      title: item.name ?? "Untitled",
      channelTitle: item.channel?.displayName ?? item.account?.displayName ?? host,
      thumbnailUrl: item.thumbnailUrl ?? item.previewUrl ?? fallbackThumbnail("PeerTube"),
      durationSeconds: seconds,
      durationLabel: seconds ? formatDuration(seconds) : "--",
      viewCount: Number(item.views ?? 0),
      publishedAt: item.publishedAt ?? item.createdAt ?? "",
      videoUrl: item.url,
      embedUrl: item.embedUrl,
    };
  });

  return { results: applySharedFilters(results, params), nextPageToken: null };
}

async function searchArchiveSource(params: MultiSourceSearchParams) {
  const url = new URL("https://archive.org/advancedsearch.php");
  url.searchParams.set("q", `(${params.query}) AND mediatype:movies`);
  for (const field of ["identifier", "title", "creator", "date", "downloads"]) {
    url.searchParams.append("fl[]", field);
  }
  url.searchParams.set("rows", "30");
  url.searchParams.set("output", "json");
  if (params.order === "date") url.searchParams.append("sort[]", "date desc");
  if (params.order === "viewCount") url.searchParams.append("sort[]", "downloads desc");
  if (params.order === "title") url.searchParams.append("sort[]", "titleSorter asc");

  const data = await fetchJson(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: VideoResult[] = (data.response?.docs ?? []).map((item: any) => {
    const id = String(item.identifier);
    const creator = Array.isArray(item.creator) ? item.creator.join(", ") : item.creator;
    return {
      id: `archive:${id}`,
      source: "archive",
      sourceLabel: "Internet Archive",
      title: item.title ?? "Untitled",
      channelTitle: creator ?? "Internet Archive",
      thumbnailUrl: `https://archive.org/services/img/${id}`,
      durationSeconds: 0,
      durationLabel: "--",
      viewCount: Number(item.downloads ?? 0),
      publishedAt: toIsoDate(item.date),
      videoUrl: `https://archive.org/details/${id}`,
      embedUrl: `https://archive.org/embed/${id}`,
    };
  });

  return { results: applySharedFilters(results, params), nextPageToken: null };
}

async function searchRedditSource(params: MultiSourceSearchParams) {
  const url = new URL("https://www.reddit.com/search.json");
  url.searchParams.set("q", `${params.query} video`);
  url.searchParams.set("type", "link");
  url.searchParams.set("limit", "30");
  url.searchParams.set("raw_json", "1");
  url.searchParams.set("include_over_18", params.safeSearch === "strict" ? "off" : "on");
  if (params.order === "date") url.searchParams.set("sort", "new");
  if (params.order === "viewCount" || params.order === "rating") url.searchParams.set("sort", "top");

  const data = await fetchJson(url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: VideoResult[] = (data.data?.children ?? []).map((child: any) => {
    const post = child.data ?? {};
    const id = String(post.id);
    const thumbnail = usableRedditThumbnail(post.thumbnail) ?? post.preview?.images?.[0]?.source?.url;
    return {
      id: `reddit:${id}`,
      source: "reddit",
      sourceLabel: "Reddit",
      title: post.title ?? "Untitled",
      channelTitle: post.subreddit_name_prefixed ?? "Reddit",
      thumbnailUrl: thumbnail ?? fallbackThumbnail("Reddit"),
      durationSeconds: Number(post.media?.reddit_video?.duration ?? 0),
      durationLabel: post.media?.reddit_video?.duration ? formatDuration(Number(post.media.reddit_video.duration)) : "--",
      viewCount: Number(post.ups ?? 0),
      publishedAt: toIsoDate(post.created_utc),
      videoUrl: post.permalink ? `https://www.reddit.com${post.permalink}` : `https://www.reddit.com/comments/${id}`,
      embedUrl: `https://www.redditmedia.com/mediaembed/${id}`,
    };
  });

  return { results: applySharedFilters(results, params), nextPageToken: null };
}

function usableRedditThumbnail(value: unknown) {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("http")) return undefined;
  return value;
}
