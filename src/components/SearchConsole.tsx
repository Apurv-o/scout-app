"use client";

import type { SearchFilters } from "@/types/video";

interface SearchConsoleProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function SearchConsole({ filters, onFiltersChange, onSearch, loading }: SearchConsoleProps) {
  function update<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  return (
    <section className="panel">
      <div className="panel-label">Query console</div>

      <div className="query-row">
        <input
          className="field"
          type="text"
          placeholder="e.g. that DIY floating shelf tutorial with the walnut wood, under 10 minutes"
          value={filters.query}
          onChange={(e) => update("query", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
        />
      </div>

      <div className="filters">
        <div className="ctrl">
          <label className="ctrl-label" htmlFor="duration">
            Duration
          </label>
          <select
            id="duration"
            className="field"
            value={filters.duration}
            onChange={(e) => update("duration", e.target.value as SearchFilters["duration"])}
          >
            <option value="any">Any length</option>
            <option value="short">Short — under 4 min</option>
            <option value="medium">Medium — 4–20 min</option>
            <option value="long">Long — over 20 min</option>
          </select>
        </div>

        <div className="ctrl">
          <label className="ctrl-label" htmlFor="order">
            Sort by
          </label>
          <select
            id="order"
            className="field"
            value={filters.order}
            onChange={(e) => update("order", e.target.value as SearchFilters["order"])}
          >
            <option value="relevance">Best match</option>
            <option value="date">Newest first</option>
            <option value="viewCount">Most viewed</option>
            <option value="rating">Highest rated</option>
            <option value="title">Title (A–Z)</option>
          </select>
        </div>

        <div className="ctrl">
          <label className="ctrl-label" htmlFor="safe">
            Content filter
          </label>
          <select
            id="safe"
            className="field"
            value={filters.safeSearch}
            onChange={(e) => update("safeSearch", e.target.value as SearchFilters["safeSearch"])}
          >
            <option value="moderate">Moderate</option>
            <option value="strict">Strict</option>
          </select>
        </div>

        <div className="ctrl">
          <label className="ctrl-label" htmlFor="since">
            Published after
          </label>
          <input
            id="since"
            className="field"
            type="date"
            value={filters.publishedAfter ?? ""}
            onChange={(e) => update("publishedAfter", e.target.value || undefined)}
          />
        </div>
      </div>

      <div className="search-btn-row">
        <button className="btn btn-primary" type="button" onClick={onSearch} disabled={loading}>
          Search
        </button>
        <span className={`scan-dot ${loading ? "active" : ""}`} aria-hidden="true" />
        <span className="scan-label">{loading ? "Scanning…" : ""}</span>
      </div>
    </section>
  );
}
