"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { AnimationItem } from "lottie-web";

export function ScreenTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const currentPathRef = useRef(pathname);

  // Initialize and keep Lottie animation ready
  useEffect(() => {
    let isMounted = true;

    import("lottie-web").then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;
      if (animRef.current) {
        animRef.current.destroy();
      }
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
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, []);

  // When pathname or searchParams change (screen change completed)
  useEffect(() => {
    if (currentPathRef.current !== pathname) {
      currentPathRef.current = pathname;
      // Show loader on screen change
      setIsVisible(true);
      setIsFadingOut(false);

      // Play lottie from beginning if loaded
      animRef.current?.goToAndPlay(0);

      // Keep white screen visible for smooth transition then fade out
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
          setIsFadingOut(false);
        }, 250);
        return () => clearTimeout(hideTimer);
      }, 550);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept all internal navigation link clicks to instantly show loader
  useEffect(() => {
    function handleLinkClick(e: MouseEvent) {
      // Ignore modified clicks (Ctrl, Cmd, Shift, Alt)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.defaultPrevented) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      if (!href || targetAttr === "_blank") return;

      // Ignore hash links, mailto, tel, javascript
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
        return;
      }

      // Check if it's an internal link
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          // Check if navigating to a different page or query
          const currentUrl = new URL(window.location.href);
          if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
            setIsVisible(true);
            setIsFadingOut(false);
            animRef.current?.goToAndPlay(0);
          }
        }
      } catch {
        // Fallback for relative paths
        if (href.startsWith("/") && href !== window.location.pathname) {
          setIsVisible(true);
          setIsFadingOut(false);
          animRef.current?.goToAndPlay(0);
        }
      }
    }

    // Also handle popstate (browser back/forward buttons)
    function handlePopState() {
      setIsVisible(true);
      setIsFadingOut(false);
      animRef.current?.goToAndPlay(0);
    }

    document.addEventListener("click", handleLinkClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div
      aria-hidden={!isVisible}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: isVisible ? (isFadingOut ? 0 : 1) : 0,
        pointerEvents: isVisible ? "all" : "none",
        visibility: isVisible ? "visible" : "hidden",
        transition: "opacity 0.25s ease-out, visibility 0.25s ease-out",
        userSelect: "none"
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
