/** Декоративные иконки для карточек услуг (линейный стиль). */

export function IconCapsules(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <circle cx="14" cy="24" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="34" cy="24" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 24h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function IconTape(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <rect x="6" y="14" width="36" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="26" width="36" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M12 18v4M20 18v4M28 18v4M36 18v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function IconNano(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function IconCorrection(props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <path
        d="M14 32l16-16M18 36l4-4M26 14l8 8-14 14-8-8 14-14z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M22 18l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
