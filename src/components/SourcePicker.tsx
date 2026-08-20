"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoSource } from "@/types/video";

interface SourceOption {
  value: Exclude<VideoSource, "all">;
  label: string;
}

const SOURCE_OPTIONS: SourceOption[] = [
  { value: "youtube",     label: "YouTube" },
  { value: "dailymotion", label: "Dailymotion" },
  { value: "peertube",    label: "PeerTube" },
  { value: "archive",     label: "Internet Archive" },
  { value: "reddit",      label: "Reddit" },
  { value: "dtube",       label: "D.Tube" },
  { value: "bitcchute",   label: "BitChute" },
  { value: "odysee",      label: "Odysee" },
  { value: "lbry",        label: "LBRY" },
];

const ALL_CONCRETE = SOURCE_OPTIONS.map((s) => s.value);

interface Props {
  value: VideoSource[];
  onChange: (sources: VideoSource[]) => void;
}

export default function SourcePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Compute whether all sources are selected
  const isAll = value.includes("all") || ALL_CONCRETE.every((s) => value.includes(s));

  // Active concrete sources (when "all" is not selected)
  const activeConcrete = isAll ? ALL_CONCRETE : (value.filter((s) => s !== "all") as Exclude<VideoSource, "all">[]);

  // Compact closed-state label
  function getLabel(): string {
    if (activeConcrete.length === 0) return "Select sources";
    if (isAll) return "All public sites";
    if (activeConcrete.length === 1) {
      return SOURCE_OPTIONS.find((s) => s.value === activeConcrete[0])?.label ?? activeConcrete[0];
    }
    const [first, ...rest] = activeConcrete;
    const firstName = SOURCE_OPTIONS.find((s) => s.value === first)?.label ?? first;
    return `${firstName} + ${rest.length} more`;
  }

  // Toggle "all" checkbox
  function toggleAll() {
    if (isAll) {
      // Deselect all → select nothing (show Select sources) — keep at least YouTube to avoid empty
      onChange(["youtube"]);
    } else {
      onChange(["all"]);
    }
  }

  // Toggle an individual source
  function toggleSource(src: Exclude<VideoSource, "all">) {
    let next: Exclude<VideoSource, "all">[];
    if (isAll) {
      // Start from all-selected, remove clicked one
      next = ALL_CONCRETE.filter((s) => s !== src);
    } else {
      const current = activeConcrete;
      if (current.includes(src)) {
        next = current.filter((s) => s !== src);
        // Prevent zero selections
        if (next.length === 0) next = [src];
      } else {
        next = [...current, src];
      }
    }
    // If all concrete are selected, normalise to "all"
    onChange(next.length === ALL_CONCRETE.length ? ["all"] : next);
  }

  function isChecked(src: Exclude<VideoSource, "all">) {
    return isAll || activeConcrete.includes(src);
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="src-picker" ref={ref}>
      <button
        type="button"
        className="src-picker-trigger field"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="src-picker-label">{getLabel()}</span>
        <span className={`src-picker-arrow ${open ? "open" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="src-picker-dropdown" role="listbox" aria-multiselectable="true">
          {/* All public sites row */}
          <label className="src-picker-item src-picker-all">
            <input
              type="checkbox"
              checked={isAll}
              onChange={toggleAll}
              className="src-picker-check"
            />
            <span className="src-picker-item-label all-label">All public sites</span>
          </label>

          <div className="src-picker-divider" />

          {SOURCE_OPTIONS.map((opt) => (
            <label key={opt.value} className="src-picker-item">
              <input
                type="checkbox"
                checked={isChecked(opt.value)}
                onChange={() => toggleSource(opt.value)}
                className="src-picker-check"
              />
              <span className="src-picker-item-label">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
