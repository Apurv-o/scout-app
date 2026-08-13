"use client";

import React, { useEffect, useRef, useState } from "react";

interface CloudLayer {
  size: string;
  left: string;
  top: string;
  color: string;
  blur: string;
  mouseFactor: number; // Positive/negative for multi-depth parallax
  floatSpeedX: number;
  floatSpeedY: number;
  floatRangeX: number;
  floatRangeY: number;
  phase: number;
}

const CLOUD_LAYERS: CloudLayer[] = [
  {
    size: "50vw",
    left: "10%",
    top: "55%",
    color: "rgba(242, 169, 59, 0.04)", // Soft amber to match primary accent
    blur: "120px",
    mouseFactor: -0.03, // Negative parallax for deep background depth
    floatSpeedX: 0.4,
    floatSpeedY: 0.3,
    floatRangeX: 40,
    floatRangeY: 30,
    phase: 0,
  },
  {
    size: "45vw",
    left: "55%",
    top: "10%",
    color: "rgba(79, 209, 197, 0.05)", // Soft teal to match the second accent
    blur: "100px",
    mouseFactor: 0.05,
    floatSpeedX: 0.5,
    floatSpeedY: 0.6,
    floatRangeX: 50,
    floatRangeY: 40,
    phase: Math.PI / 4,
  },
  {
    size: "40vw",
    left: "20%",
    top: "15%",
    color: "rgba(151, 162, 180, 0.04)", // Soft slate-blue/text-dim
    blur: "90px",
    mouseFactor: 0.02,
    floatSpeedX: 0.3,
    floatSpeedY: 0.4,
    floatRangeX: 30,
    floatRangeY: 35,
    phase: Math.PI / 2,
  },
  {
    size: "35vw",
    left: "60%",
    top: "60%",
    color: "rgba(79, 209, 197, 0.03)", // Subtle secondary teal highlight
    blur: "80px",
    mouseFactor: -0.06,
    floatSpeedX: 0.6,
    floatSpeedY: 0.5,
    floatRangeX: 45,
    floatRangeY: 45,
    phase: Math.PI,
  },
];

export default function CloudBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Use refs to store mouse positions to prevent triggering re-renders
  const targetMouse = useRef({ x: 0, y: 0 });
  const currentMouse = useRef({ x: 0, y: 0 });
  const time = useRef(0);

  // References to each individual layer element to manipulate inline style directly
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates to [-0.5, 0.5] range relative to viewport
      targetMouse.current.x = e.clientX / window.innerWidth - 0.5;
      targetMouse.current.y = e.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      // Gentle constant rotation/floating time increment
      // If reducedMotion is true, float at 1/5th speed, and don't track mouse movement.
      const timeIncrement = reducedMotion ? 0.0004 : 0.002;
      time.current += timeIncrement;

      if (!reducedMotion) {
        // Interpolate mouse movement with linear interpolation (inertia) for buttery smooth follow
        currentMouse.current.x += (targetMouse.current.x - currentMouse.current.x) * 0.05;
        currentMouse.current.y += (targetMouse.current.y - currentMouse.current.y) * 0.05;
      } else {
        // Slowly snap current mouse to 0 if reduced motion was toggled on the fly
        currentMouse.current.x += (0 - currentMouse.current.x) * 0.05;
        currentMouse.current.y += (0 - currentMouse.current.y) * 0.05;
      }

      // Update transform properties directly on each DOM node to avoid React state overhead
      layerRefs.current.forEach((layerEl, idx) => {
        if (!layerEl) return;

        const layer = CLOUD_LAYERS[idx];
        if (!layer) return;

        // Auto-floating orbital oscillation using trigonometric functions
        const floatX = Math.sin(time.current * layer.floatSpeedX + layer.phase) * layer.floatRangeX;
        const floatY = Math.cos(time.current * layer.floatSpeedY + layer.phase) * layer.floatRangeY;

        // Mouse displacement calculation using viewport metrics and layer factors
        const mouseDisplacementX = currentMouse.current.x * layer.mouseFactor * window.innerWidth;
        const mouseDisplacementY = currentMouse.current.y * layer.mouseFactor * window.innerHeight;

        // Combined transform using hardware-accelerated translate3d
        const finalX = floatX + mouseDisplacementX;
        const finalY = floatY + mouseDisplacementY;

        layerEl.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0)`;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        backgroundColor: "transparent",
      }}
    >
      {CLOUD_LAYERS.map((layer, idx) => (
        <div
          key={idx}
          ref={(el) => {
            layerRefs.current[idx] = el;
          }}
          style={{
            position: "absolute",
            width: layer.size,
            height: layer.size,
            left: layer.left,
            top: layer.top,
            backgroundColor: layer.color,
            borderRadius: "50%",
            filter: `blur(${layer.blur})`,
            willChange: "transform",
            transform: "translate3d(0px, 0px, 0px)",
          }}
        />
      ))}
    </div>
  );
}
