"use client";

import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

export default function Loading() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    import("lottie-web").then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;
      animRef.current = lottieModule.default.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "/Loading.json"
      });
    });

    return () => {
      isMounted = false;
      animRef.current?.destroy();
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh"
      }}
    >
      {/* Centered Big Lottie Animation Only */}
      <div
        ref={containerRef}
        style={{
          width: "clamp(340px, 45vw, 480px)",
          height: "clamp(340px, 45vw, 480px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      />
    </div>
  );
}
