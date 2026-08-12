"use client";

import { useCallback, useEffect, useState } from "react";
import Clock from "@/components/Clock";
import SearchConsole from "@/components/SearchConsole";
import ResultsGrid from "@/components/ResultsGrid";
import PreviewModal from "@/components/PreviewModal";
import SavedVideos from "@/components/SavedVideos";
import type { VideoResult, SearchFilters } from "@/types/video";

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  duration: "any",
  order: "relevance",
  safeSearch: "moderate",
  publishedAfter: undefined,
};

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoResult | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setConnected(Boolean(d.connected)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/videos/saved")
      .then((r) => r.json())
      .then((d) => setSavedIds(new Set((d.results ?? []).map((v: VideoResult) => v.id))))
      .catch(() => {});
  }, [savedRefreshKey]);

  const runSearch = useCallback(
    async (
      reset: boolean,
      overrideQuery?: string,
      overrideDuration?: SearchFilters["duration"]
    ) => {
      const activeFilters: SearchFilters = {
        ...filters,
        ...(overrideQuery !== undefined ? { query: overrideQuery } : {}),
        ...(overrideDuration !== undefined ? { duration: overrideDuration } : {}),
      };
      if (overrideQuery !== undefined || overrideDuration !== undefined) {
        setFilters(activeFilters);
      }

      if (!connected) {
        setError("Connect a YouTube API key first.");
        return;
      }
      if (!activeFilters.query.trim()) {
        setError("Describe the video first.");
        return;
      }

      setError(null);
      setInfo(null);
      setLoading(true);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...activeFilters, pageToken: reset ? undefined : nextPageToken }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Search failed.");
          return;
        }

        setResults((prev) => (reset ? data.results : [...prev, ...data.results]));
        setNextPageToken(data.nextPageToken);
        setHasSearched(true);
        if (reset && data.results.length === 0) {
          setInfo("No matches on this frequency. Try loosening a filter or rephrasing the description.");
        }
      } catch {
        setError("Could not reach the search service.");
      } finally {
        setLoading(false);
      }
    },
    [filters, connected, nextPageToken]
  );

  function handleFindSimilar(video: VideoResult) {
    const bucket: SearchFilters["duration"] =
      video.durationSeconds < 240 ? "short" : video.durationSeconds > 1200 ? "long" : "medium";
    runSearch(true, video.title, bucket);
  }

  async function toggleSave(video: VideoResult) {
    if (savedIds.has(video.id)) {
      await fetch(`/api/videos/save?videoId=${video.id}`, { method: "DELETE" });
    } else {
      await fetch("/api/videos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(video),
      });
    }
    setSavedRefreshKey((k) => k + 1);
  }

  return (
    <>
      <div className="sprockets" aria-hidden="true" />
      <header className="masthead">
        <div className="masthead-row">
          <div className="brand">
            <div className="brand-mark">
              S<span>C</span>OUT
            </div>
            <div className="brand-eyebrow">Video search terminal</div>
          </div>
          <Clock />
        </div>
      </header>
      <div className="sprockets" aria-hidden="true" />

      <main>
        <section className="hero">
          <h1>
            Find the video
            <br />
            you&apos;re picturing
          </h1>
          <div className="hero-rule" />
          <p>
            Describe it in your own words — the topic, a detail you remember, roughly how long it was — and Scout
            searches YouTube directly, filtered exactly the way you specify.
          </p>
       </section>

<SearchConsole
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={() => runSearch(true)}
          loading={loading}
        />

        {(error || info) && (
          <div className={`status-line show ${error ? "error" : "info"}`} role="status" aria-live="polite">
            {error || info}
          </div>
        )}

        <section>
          {hasSearched && <div className="results-meta">Results for &quot;{filters.query}&quot;</div>}
          {!hasSearched && (
            <div className="empty-state">Nothing queued yet. Describe the video above and hit Search.</div>
          )}
          <ResultsGrid
            results={results}
            savedIds={savedIds}
            onPreview={setPreviewVideo}
            onToggleSave={toggleSave}
            onFindSimilar={handleFindSimilar}
          />
          {nextPageToken && (
            <button className="btn btn-ghost load-more" type="button" onClick={() => runSearch(false)} disabled={loading}>
              Load more results
            </button>
          )}
        </section>

        <SavedVideos
          refreshKey={savedRefreshKey}
          onPreview={setPreviewVideo}
          onRemoved={() => setSavedRefreshKey((k) => k + 1)}
          onFindSimilar={handleFindSimilar}
        />
      </main>

      <footer>
        Scout queries the official YouTube Data API v3 using your own key — no video is hosted or rehosted by this
        app. Results, thumbnails, and playback remain subject to YouTube&apos;s own terms and content policies.
      </footer>

      <PreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
    </>
  );
}
