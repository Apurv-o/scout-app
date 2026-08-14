"use client";

import { useCallback, useEffect, useState } from "react";
import Clock from "@/components/Clock";
import SearchConsole from "@/components/SearchConsole";
import ResultsGrid from "@/components/ResultsGrid";
import PreviewModal from "@/components/PreviewModal";
import SavedVideos from "@/components/SavedVideos";
import CloudBackground from "@/components/CloudBackground";
import type { SearchFilters, VideoResult } from "@/types/video";

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  duration: "any",
  order: "relevance",
  safeSearch: "moderate",
  regionCode: "worldwide",
  source: "all",
  publishedAfter: undefined,
};

export default function Page() {
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
    fetch("/api/videos/saved")
      .then((r) => r.json())
      .then((d) => setSavedIds(new Set((d.results ?? []).map((v: VideoResult) => v.id))))
      .catch(() => {});
  }, [savedRefreshKey]);

  const runSearch = useCallback(
    async (reset: boolean, overrideQuery?: string, overrideDuration?: SearchFilters["duration"]) => {
      const activeFilters: SearchFilters = {
        ...filters,
        ...(overrideQuery !== undefined ? { query: overrideQuery } : {}),
        ...(overrideDuration !== undefined ? { duration: overrideDuration } : {}),
      };
      if (overrideQuery !== undefined || overrideDuration !== undefined) {
        setFilters(activeFilters);
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

        setResults((prev) => {
          if (reset) return data.results;
          const seen = new Set(prev.map((v) => v.id));
          return [...prev, ...data.results.filter((v: VideoResult) => !seen.has(v.id))];
        });
        setNextPageToken(data.nextPageToken ?? null);
        setHasSearched(true);

        if (reset && data.results.length === 0) {
          setInfo("No matches on this frequency. Try loosening a filter or rephrasing the description.");
        } else if (data.notices?.length) {
          setInfo(data.notices.join(" "));
        }
      } catch {
        setError("Could not reach the search service.");
      } finally {
        setLoading(false);
      }
    },
    [filters, nextPageToken]
  );

  function handleFindSimilar(video: VideoResult) {
    const bucket: SearchFilters["duration"] =
      video.durationSeconds < 240 ? "short" : video.durationSeconds > 1200 ? "long" : "medium";
    runSearch(true, video.title, bucket);
  }

  async function toggleSave(video: VideoResult) {
    if (savedIds.has(video.id)) {
      await fetch(`/api/videos/save?videoId=${encodeURIComponent(video.id)}`, { method: "DELETE" });
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
      <CloudBackground />
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
            Describe it in your own words - the topic, a detail you remember, roughly how long it was - and Scout
            searches public video sources directly, filtered exactly the way you specify.
          </p>
        </section>

        <SearchConsole filters={filters} onFiltersChange={setFilters} onSearch={() => runSearch(true)} loading={loading} />

        {(error || info) && (
          <div className={`status-line show ${error ? "error" : "info"}`} role="status" aria-live="polite">
            {error || info}
          </div>
        )}

        <section>
          {hasSearched && <div className="results-meta">Results for &quot;{filters.query}&quot;</div>}
          {!hasSearched && <div className="empty-state">Nothing queued yet. Describe the video above and hit Search.</div>}
          <ResultsGrid
            results={results}
            savedIds={savedIds}
            onPreview={setPreviewVideo}
            onToggleSave={toggleSave}
            onFindSimilar={handleFindSimilar}
          />
          {nextPageToken && (
            <button className="btn btn-ghost load-more" type="button" onClick={() => runSearch(false)} disabled={loading}>
              {filters.source === "all" ? "Load more YouTube results" : "Load more results"}
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

      <footer className="site-footer">
        <p className="footer-note">
          Scout queries public video source APIs and opens playback on the original site. No video is hosted or rehosted
          by this app.
        </p>
        <p className="footer-credit">
          Made by <a href="https://www.linkedin.com/in/apurv-prasad-622067264/" target="_blank" rel="noopener noreferrer">Apurv</a> & <a href="https://www.linkedin.com/in/hemraj-patel-5319552ba/" target="_blank" rel="noopener noreferrer">Hemraj</a>
        </p>
      </footer>

      <PreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
    </>
  );
}
