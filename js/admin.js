(function () {
  /** Смените пароль перед публикацией сайта. Защита только на стороне браузера (для демо). */
  var ADMIN_PASSWORD = "velvet2026";
  var SESSION_KEY = "velvet_admin_session";

  var loginScreen = document.getElementById("login-screen");
  var dashboard = document.getElementById("dashboard");
  var loginForm = document.getElementById("login-form");
  var loginError = document.getElementById("login-error");
  var logoutBtn = document.getElementById("logout-btn");
  var tbody = document.getElementById("bookings-tbody");
  var emptyState = document.getElementById("empty-state");
  var exportBtn = document.getElementById("export-csv");
  var clearBtn = document.getElementById("clear-all");

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function setLoggedIn() {
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  function showDashboard() {
    if (loginScreen) loginScreen.hidden = true;
    if (dashboard) dashboard.hidden = false;
    renderBookings();
  }

  function showLogin() {
    if (loginScreen) loginScreen.hidden = false;
    if (dashboard) dashboard.hidden = true;
  }

  function formatRuDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return iso;
    }
  }

  function formatVisitDate(ymd) {
    if (!ymd) return "—";
    var p = ymd.split("-");
    if (p.length !== 3) return ymd;
    return p[2] + "." + p[1] + "." + p[0];
  }

  function formatVisitTime(timeHm) {
    if (!timeHm) return "—";
    return String(timeHm).trim();
  }

  function renderBookings() {
    if (!tbody || !window.VelvetBookings) return;
    var list = VelvetBookings.load();
    tbody.textContent = "";

    if (list.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    list.forEach(function (b) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHtml(formatRuDate(b.createdAt)) +
        "</td>" +
        "<td>" +
        escapeHtml(b.name) +
        "</td>" +
        "<td>" +
        escapeHtml(b.phone) +
        "</td>" +
        "<td>" +
        escapeHtml(formatVisitDate(b.dateYmd)) +
        "</td>" +
        "<td>" +
        escapeHtml(formatVisitTime(b.timeHm)) +
        "</td>" +
        "<td>" +
        escapeHtml(b.masterName || b.masterId) +
        "</td>" +
        '<td class="admin-col-actions"><button type="button" class="admin-btn admin-btn--danger admin-delete" data-id="' +
        escapeAttr(b.id) +
        '">Удалить</button></td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".admin-delete").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        if (id && confirm("Удалить эту заявку?")) {
          VelvetBookings.remove(id);
          renderBookings();
        }
      });
    });
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
  }

  function exportCsv() {
    if (!window.VelvetBookings) return;
    var list = VelvetBookings.load();
    var headers = ["Получено", "Имя", "Телефон", "Дата визита", "Время", "Мастер"];
    var rows = [headers.join(";")];
    list.forEach(function (b) {
      rows.push(
        [
          formatRuDate(b.createdAt),
          b.name,
          b.phone,
          formatVisitDate(b.dateYmd),
          formatVisitTime(b.timeHm),
          b.masterName || b.masterId,
        ]
          .map(function (cell) {
            return '"' + String(cell).replace(/"/g, '""') + '"';
          })
          .join(";")
      );
    });
    var blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "velvet-hair-zayavki-" + todayYmd() + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function todayYmd() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    if (m.length < 2) m = "0" + m;
    var day = String(d.getDate());
    if (day.length < 2) day = "0" + day;
    return y + "-" + m + "-" + day;
  }

  var passInput = document.getElementById("admin-password");
  var passToggle = document.getElementById("admin-password-toggle");
  if (passToggle && passInput) {
    passToggle.addEventListener("change", function () {
      passInput.type = passToggle.checked ? "text" : "password";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("admin-password");
      var pass = input ? input.value : "";
      if (pass === ADMIN_PASSWORD) {
        setLoggedIn();
        if (loginError) loginError.hidden = true;
        if (input) input.value = "";
        if (passToggle) passToggle.checked = false;
        if (input) input.type = "password";
        showDashboard();
      } else {
        if (loginError) loginError.hidden = false;
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      sessionStorage.removeItem(SESSION_KEY);
      showLogin();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportCsv);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (!window.VelvetBookings) return;
      if (
        confirm(
          "Удалить все заявки из хранилища браузера? Это действие нельзя отменить."
        )
      ) {
        VelvetBookings.clearAll();
        renderBookings();
      }
    });
  }

  if (isLoggedIn()) {
    showDashboard();
  } else {
    showLogin();
  }
})();
