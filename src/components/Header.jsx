import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { smoothScrollToId } from "../utils/smoothScroll";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(ev) {
      if (menuRef.current && !menuRef.current.contains(ev.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(ev) {
      if (ev.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function anchorNav(e, id) {
    e.preventDefault();
    smoothScrollToId(id);
    setOpen(false);
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="logo">
          Velvet<span>Hair</span>
        </Link>
        <div
          ref={menuRef}
          className={`header-menu${open ? " is-open" : ""}`}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            className="header-menu__trigger"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="nav"
            aria-haspopup="true"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="header-menu__icon" aria-hidden>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <nav className="header-menu__panel nav" id="nav" aria-label="Основное меню">
            <a href="#about" onClick={(e) => anchorNav(e, "about")}>
              О салоне
            </a>
            <a href="#services" onClick={(e) => anchorNav(e, "services")}>
              Услуги
            </a>
            <a href="#gallery" onClick={(e) => anchorNav(e, "gallery")}>
              Галерея
            </a>
            <a href="#booking" onClick={(e) => anchorNav(e, "booking")}>
              Запись
            </a>
            <a href="#contact" onClick={(e) => anchorNav(e, "contact")}>
              Контакты
            </a>
            <Link to="/lk" className="nav__btn nav__btn--primary" onClick={() => setOpen(false)}>
              ЛК
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
