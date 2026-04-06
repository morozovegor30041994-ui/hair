/**
 * Хранение заявок в localStorage браузера (без сервера).
 * Важно: заявки с сайта видны только в том же браузере на этом устройстве.
 * Для продакшена с реальными клиентами нужен бэкенд или облачная БД.
 */
(function (global) {
  var STORAGE_KEY = "velvet_hair_bookings_v1";

  function loadBookings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveBookings(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function addBooking(entry) {
    var list = loadBookings();
    var id =
      "b_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
    var row = {
      id: id,
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
    return row;
  }

  function deleteBooking(id) {
    var list = loadBookings().filter(function (b) {
      return b.id !== id;
    });
    saveBookings(list);
  }

  function clearAllBookings() {
    saveBookings([]);
  }

  global.VelvetBookings = {
    load: loadBookings,
    add: addBooking,
    remove: deleteBooking,
    clearAll: clearAllBookings,
  };
})(typeof window !== "undefined" ? window : this);
