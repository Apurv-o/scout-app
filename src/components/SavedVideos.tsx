"use client";

import { useEffect, useState } from "react";
import type { VideoResult } from "@/types/video";
import { formatCount, formatDate } from "@/lib/format";

interface SavedVideosProps {
  refreshKey: number;
  onPreview: (video: VideoResult) => void;
  onRemoved: () => void;
  onFindSimilar: (video: VideoResult) => void;
}

export default function SavedVideos({ refreshKey, onPreview, onRemoved, onFindSimilar }: SavedVideosProps) {
  const [saved, setSaved] = useState<VideoResult[]>([]);

  useEffect(() => {
    fetch("/api/videos/saved")
      .then((r) => r.json())
      .then((d) => setSaved(d.results ?? []))
      .catch(() => {});
  }, [refreshKey]);

  if (saved.length === 0) return null;

  async function remove(videoId: string) {
    await fetch(`/api/videos/save?videoId=${encodeURIComponent(videoId)}`, { method: "DELETE" });
    onRemoved();
  }

  return (
    <section className="panel">
      <div className="panel-label">Saved library ({saved.length})</div>
      <div className="grid">
        {saved.map((video) => (
          <div className="card" key={video.id}>
            <div className="thumb-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={video.thumbnailUrl} alt="" loading="lazy" />
              <span className="duration-badge">{video.durationLabel}</span>
            </div>
            <div className="card-body">
              <div className="source-badge">{video.sourceLabel}</div>
              <div className="card-title">{video.title}</div>
              <div className="card-channel">{video.channelTitle}</div>
              <div className="card-stats">
                {formatCount(video.viewCount)} views - {formatDate(video.publishedAt)}
              </div>
              <div className="card-actions">
                <button className="btn btn-ghost" type="button" onClick={() => onPreview(video)}>
                  Preview
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => onFindSimilar(video)}>
                  Find similar
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => remove(video.id)}>
                  Remove
                </button>
                <a className="btn btn-primary" href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
