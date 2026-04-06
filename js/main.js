(function () {
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  var headerInner = document.querySelector(".header__inner");

  if (!burger || !nav || !headerInner) return;

  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    headerInner.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("is-open");
      headerInner.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Открыть меню");
    });
  });
})();

(function () {
  /**
   * Якорь графика: в этот день — 1-я смена (Алина + Кристина). Дальше каждый день следующая смена по кругу.
   * Пример для 2026: 06.04 → смена 1, 07.04 → смена 2, 08.04 → смена 3, 09.04 → смена 4, 10.04 → снова смена 1…
   */
  var SCHEDULE_ANCHOR_YMD = "2026-04-06";

  /** Часы работы салона (как в блоке контактов): ежедневно 10:00–21:00 */
  var WORK_OPEN_HM = "10:00";
  var WORK_CLOSE_HM = "21:00";

  /** После начала записи слоты заняты ещё 4 часа (перекрытие процедур). */
  var BOOKING_BLOCK_MINUTES = 240;

  var MASTERS = {
    alina: "Алина",
    olga: "Ольга",
    anna: "Анна",
    kristina: "Кристина",
  };

  /**
   * 4 смены подряд, каждый календарный день — своя смена; цикл 4 дня.
   * 1 — Алина + Кристина, 2 — Алина + Ольга, 3 — Ольга + Анна, 4 — Анна + Кристина.
   */
  var SHIFT_IDS = [
    ["alina", "kristina"],
    ["alina", "olga"],
    ["olga", "anna"],
    ["anna", "kristina"],
  ];

  function todayLocalYmd() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    if (m.length < 2) m = "0" + m;
    var day = String(d.getDate());
    if (day.length < 2) day = "0" + day;
    return y + "-" + m + "-" + day;
  }

  function parseYmdLocal(ymd) {
    if (!ymd) return null;
    var p = ymd.split("-");
    if (p.length !== 3) return null;
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }

  /** Индекс смены 0…3: номер дня относительно якоря по модулю 4 */
  function getShiftIndexForDate(ymd) {
    var d = parseYmdLocal(ymd);
    var anchor = parseYmdLocal(SCHEDULE_ANCHOR_YMD);
    if (!d || !anchor) return 0;
    d.setHours(0, 0, 0, 0);
    anchor.setHours(0, 0, 0, 0);
    var dayDiff = Math.round((d.getTime() - anchor.getTime()) / 86400000);
    return ((dayDiff % 4) + 4) % 4;
  }

  function getWorkingIdsForDate(ymd) {
    var idx = getShiftIndexForDate(ymd);
    return SHIFT_IDS[idx].slice();
  }

  function getShiftLabelForDate(ymd) {
    var ids = getWorkingIdsForDate(ymd);
    return ids
      .map(function (id) {
        return MASTERS[id];
      })
      .join(", ");
  }

  var form = document.getElementById("booking-form");
  if (!form) return;

  var dateInput = document.getElementById("booking-date") || form.querySelector('input[name="date"]');
  var timeInput = document.getElementById("booking-time") || form.querySelector('input[name="time"]');
  var successEl = document.getElementById("booking-form-success");
  var masterHint = document.getElementById("master-hint");
  var masterCards = document.querySelectorAll(".master-card[data-master]");
  function updateMastersForDate() {
    var ymd = dateInput ? dateInput.value : "";
    var working = ymd ? getWorkingIdsForDate(ymd) : [];

    masterCards.forEach(function (label) {
      var id = label.getAttribute("data-master");
      var input = label.querySelector('input[name="master"]');
      if (!input) return;

      var isOn = working.indexOf(id) !== -1;
      input.disabled = !ymd || !isOn;
      label.classList.toggle("master-card--disabled", !isOn);

      if (!isOn && input.checked) {
        input.checked = false;
      }
    });

    if (masterHint) {
      if (!ymd) {
        masterHint.textContent = "Сначала выберите дату — покажем, кто в смене.";
      } else {
        masterHint.textContent =
          "В эту дату в смене: " + getShiftLabelForDate(ymd) + ". Выберите мастера.";
      }
    }
  }

  function nowHmLocal() {
    var d = new Date();
    var h = String(d.getHours());
    if (h.length < 2) h = "0" + h;
    var mi = String(d.getMinutes());
    if (mi.length < 2) mi = "0" + mi;
    return h + ":" + mi;
  }

  function pad2(n) {
    var s = String(n);
    return s.length < 2 ? "0" + s : s;
  }

  function hmToMin(hm) {
    if (!hm || hm.indexOf(":") === -1) return -1;
    var p = hm.split(":");
    var h = parseInt(p[0], 10);
    var mi = parseInt(p[1], 10);
    if (isNaN(h) || isNaN(mi)) return -1;
    return h * 60 + mi;
  }

  /** Ближайший слот с шагом 30 минут не раньше текущего момента (граница включена). */
  function nextHalfHourSlotFromNow(hm) {
    var p = hm.split(":");
    if (p.length < 2) return WORK_OPEN_HM;
    var h = parseInt(p[0], 10);
    var mi = parseInt(p[1], 10);
    var totalMin = h * 60 + mi;
    if (isNaN(totalMin)) return WORK_OPEN_HM;
    if (totalMin % 30 === 0) return pad2(h) + ":" + pad2(mi);
    var next = Math.ceil(totalMin / 30) * 30;
    var nh = Math.floor(next / 60);
    var nm = next % 60;
    return pad2(nh) + ":" + pad2(nm);
  }

  function maxHm(a, b) {
    return a >= b ? a : b;
  }

  function getEffectiveMinVisitHm(ymd) {
    var today = todayLocalYmd();
    if (ymd === today) {
      return maxHm(WORK_OPEN_HM, nextHalfHourSlotFromNow(nowHmLocal()));
    }
    return WORK_OPEN_HM;
  }

  function isOnVisitSlotGrid(timeHm) {
    var t = hmToMin(timeHm);
    var open = hmToMin(WORK_OPEN_HM);
    if (t < 0 || open < 0) return false;
    return (t - open) % 30 === 0;
  }

  function minToHm(totalMin) {
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    return pad2(h) + ":" + pad2(m);
  }

  /** Все слоты 10:00 … 21:00 с шагом 30 минут. */
  function allSlotsHm() {
    var open = hmToMin(WORK_OPEN_HM);
    var close = hmToMin(WORK_CLOSE_HM);
    var out = [];
    for (var m = open; m <= close; m += 30) {
      out.push(minToHm(m));
    }
    return out;
  }

  function formatSlotLabelHm(hm) {
    return hm.replace(":", ".");
  }

  /** Слот недоступен: совпадает с чужой записью или попадает в 4 ч после неё. */
  function isSlotBookedOrBlocked(ymd, slotHm) {
    if (!window.VelvetBookings) return false;
    var slotM = hmToMin(slotHm);
    if (slotM < 0) return true;
    var list = VelvetBookings.load();
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (b.dateYmd !== ymd || !b.timeHm) continue;
      var start = hmToMin(b.timeHm);
      if (start < 0) continue;
      if (slotM >= start && slotM < start + BOOKING_BLOCK_MINUTES) {
        return true;
      }
    }
    return false;
  }

  function isSlotDisabledForPicker(ymd, slotHm, effMin) {
    if (!slotHm) return true;
    if (slotHm < effMin) return true;
    return isSlotBookedOrBlocked(ymd, slotHm);
  }

  function renderTimeSlots() {
    var container = document.getElementById("booking-time-slots");
    var hintEl = document.getElementById("booking-time-slots-hint");
    if (!container || !timeInput) return;

    var ymd = dateInput ? dateInput.value : "";
    var preserveHm = timeInput.value;
    container.textContent = "";
    container.classList.remove("booking-time-slots--empty");

    if (hintEl) {
      hintEl.hidden = true;
      hintEl.textContent = "";
    }

    timeInput.setCustomValidity("");

    if (!ymd) {
      timeInput.value = "";
      container.classList.add("booking-time-slots--empty");
      if (hintEl) {
        hintEl.textContent = "Сначала выберите дату — появятся доступные слоты.";
        hintEl.hidden = false;
      }
      return;
    }

    var effMin = getEffectiveMinVisitHm(ymd);
    if (effMin > WORK_CLOSE_HM) {
      timeInput.value = "";
      timeInput.setCustomValidity(
        "На сегодня свободных слотов нет. Выберите другую дату."
      );
      if (hintEl) {
        hintEl.textContent =
          "На сегодня свободных слотов нет. Выберите другую дату.";
        hintEl.hidden = false;
      }
      return;
    }

    var slots = allSlotsHm();
    var hasFree = false;

    slots.forEach(function (slotHm) {
      var disabled = isSlotDisabledForPicker(ymd, slotHm, effMin);
      if (!disabled) hasFree = true;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "booking-time-slot";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.setAttribute("data-time", slotHm);
      btn.textContent = formatSlotLabelHm(slotHm);
      btn.disabled = disabled;
      if (disabled) {
        btn.title = slotHm < effMin ? "Время уже прошло" : "Занято (запись или ближайшие 4 часа)";
      }

      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        timeInput.value = slotHm;
        timeInput.setCustomValidity("");
        container.querySelectorAll(".booking-time-slot").forEach(function (b) {
          b.classList.remove("booking-time-slot--selected");
          b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("booking-time-slot--selected");
        btn.setAttribute("aria-checked", "true");
      });

      container.appendChild(btn);
    });

    if (!hasFree) {
      timeInput.value = "";
      timeInput.setCustomValidity("На эту дату нет свободных слотов.");
      if (hintEl) {
        hintEl.textContent =
          "На эту дату нет свободных слотов. Выберите другую дату или время.";
        hintEl.hidden = false;
      }
      return;
    }

    var keep =
      preserveHm &&
      !isSlotDisabledForPicker(ymd, preserveHm, effMin);
    if (keep) {
      timeInput.value = preserveHm;
      container.querySelectorAll(".booking-time-slot").forEach(function (b) {
        if (b.getAttribute("data-time") === preserveHm && !b.disabled) {
          b.classList.add("booking-time-slot--selected");
          b.setAttribute("aria-checked", "true");
        }
      });
    } else {
      timeInput.value = "";
    }
  }

  if (dateInput) {
    dateInput.min = todayLocalYmd();
    dateInput.addEventListener("change", function () {
      if (timeInput) timeInput.value = "";
      updateMastersForDate();
      renderTimeSlots();
    });
    dateInput.addEventListener("focus", function () {
      dateInput.min = todayLocalYmd();
      renderTimeSlots();
    });
  }

  updateMastersForDate();
  renderTimeSlots();

  window.addEventListener("storage", function (e) {
    if (e.key === "velvet_hair_bookings_v1") {
      renderTimeSlots();
    }
  });

  form.addEventListener("input", function () {
    if (successEl) {
      successEl.hidden = true;
      successEl.textContent = "";
    }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    renderTimeSlots();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var ymd = dateInput ? dateInput.value : "";
    var timeHm = timeInput ? timeInput.value.trim() : "";
    var working = ymd ? getWorkingIdsForDate(ymd) : [];
    var masterInput = form.querySelector('input[name="master"]:checked');
    var masterId = masterInput ? masterInput.value : "";

    if (!masterId || working.indexOf(masterId) === -1) {
      alert("Выберите мастера из числа работающих в выбранную дату.");
      return;
    }

    if (!timeHm) {
      alert("Укажите время визита.");
      return;
    }

    var effMin = getEffectiveMinVisitHm(ymd);
    if (effMin > WORK_CLOSE_HM) {
      alert("На выбранную дату нет доступных слотов в часы работы салона. Укажите другую дату.");
      return;
    }
    if (timeHm < effMin || timeHm > WORK_CLOSE_HM) {
      alert("Время визита должно быть с " + WORK_OPEN_HM + " до " + WORK_CLOSE_HM + " (шаг 30 минут).");
      return;
    }
    if (!isOnVisitSlotGrid(timeHm)) {
      alert("Выберите время с шагом 30 минут в рамках работы салона.");
      return;
    }

    if (isSlotBookedOrBlocked(ymd, timeHm)) {
      alert(
        "Это время уже занято или пересекается с другой записью (ближайшие 4 часа). Выберите другой слот."
      );
      renderTimeSlots();
      return;
    }

    var name = form.querySelector('input[name="name"]').value.trim();
    var phone = form.querySelector('input[name="phone"]').value.trim();
    var masterName = MASTERS[masterId] || masterId;

    if (!window.VelvetBookings) {
      alert("Не удалось сохранить заявку. Обновите страницу и попробуйте снова.");
      return;
    }

    var row;
    try {
      row = VelvetBookings.add({
        name: name,
        phone: phone,
        dateYmd: ymd,
        timeHm: timeHm,
        masterId: masterId,
        masterName: masterName,
      });
    } catch (err) {
      alert("Ошибка сохранения заявки. Проверьте настройки браузера (доступ к памяти сайта).");
      return;
    }

    if (row && window.VelvetClientStore) {
      try {
        VelvetClientStore.syncFromBooking(row);
      } catch (e) {
        /* профиль клиента необязателен для успеха заявки */
      }
    }

    if (successEl) {
      successEl.textContent = "";
      var info = document.createElement("p");
      info.className = "booking-form__success-text";
      info.textContent =
        "Заявка принята. Мы свяжемся с вами для подтверждения даты и времени.";
      successEl.appendChild(info);
      successEl.hidden = false;
    }

    form.reset();
    if (dateInput) {
      dateInput.min = todayLocalYmd();
    }
    updateMastersForDate();
    renderTimeSlots();
  });
})();
