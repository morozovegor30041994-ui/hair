import { useState, useRef, useEffect, useMemo, useId } from "react";
import { parseYmdLocal, pad2, todayLocalYmd } from "../lib/schedule";

function dateToYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function capitalizeFirst(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function calendarWeeks(viewYear, viewMonth) {
  const first = new Date(viewYear, viewMonth, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(viewYear, viewMonth, 1 - mondayOffset);
  const weeks = [];
  const cur = new Date(start);
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function BookingDatePicker({ value, minYmd, onChange, labelledBy }) {
  const reactId = useId();
  const popoverId = `${reactId}-cal`;
  const triggerId = `${reactId}-btn`;
  const rootRef = useRef(null);

  const [open, setOpen] = useState(false);

  const minDate = useMemo(() => parseYmdLocal(minYmd), [minYmd]);
  const minTs = minDate ? startOfDay(minDate) : 0;
  const selectedDate = useMemo(() => parseYmdLocal(value), [value]);
  const todayYmd = todayLocalYmd();

  const baseForView = selectedDate || minDate || new Date();
  const [viewYear, setViewYear] = useState(() => baseForView.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => baseForView.getMonth());

  useEffect(() => {
    if (!value) return;
    const p = parseYmdLocal(value);
    if (p) {
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const weeks = useMemo(() => calendarWeeks(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthTitle = capitalizeFirst(
    new Date(viewYear, viewMonth, 15).toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    })
  );

  const endPrevMonth = new Date(viewYear, viewMonth, 0);
  const prevNavDisabled = startOfDay(endPrevMonth) < minTs;

  function goPrevMonth() {
    if (prevNavDisabled) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function pickDay(d) {
    if (startOfDay(d) < minTs) return;
    onChange(dateToYmd(d));
    setOpen(false);
  }

  function pickToday() {
    onChange(todayYmd);
    const t = parseYmdLocal(todayYmd);
    if (t) {
      setViewYear(t.getFullYear());
      setViewMonth(t.getMonth());
    }
    setOpen(false);
  }

  const triggerLabel =
    value && selectedDate
      ? capitalizeFirst(
          selectedDate.toLocaleDateString("ru-RU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        )
      : null;

  return (
    <div className={`date-picker${open ? " date-picker--open" : ""}`} ref={rootRef}>
      <input type="hidden" name="date" value={value} readOnly aria-hidden />
      <button
        type="button"
        id={triggerId}
        className={`date-picker__trigger${!value ? " date-picker__trigger--placeholder" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        aria-labelledby={labelledBy}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="date-picker__trigger-text">{triggerLabel || "Выберите дату"}</span>
        <span className="date-picker__trigger-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="date-picker__popover" id={popoverId} role="dialog" aria-modal="true" aria-labelledby={`${reactId}-title`}>
          <div className="date-picker__head">
            <button
              type="button"
              className="date-picker__nav"
              aria-label="Предыдущий месяц"
              disabled={prevNavDisabled}
              onClick={goPrevMonth}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h3 className="date-picker__title" id={`${reactId}-title`}>
              {monthTitle}
            </h3>
            <button type="button" className="date-picker__nav" aria-label="Следующий месяц" onClick={goNextMonth}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="date-picker__dow" role="row">
            {WEEKDAYS.map((d) => (
              <span key={d} className="date-picker__dow-cell" role="columnheader">
                {d}
              </span>
            ))}
          </div>

          <div className="date-picker__grid" role="grid" aria-label="Дни месяца">
            {weeks.map((row, wi) => (
              <div key={wi} className="date-picker__row" role="row">
                {row.map((d) => {
                  const ymd = dateToYmd(d);
                  const inMonth = d.getMonth() === viewMonth && d.getFullYear() === viewYear;
                  const disabled = startOfDay(d) < minTs;
                  const selected = value === ymd;
                  const isToday = ymd === todayYmd;

                  return (
                    <button
                      key={ymd + wi}
                      type="button"
                      role="gridcell"
                      disabled={disabled}
                      className={`date-picker__day${!inMonth ? " date-picker__day--outside" : ""}${selected ? " date-picker__day--selected" : ""}${isToday && !selected ? " date-picker__day--today" : ""}`}
                      onClick={() => pickDay(d)}
                      aria-label={d.toLocaleDateString("ru-RU", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      aria-selected={selected}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="date-picker__footer">
            <button
              type="button"
              className="date-picker__today-btn"
              onClick={pickToday}
              disabled={!parseYmdLocal(todayYmd) || startOfDay(parseYmdLocal(todayYmd)) < minTs}
            >
              Сегодня
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
