import { useEffect } from "react";
import { smoothScrollToId } from "../utils/smoothScroll";

/** Плавный скролл к #якорю после монтирования (например /#booking). */
export function useSmoothScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const id = decodeURIComponent(hash.slice(1));
    const t = window.setTimeout(() => smoothScrollToId(id), 100);
    return () => clearTimeout(t);
  }, []);
}
