import { useEffect } from "react";

function setScrollVar() {
  document.documentElement.style.setProperty("--scroll-y", String(window.scrollY));
}

export default function ScrollBackground() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      document.documentElement.style.setProperty("--scroll-y", "0");
      return () => document.documentElement.style.removeProperty("--scroll-y");
    }

    setScrollVar();

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollVar();
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", setScrollVar, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", setScrollVar);
      document.documentElement.style.removeProperty("--scroll-y");
    };
  }, []);

  return (
    <div className="scroll-bg" aria-hidden="true">
      <div className="scroll-bg__wrap scroll-bg__wrap--1">
        <div className="scroll-bg__inner scroll-bg__inner--1" />
      </div>
      <div className="scroll-bg__wrap scroll-bg__wrap--2">
        <div className="scroll-bg__inner scroll-bg__inner--2" />
      </div>
      <div className="scroll-bg__wrap scroll-bg__wrap--3">
        <div className="scroll-bg__inner scroll-bg__inner--3" />
      </div>
    </div>
  );
}
