"use client";

import { useEffect, useState } from "react";

export default function Clock() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="rec-clock">
      <span className="rec-dot" aria-hidden="true" />
      <span>
        {h}:{m}:{s}
      </span>
    </div>
  );
}
