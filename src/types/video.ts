export interface VideoResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  durationLabel: string;
  viewCount: number;
  publishedAt: string;
}

export interface SearchFilters {
  query: string;
  duration: "any" | "short" | "medium" | "long";
  order: "relevance" | "date" | "viewCount" | "rating" | "title";
  safeSearch: "none" | "moderate" | "strict";
  regionCode: "worldwide" | string;
  publishedAfter?: string;
}
