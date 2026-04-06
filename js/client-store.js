/**
 * Профили клиентов: предстоящие записи и история процедур (localStorage).
 * Синхронизируется с заявками с формы по номеру телефона.
 */
(function (global) {
  var STORAGE_KEY = "velvet_client_profiles_v1";

  function todayYmd() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    if (m.length < 2) m = "0" + m;
    var day = String(d.getDate());
    if (day.length < 2) day = "0" + day;
    return y + "-" + m + "-" + day;
  }

  /** Нормализация к виду 7XXXXXXXXXX или null */
  function normalizePhone(phone) {
    var d = String(phone || "").replace(/\D/g, "");
    if (d.length === 11 && d.charAt(0) === "8") {
      d = "7" + d.slice(1);
    }
    if (d.length === 10) {
      d = "7" + d;
    }
    if (d.length === 11 && d.charAt(0) === "7") {
      return d;
    }
    return null;
  }

  function formatPhoneDisplay(key) {
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
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }

  function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getProfile(phoneKey) {
    var all = loadAll();
    if (!all[phoneKey]) {
      return {
        phoneKey: phoneKey,
        name: "",
        upcoming: [],
        past: [],
      };
    }
    var p = all[phoneKey];
    if (!Array.isArray(p.upcoming)) p.upcoming = [];
    if (!Array.isArray(p.past)) p.past = [];
    return p;
  }

  function saveProfile(phoneKey, profile) {
    var all = loadAll();
    all[phoneKey] = profile;
    saveAll(all);
  }

  /** Переносит просроченные записи в «прошедшие процедуры» */
  function nowHm() {
    var d = new Date();
    var h = String(d.getHours());
    if (h.length < 2) h = "0" + h;
    var mi = String(d.getMinutes());
    if (mi.length < 2) mi = "0" + mi;
    return h + ":" + mi;
  }

  function visitIsPast(dateYmd, timeHm) {
    var today = todayYmd();
    if (!dateYmd) return false;
    if (dateYmd < today) return true;
    if (dateYmd > today) return false;
    if (!timeHm) return false;
    return timeHm < nowHm();
  }

  function migratePastDue(profile) {
    var still = [];
    (profile.upcoming || []).forEach(function (u) {
      if (!u.dateYmd) {
        still.push(u);
        return;
      }
      if (visitIsPast(u.dateYmd, u.timeHm)) {
        profile.past.push({
          id: "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
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

  function syncFromBooking(bookingRow) {
    var key = normalizePhone(bookingRow.phone);
    if (!key) return null;
    var p = getProfile(key);
    migratePastDue(p);
    p.name = bookingRow.name || p.name;
    var uid =
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

  global.VelvetClientStore = {
    normalizePhone: normalizePhone,
    formatPhoneDisplay: formatPhoneDisplay,
    getProfile: getProfile,
    saveProfile: saveProfile,
    migratePastDue: migratePastDue,
    syncFromBooking: syncFromBooking,
  };
})(typeof window !== "undefined" ? window : this);
