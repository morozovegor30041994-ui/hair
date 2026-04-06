const STORAGE_KEY = "velvet_client_profiles_v1";

function notify() {
  window.dispatchEvent(new CustomEvent("velvet-client-changed"));
}

export function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  let m = String(d.getMonth() + 1);
  if (m.length < 2) m = "0" + m;
  let day = String(d.getDate());
  if (day.length < 2) day = "0" + day;
  return y + "-" + m + "-" + day;
}

export function normalizePhone(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.length === 11 && d.charAt(0) === "8") d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;
  if (d.length === 11 && d.charAt(0) === "7") return d;
  return null;
}

export function formatPhoneDisplay(key) {
  if (!key || key.length !== 11) return key || "";
  return (
    "+7 (" +
    key.slice(1, 4) +
    ") " +
    key.slice(4, 7) +
    "-" +
    key.slice(7, 9) +
    "-" +
    key.slice(9, 11)
  );
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getProfile(phoneKey) {
  const all = loadAll();
  if (!all[phoneKey]) {
    return {
      phoneKey,
      name: "",
      upcoming: [],
      past: [],
    };
  }
  const p = all[phoneKey];
  if (!Array.isArray(p.upcoming)) p.upcoming = [];
  if (!Array.isArray(p.past)) p.past = [];
  return p;
}

export function saveProfile(phoneKey, profile) {
  const all = loadAll();
  all[phoneKey] = profile;
  saveAll(all);
  notify();
}

function nowHm() {
  const d = new Date();
  let h = String(d.getHours());
  if (h.length < 2) h = "0" + h;
  let mi = String(d.getMinutes());
  if (mi.length < 2) mi = "0" + mi;
  return h + ":" + mi;
}

function visitIsPast(dateYmd, timeHm) {
  const today = todayYmd();
  if (!dateYmd) return false;
  if (dateYmd < today) return true;
  if (dateYmd > today) return false;
  if (!timeHm) return false;
  return timeHm < nowHm();
}

export function migratePastDue(profile) {
  const still = [];
  (profile.upcoming || []).forEach((u) => {
    if (!u.dateYmd) {
      still.push(u);
      return;
    }
    if (visitIsPast(u.dateYmd, u.timeHm)) {
      profile.past.push({
        id:
          "p_" +
          Date.now().toString(36) +
          "_" +
          Math.random().toString(36).slice(2, 7),
        dateYmd: u.dateYmd,
        timeHm: u.timeHm || "",
        masterName: u.masterName || "",
        title: "Визит по записи",
        note:
          "Данные сохранены автоматически. Уточните факт проведения процедуры в салоне.",
        completedAt: u.dateYmd,
      });
    } else {
      still.push(u);
    }
  });
  profile.upcoming = still;
}

export function syncFromBooking(bookingRow) {
  const key = normalizePhone(bookingRow.phone);
  if (!key) return null;
  const p = getProfile(key);
  migratePastDue(p);
  p.name = bookingRow.name || p.name;
  const uid =
    "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  p.upcoming.push({
    id: uid,
    bookingId: bookingRow.id,
    dateYmd: bookingRow.dateYmd,
    timeHm: bookingRow.timeHm || "",
    masterName: bookingRow.masterName,
    masterId: bookingRow.masterId,
    createdAt: bookingRow.createdAt,
  });
  saveProfile(key, p);
  return p;
}
