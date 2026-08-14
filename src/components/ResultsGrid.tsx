"use client";

import type { VideoResult } from "@/types/video";
import VideoCard from "./VideoCard";

interface ResultsGridProps {
  results: VideoResult[];
  savedIds: Set<string>;
  onPreview: (video: VideoResult) => void;
  onToggleSave: (video: VideoResult) => void;
  onFindSimilar: (video: VideoResult) => void;
}

export default function ResultsGrid({ results, savedIds, onPreview, onToggleSave, onFindSimilar }: ResultsGridProps) {
  if (results.length === 0) return null;

  return (
    <div className="grid">
      {results.map((video, index) => (
        <VideoCard
          key={video.id}
          video={video}
          index={index % 24}
          saved={savedIds.has(video.id)}
          onPreview={onPreview}
          onToggleSave={onToggleSave}
          onFindSimilar={onFindSimilar}
        />
      ))}
    </div>
  );
}
