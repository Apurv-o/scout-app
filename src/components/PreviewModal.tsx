"use client";

import { useEffect } from "react";
import type { VideoResult } from "@/types/video";

interface PreviewModalProps {
  video: VideoResult | null;
  onClose: () => void;
}

export default function PreviewModal({ video, onClose }: PreviewModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!video) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-head">
          <div>
            <div className="source-badge modal-source">{video.sourceLabel}</div>
            <h3>{video.title}</h3>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close preview">
            &times;
          </button>
        </div>
        {video.embedUrl ? (
          <div className="modal-frame-wrap">
            <iframe
              src={video.embedUrl}
              title="Video preview"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="modal-fallback">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={video.thumbnailUrl} alt="" />
            <a className="btn btn-primary" href={video.videoUrl} target="_blank" rel="noopener noreferrer">
              Open
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
