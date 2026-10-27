import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Progressive enhancement: content remains visible without animation support.
export default function MotionEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !window.IntersectionObserver) return;
    const animations = new Set();
    const seen = new WeakSet();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          const animation = entry.target.animate(
            [
              { opacity: 0.35, transform: "translateY(22px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 550, easing: "cubic-bezier(.2,.7,.2,1)" },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      },
      { threshold: 0.08 },
    );
    const scan = () =>
      document
        .querySelectorAll(
          ".value-card,.steps article,.data-stat,.metric,.catalog-card,.data-panel,.profile-cover,.section",
        )
        .forEach((node) => {
          if (!seen.has(node)) {
            seen.add(node);
            observer.observe(node);
          }
        });
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.getElementById("root"), {
      childList: true,
      subtree: true,
    });
    const stop = () => {
      observer.disconnect();
      mutations.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
    preference.addEventListener("change", stop);
    return () => {
      stop();
      preference.removeEventListener("change", stop);
    };
  }, [pathname]);
  return null;
}
