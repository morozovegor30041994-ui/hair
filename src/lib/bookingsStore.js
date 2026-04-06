const STORAGE_KEY = "velvet_hair_bookings_v1";

function notify() {
  window.dispatchEvent(new CustomEvent("velvet-bookings-changed"));
}

export function isCloudBookingsEnabled() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

function loadBookingsLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveBookingsLocal(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Синхронно: только localStorage (для обратной совместимости). */
export function loadBookings() {
  return loadBookingsLocal();
}

/** Актуальный список: облако или localStorage. */
export async function loadBookingsList() {
  if (isCloudBookingsEnabled()) {
    const mod = await import("./bookingsRemote.js");
    return mod.fetchBookings();
  }
  return loadBookingsLocal();
}

function buildRow(entry) {
  const id =
    "b_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
  return {
    id,
    createdAt: new Date().toISOString(),
    name: String(entry.name || "").trim(),
    phone: String(entry.phone || "").trim(),
    dateYmd: entry.dateYmd || "",
    timeHm: String(entry.timeHm || "").trim(),
    masterId: entry.masterId || "",
    masterName: String(entry.masterName || "").trim(),
  };
}

export async function addBooking(entry) {
  const row = buildRow(entry);

  if (isCloudBookingsEnabled()) {
    const mod = await import("./bookingsRemote.js");
    await mod.insertBooking(row);
    notify();
    return row;
  }

  const list = loadBookingsLocal();
  list.unshift(row);
  saveBookingsLocal(list);
  notify();
  return row;
}

export async function removeBooking(id) {
  if (isCloudBookingsEnabled()) {
    const mod = await import("./bookingsRemote.js");
    await mod.deleteBookingRemote(id);
    notify();
    return;
  }

  const list = loadBookingsLocal().filter((b) => b.id !== id);
  saveBookingsLocal(list);
  notify();
}

export async function clearAllBookings() {
  if (isCloudBookingsEnabled()) {
    const mod = await import("./bookingsRemote.js");
    await mod.clearAllBookingsRemote();
    notify();
    return;
  }

  saveBookingsLocal([]);
  notify();
}
