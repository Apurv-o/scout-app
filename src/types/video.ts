export type VideoSource =
  | "all"
  | "youtube"
  | "dailymotion"
  | "peertube"
  | "archive"
  | "reddit"
  | "dtube"
  | "bitcchute"
  | "odysee"
  | "lbry";

export interface VideoResult {
  id: string;
  source: Exclude<VideoSource, "all">;
  sourceLabel: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  durationLabel: string;
  viewCount: number;
  publishedAt: string;
  videoUrl: string;
  embedUrl?: string;
}

export interface SearchFilters {
  query: string;
  duration: "any" | "short" | "medium" | "long";
  order: "relevance" | "date" | "viewCount" | "rating" | "title";
  safeSearch: "none" | "moderate" | "strict";
  regionCode: "worldwide" | string;
  sources: VideoSource[];
  publishedAfter?: string;
}
