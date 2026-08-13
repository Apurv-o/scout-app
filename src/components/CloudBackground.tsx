"use client";

import React, { useEffect, useRef, useState } from "react";

// Define our premium aesthetic styles
const STYLES = [
  { name: "aurora", bg: "radial-gradient(circle at 50% 50%, #10141a 0%, #0d1e2e 50%, #08101a 100%)" },
  { name: "mesh", bg: "linear-gradient(135deg, #10141a 0%, #1a1f2e 50%, #10141a 100%)" },
  { name: "stars", bg: "#10141a" }, // Handled by CSS radial-gradient dots
  { name: "fog", bg: "radial-gradient(circle at 0% 0%, #1a2533 0%, #10141a 100%)" },
  { name: "glow", bg: "radial-gradient(circle at 50% 100%, #1a160a 0%, #10141a 100%)" },
  { name: "haze", bg: "linear-gradient(0deg, #0d121c 0%, #10141a 100%)" },
];

const COLORS = {
  glow: "rgba(79, 209, 197, 0.15)", // --teal
  ring: "rgba(237, 234, 227, 0.08)", // --text
};

export default function AmbientBackground() {
  const orbRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [style, setStyle] = useState(STYLES[0]);
  const [reducedMotion, setReducedMotion] = useState(false);

  const targetMouse = useRef({ x: 0, y: 0 });
  const currentMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Select random style
    setStyle(STYLES[Math.floor(Math.random() * STYLES.length)]);
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handleMediaChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      const lerpFactor = reducedMotion ? 1 : 0.08;
      currentMouse.current.x += (targetMouse.current.x - currentMouse.current.x) * lerpFactor;
      currentMouse.current.y += (targetMouse.current.y - currentMouse.current.y) * lerpFactor;

      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${currentMouse.current.x}px, ${currentMouse.current.y}px, 0)`;
      }

      ringsRef.current.forEach((ring, i) => {
        if (ring) {
          const scale = 1 + (Math.sin(Date.now() / 1000 + i) * 0.1);
          ring.style.transform = `translate3d(${currentMouse.current.x}px, ${currentMouse.current.y}px, 0) scale(${scale})`;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [reducedMotion]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: style.bg,
        transition: "background 1s ease",
      }}
    >
      {/* Aesthetic overlay layer (stars/fog/noise) */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: style.name === "stars" ? 0.3 : 0.1,
        backgroundImage: style.name === "stars" 
            ? "radial-gradient(white 1px, transparent 1px)" 
            : "none",
        backgroundSize: "50px 50px",
        pointerEvents: "none",
        animation: reducedMotion ? "none" : "drift 30s linear infinite",
      }} />

      {/* Cursor effect layer */}
      <div style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
        <div
          ref={orbRef}
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${COLORS.glow} 0%, transparent 70%)`,
            filter: "blur(40px)",
            top: "-150px",
            left: "-150px",
            willChange: "transform",
          }}
        />
        {[0, 1].map((i) => (
          <div
            key={i}
            ref={(el) => { ringsRef.current[i] = el; }}
            style={{
              position: "absolute",
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              border: `1px solid ${COLORS.ring}`,
              top: "-75px",
              left: "-75px",
              willChange: "transform",
              opacity: 0.5 - i * 0.2,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes drift {
          from { transform: translateY(0); }
          to { transform: translateY(-50px); }
        }
      `}</style>
    </div>
  );
}
