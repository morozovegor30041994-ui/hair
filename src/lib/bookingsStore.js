const STORAGE_KEY = "velvet_hair_bookings_v1";

function notify() {
  window.dispatchEvent(new CustomEvent("velvet-bookings-changed"));
}

export function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveBookings(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addBooking(entry) {
  const list = loadBookings();
  const id =
    "b_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  const row = {
    id,
    createdAt: new Date().toISOString(),
    name: String(entry.name || "").trim(),
    phone: String(entry.phone || "").trim(),
    dateYmd: entry.dateYmd || "",
    timeHm: String(entry.timeHm || "").trim(),
    masterId: entry.masterId || "",
    masterName: String(entry.masterName || "").trim(),
  };
  list.unshift(row);
  saveBookings(list);
  notify();
  return row;
}

export function removeBooking(id) {
  const list = loadBookings().filter((b) => b.id !== id);
  saveBookings(list);
  notify();
}

export function clearAllBookings() {
  saveBookings([]);
  notify();
}
