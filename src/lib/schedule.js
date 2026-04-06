export const SCHEDULE_ANCHOR_YMD = "2026-04-06";
export const WORK_OPEN_HM = "10:00";
export const WORK_CLOSE_HM = "21:00";
export const BOOKING_BLOCK_MINUTES = 240;

export const MASTERS = {
  alina: "Алина",
  olga: "Ольга",
  anna: "Анна",
  kristina: "Кристина",
};

export const SHIFT_IDS = [
  ["alina", "kristina"],
  ["alina", "olga"],
  ["olga", "anna"],
  ["anna", "kristina"],
];

export function todayLocalYmd() {
  const d = new Date();
  const y = d.getFullYear();
  let m = String(d.getMonth() + 1);
  if (m.length < 2) m = "0" + m;
  let day = String(d.getDate());
  if (day.length < 2) day = "0" + day;
  return y + "-" + m + "-" + day;
}

export function parseYmdLocal(ymd) {
  if (!ymd) return null;
  const p = ymd.split("-");
  if (p.length !== 3) return null;
  return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}

export function getShiftIndexForDate(ymd) {
  const d = parseYmdLocal(ymd);
  const anchor = parseYmdLocal(SCHEDULE_ANCHOR_YMD);
  if (!d || !anchor) return 0;
  d.setHours(0, 0, 0, 0);
  anchor.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((d.getTime() - anchor.getTime()) / 86400000);
  return ((dayDiff % 4) + 4) % 4;
}

export function getWorkingIdsForDate(ymd) {
  const idx = getShiftIndexForDate(ymd);
  return SHIFT_IDS[idx].slice();
}

export function getShiftLabelForDate(ymd) {
  return getWorkingIdsForDate(ymd)
    .map((id) => MASTERS[id])
    .join(", ");
}

export function nowHmLocal() {
  const d = new Date();
  let h = String(d.getHours());
  if (h.length < 2) h = "0" + h;
  let mi = String(d.getMinutes());
  if (mi.length < 2) mi = "0" + mi;
  return h + ":" + mi;
}

export function pad2(n) {
  const s = String(n);
  return s.length < 2 ? "0" + s : s;
}

export function hmToMin(hm) {
  if (!hm || hm.indexOf(":") === -1) return -1;
  const p = hm.split(":");
  const h = parseInt(p[0], 10);
  const mi = parseInt(p[1], 10);
  if (isNaN(h) || isNaN(mi)) return -1;
  return h * 60 + mi;
}

export function nextHalfHourSlotFromNow(hm) {
  const p = hm.split(":");
  if (p.length < 2) return WORK_OPEN_HM;
  const h = parseInt(p[0], 10);
  const mi = parseInt(p[1], 10);
  const totalMin = h * 60 + mi;
  if (isNaN(totalMin)) return WORK_OPEN_HM;
  if (totalMin % 30 === 0) return pad2(h) + ":" + pad2(mi);
  const next = Math.ceil(totalMin / 30) * 30;
  const nh = Math.floor(next / 60);
  const nm = next % 60;
  return pad2(nh) + ":" + pad2(nm);
}

export function maxHm(a, b) {
  return a >= b ? a : b;
}

export function getEffectiveMinVisitHm(ymd) {
  const today = todayLocalYmd();
  if (ymd === today) {
    return maxHm(WORK_OPEN_HM, nextHalfHourSlotFromNow(nowHmLocal()));
  }
  return WORK_OPEN_HM;
}

export function isOnVisitSlotGrid(timeHm) {
  const t = hmToMin(timeHm);
  const open = hmToMin(WORK_OPEN_HM);
  if (t < 0 || open < 0) return false;
  return (t - open) % 30 === 0;
}

export function minToHm(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return pad2(h) + ":" + pad2(m);
}

export function allSlotsHm() {
  const open = hmToMin(WORK_OPEN_HM);
  const close = hmToMin(WORK_CLOSE_HM);
  const out = [];
  for (let m = open; m <= close; m += 30) {
    out.push(minToHm(m));
  }
  return out;
}

export function formatSlotLabelHm(hm) {
  return hm.replace(":", ".");
}

export function isSlotBookedOrBlocked(ymd, slotHm, bookingsList) {
  const slotM = hmToMin(slotHm);
  if (slotM < 0) return true;
  for (let i = 0; i < bookingsList.length; i++) {
    const b = bookingsList[i];
    if (b.dateYmd !== ymd || !b.timeHm) continue;
    const start = hmToMin(b.timeHm);
    if (start < 0) continue;
    if (slotM >= start && slotM < start + BOOKING_BLOCK_MINUTES) {
      return true;
    }
  }
  return false;
}

export function isSlotDisabledForPicker(ymd, slotHm, effMin, bookingsList) {
  if (!slotHm) return true;
  if (slotHm < effMin) return true;
  return isSlotBookedOrBlocked(ymd, slotHm, bookingsList);
}

export function getScheduleRows14() {
  const today = todayLocalYmd();
  const start = parseYmdLocal(today);
  if (!start) return [];
  const rows = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + i
    );
    const y = d.getFullYear();
    let m = String(d.getMonth() + 1);
    if (m.length < 2) m = "0" + m;
    let day = String(d.getDate());
    if (day.length < 2) day = "0" + day;
    const ymd = y + "-" + m + "-" + day;
    const pretty = d.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    rows.push({
      ymd,
      pretty,
      isToday: ymd === today,
      shiftLabel: getShiftLabelForDate(ymd),
    });
  }
  return rows;
}
