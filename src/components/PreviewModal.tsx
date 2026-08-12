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
          <h3>{video.title}</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close preview">
            &times;
          </button>
        </div>
        <div className="modal-frame-wrap">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title="Video preview"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
