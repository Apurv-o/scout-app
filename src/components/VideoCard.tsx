"use client";

import type { VideoResult } from "@/types/video";
import { formatCount, formatDate } from "@/lib/format";

interface VideoCardProps {
  video: VideoResult;
  saved: boolean;
  /** Position in the grid, used purely to stagger the entrance animation. */
  index?: number;
  onPreview: (video: VideoResult) => void;
  onToggleSave: (video: VideoResult) => void;
  onFindSimilar: (video: VideoResult) => void;
}

export default function VideoCard({ video, saved, index = 0, onPreview, onToggleSave, onFindSimilar }: VideoCardProps) {
  return (
    <div className="card" style={{ "--i": index } as React.CSSProperties}>
      <div className="thumb-wrap">
        {/* Thumbnails come from arbitrary source domains, so a plain img keeps this simple. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={video.thumbnailUrl} alt="" loading="lazy" />
        <span className="duration-badge">{video.durationLabel}</span>
      </div>
      <div className="card-body">
        <div className="source-badge" data-source={video.source}>{video.sourceLabel}</div>
        <div className="card-title">{video.title}</div>
        <div className="card-channel">{video.channelTitle}</div>
        <div className="card-stats">
          {formatCount(video.viewCount)} views - {formatDate(video.publishedAt)}
        </div>
        <div className="card-actions">
          <button className="btn btn-ghost" type="button" onClick={() => onPreview(video)}>
            Preview
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => onToggleSave(video)}>
            {saved ? "Saved" : "Save"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => onFindSimilar(video)}>
            Find similar
          </button>
          <a className="btn btn-primary" href={video.videoUrl} target="_blank" rel="noopener noreferrer">
            Open
          </a>
        </div>
      </div>
    </div>
  );
}
