(function () {
  var SESSION_KEY = "velvet_client_phone_key";
  var OTP_PENDING_KEY = "velvet_cabinet_otp_pending";

  /** Срок действия кода (мс). */
  var OTP_TTL_MS = 5 * 60 * 1000;
  /** Пауза перед повторной отправкой (мс). */
  var RESEND_COOLDOWN_MS = 60 * 1000;

  /**
   * Если задан URL бэкенда, после генерации кода выполняется POST с телом
   * { "phone": "7XXXXXXXXXX", "code": "123456" } — сервер отправляет SMS.
   * Пустая строка = демо: код показывается на странице.
   */
  var SMS_SEND_ENDPOINT = "";

  var authScreen = document.getElementById("cabinet-auth");
  var dashScreen = document.getElementById("cabinet-dash");
  var loginForm = document.getElementById("cabinet-login-form");
  var stepPhone = document.getElementById("cabinet-step-phone");
  var stepOtp = document.getElementById("cabinet-step-otp");
  var phoneInput = document.getElementById("cabinet-phone");
  var codeInput = document.getElementById("cabinet-code");
  var loginError = document.getElementById("cabinet-login-error");
  var otpError = document.getElementById("cabinet-otp-error");
  var sendCodeBtn = document.getElementById("cabinet-send-code");
  var verifyBtn = document.getElementById("cabinet-verify-btn");
  var resendBtn = document.getElementById("cabinet-resend");
  var backPhoneBtn = document.getElementById("cabinet-back-phone");
  var phoneMaskEl = document.getElementById("cabinet-phone-mask");
  var otpDemo = document.getElementById("cabinet-otp-demo");
  var demoCodeEl = document.getElementById("cabinet-demo-code");

  var logoutBtn = document.getElementById("cabinet-logout");
  var dashTitle = document.getElementById("cabinet-user-name");
  var dashPhone = document.getElementById("cabinet-user-phone");
  var upcomingEl = document.getElementById("cabinet-upcoming");
  var pastEl = document.getElementById("cabinet-past");

  var resendCooldownUntil = 0;
  var resendTimerId = null;

  function formatVisit(ymd) {
    if (!ymd) return "—";
    var p = ymd.split("-");
    if (p.length !== 3) return ymd;
    return p[2] + "." + p[1] + "." + p[0];
  }

  function formatTimeLabel(timeHm) {
    if (!timeHm) return "—";
    return String(timeHm).trim();
  }

  function formatCreated(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }

  function generateOtpCode() {
    var buf = new Uint32Array(1);
    if (window.crypto && crypto.getRandomValues) {
      crypto.getRandomValues(buf);
    } else {
      buf[0] = Math.floor(Math.random() * 4294967295);
    }
    return String(100000 + (buf[0] % 900000));
  }

  function savePendingOtp(phoneKey, code) {
    sessionStorage.setItem(
      OTP_PENDING_KEY,
      JSON.stringify({
        phoneKey: phoneKey,
        code: code,
        expiresAt: Date.now() + OTP_TTL_MS,
      })
    );
  }

  function loadPendingOtp() {
    try {
      var raw = sessionStorage.getItem(OTP_PENDING_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o.phoneKey || !o.code || !o.expiresAt) return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function clearPendingOtp() {
    sessionStorage.removeItem(OTP_PENDING_KEY);
  }

  function maskPhoneForSms(phoneKey) {
    if (!phoneKey || phoneKey.length !== 11) return "—";
    return "+7 (***) ***-" + phoneKey.slice(7, 9) + "-" + phoneKey.slice(9, 11);
  }

  function updateResendButton() {
    if (!resendBtn) return;
    var left = Math.ceil((resendCooldownUntil - Date.now()) / 1000);
    if (left <= 0) {
      resendBtn.disabled = false;
      resendBtn.textContent = "Отправить код повторно";
    } else {
      resendBtn.disabled = true;
      resendBtn.textContent = "Отправить код повторно (" + left + " с)";
    }
  }

  function startResendCooldown() {
    resendCooldownUntil = Date.now() + RESEND_COOLDOWN_MS;
    updateResendButton();
    if (resendTimerId) clearInterval(resendTimerId);
    resendTimerId = setInterval(function () {
      if (Date.now() >= resendCooldownUntil) {
        clearInterval(resendTimerId);
        resendTimerId = null;
      }
      updateResendButton();
    }, 400);
  }

  function showDemoCode(code) {
    if (otpDemo) otpDemo.hidden = false;
    if (demoCodeEl) demoCodeEl.textContent = code;
  }

  function hideDemoCode() {
    if (otpDemo) otpDemo.hidden = true;
    if (demoCodeEl) demoCodeEl.textContent = "";
  }

  function sendSmsViaBackend(phoneKey, code) {
    if (!SMS_SEND_ENDPOINT) return Promise.resolve({ ok: false, skipped: true });
    return fetch(SMS_SEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneKey, code: code }),
    })
      .then(function (r) {
        return { ok: r.ok, skipped: false };
      })
      .catch(function () {
        return { ok: false, skipped: false };
      });
  }

  function showOtpStep(phoneKey) {
    if (stepPhone) stepPhone.hidden = true;
    if (stepOtp) stepOtp.hidden = false;
    if (phoneMaskEl) phoneMaskEl.textContent = maskPhoneForSms(phoneKey);
    if (codeInput) {
      codeInput.value = "";
      codeInput.focus();
    }
    if (otpError) otpError.hidden = true;
    startResendCooldown();
  }

  function showPhoneStep() {
    if (stepPhone) stepPhone.hidden = false;
    if (stepOtp) stepOtp.hidden = true;
    hideDemoCode();
    clearPendingOtp();
    if (codeInput) codeInput.value = "";
    if (otpError) otpError.hidden = true;
    if (resendTimerId) {
      clearInterval(resendTimerId);
      resendTimerId = null;
    }
    resendCooldownUntil = 0;
    updateResendButton();
  }

  function issueOtp(phoneKey) {
    var code = generateOtpCode();
    savePendingOtp(phoneKey, code);
    showOtpStep(phoneKey);

    sendSmsViaBackend(phoneKey, code).then(function (result) {
      if (result.skipped) {
        showDemoCode(code);
      } else if (result.ok) {
        hideDemoCode();
      } else {
        showDemoCode(code);
        if (otpError) {
          otpError.textContent =
            "Сервер не отправил СМС. Код показан ниже — проверьте SMS_SEND_ENDPOINT в js/cabinet.js.";
          otpError.hidden = false;
        }
      }
    });
  }

  function requestSendCode() {
    if (loginError) loginError.hidden = true;
    if (otpError) otpError.hidden = true;
    if (!window.VelvetClientStore) {
      if (loginError) {
        loginError.textContent = "Ошибка загрузки модуля. Обновите страницу.";
        loginError.hidden = false;
      }
      return;
    }
    var key = VelvetClientStore.normalizePhone(phoneInput ? phoneInput.value : "");
    if (!key) {
      if (loginError) {
        loginError.textContent = "Введите корректный номер телефона (10 или 11 цифр).";
        loginError.hidden = false;
      }
      return;
    }
    issueOtp(key);
  }

  function verifyOtp() {
    if (otpError) otpError.hidden = true;
    if (!window.VelvetClientStore) {
      if (otpError) {
        otpError.textContent = "Ошибка загрузки модуля.";
        otpError.hidden = false;
      }
      return;
    }
    var key = VelvetClientStore.normalizePhone(phoneInput ? phoneInput.value : "");
    var raw = codeInput ? codeInput.value.replace(/\D/g, "") : "";
    var pending = loadPendingOtp();

    if (!pending) {
      if (otpError) {
        otpError.textContent = "Код устарел или не запрашивался. Запросите код снова.";
        otpError.hidden = false;
      }
      showPhoneStep();
      return;
    }

    if (Date.now() > pending.expiresAt) {
      clearPendingOtp();
      if (otpError) {
        otpError.textContent = "Срок действия кода истёк. Запросите новый.";
        otpError.hidden = false;
      }
      hideDemoCode();
      return;
    }

    if (key !== pending.phoneKey) {
      if (otpError) {
        otpError.textContent = "Номер не совпадает с тем, на который запрошен код.";
        otpError.hidden = false;
      }
      return;
    }

    if (raw !== pending.code) {
      if (otpError) {
        otpError.textContent = "Неверный код. Проверьте СМС и введите снова.";
        otpError.hidden = false;
      }
      return;
    }

    clearPendingOtp();
    hideDemoCode();
    if (loginError) loginError.hidden = true;
    showDash(key);
  }

  function renderProfile(phoneKey) {
    if (!window.VelvetClientStore) return;
    var p = VelvetClientStore.getProfile(phoneKey);
    VelvetClientStore.migratePastDue(p);
    VelvetClientStore.saveProfile(phoneKey, p);

    if (dashTitle) {
      dashTitle.textContent = p.name ? p.name : "Клиент";
    }
    if (dashPhone) {
      dashPhone.textContent = VelvetClientStore.formatPhoneDisplay(phoneKey);
    }

    if (upcomingEl) {
      upcomingEl.textContent = "";
      if (!p.upcoming || p.upcoming.length === 0) {
        upcomingEl.innerHTML =
          '<p class="cabinet-empty">Нет активных записей. Оформите запись на главной странице сайта.</p>';
      } else {
        var sorted = p.upcoming.slice().sort(function (a, b) {
          var c = (a.dateYmd || "").localeCompare(b.dateYmd || "");
          if (c !== 0) return c;
          return (a.timeHm || "").localeCompare(b.timeHm || "");
        });
        sorted.forEach(function (u) {
          var div = document.createElement("div");
          div.className = "cabinet-card";
          div.innerHTML =
            '<div class="cabinet-card__row"><span class="cabinet-card__label">Дата визита</span><strong>' +
            formatVisit(u.dateYmd) +
            "</strong></div>" +
            '<div class="cabinet-card__row"><span class="cabinet-card__label">Время</span><strong>' +
            escapeHtml(formatTimeLabel(u.timeHm)) +
            "</strong></div>" +
            '<div class="cabinet-card__row"><span class="cabinet-card__label">Мастер</span>' +
            escapeHtml(u.masterName || "—") +
            "</div>" +
            '<div class="cabinet-card__row"><span class="cabinet-card__label">Заявка от</span>' +
            escapeHtml(formatCreated(u.createdAt)) +
            "</div>";
          upcomingEl.appendChild(div);
        });
      }
    }

    if (pastEl) {
      pastEl.textContent = "";
      if (!p.past || p.past.length === 0) {
        pastEl.innerHTML =
          '<p class="cabinet-empty">История появится после прошедших дат записей.</p>';
      } else {
        var pastSorted = p.past.slice().sort(function (a, b) {
          var c = (b.dateYmd || "").localeCompare(a.dateYmd || "");
          if (c !== 0) return c;
          return (b.timeHm || "").localeCompare(a.timeHm || "");
        });
        pastSorted.forEach(function (x) {
          var div = document.createElement("div");
          div.className = "cabinet-card cabinet-card--past";
          div.innerHTML =
            '<div class="cabinet-card__row"><span class="cabinet-card__label">Дата</span><strong>' +
            formatVisit(x.dateYmd) +
            "</strong></div>" +
            (x.timeHm
              ? '<div class="cabinet-card__row"><span class="cabinet-card__label">Время</span><strong>' +
                escapeHtml(formatTimeLabel(x.timeHm)) +
                "</strong></div>"
              : "") +
            '<div class="cabinet-card__row"><span class="cabinet-card__label">Мастер</span>' +
            escapeHtml(x.masterName || "—") +
            "</div>" +
            '<div class="cabinet-card__row"><span class="cabinet-card__label">Процедура</span>' +
            escapeHtml(x.title || "Визит") +
            "</div>" +
            (x.note
              ? '<div class="cabinet-card__row">' + escapeHtml(x.note) + "</div>"
              : "");
          pastEl.appendChild(div);
        });
      }
    }
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function showAuth() {
    sessionStorage.removeItem(SESSION_KEY);
    clearPendingOtp();
    hideDemoCode();
    if (authScreen) authScreen.hidden = false;
    if (dashScreen) dashScreen.hidden = true;
    showPhoneStep();
    if (phoneInput) phoneInput.value = "";
    if (loginError) loginError.hidden = true;
  }

  function showDash(phoneKey) {
    sessionStorage.setItem(SESSION_KEY, phoneKey);
    if (authScreen) authScreen.hidden = true;
    if (dashScreen) dashScreen.hidden = false;
    renderProfile(phoneKey);
  }

  function tryRestoreOtpStep() {
    var pending = loadPendingOtp();
    if (!pending || Date.now() > pending.expiresAt) {
      if (pending) clearPendingOtp();
      return;
    }
    if (phoneInput && window.VelvetClientStore) {
      phoneInput.value = VelvetClientStore.formatPhoneDisplay(pending.phoneKey);
    }
    showOtpStep(pending.phoneKey);
    if (!SMS_SEND_ENDPOINT) {
      showDemoCode(pending.code);
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }

  if (sendCodeBtn) {
    sendCodeBtn.addEventListener("click", requestSendCode);
  }

  if (verifyBtn) {
    verifyBtn.addEventListener("click", verifyOtp);
  }

  if (resendBtn) {
    resendBtn.addEventListener("click", function () {
      if (resendBtn.disabled) return;
      requestSendCode();
    });
  }

  if (backPhoneBtn) {
    backPhoneBtn.addEventListener("click", function () {
      showPhoneStep();
      if (loginError) loginError.hidden = true;
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        requestSendCode();
      }
    });
  }

  if (codeInput) {
    codeInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        verifyOtp();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", showAuth);
  }

  var saved = sessionStorage.getItem(SESSION_KEY);
  if (saved && /^7\d{10}$/.test(saved) && window.VelvetClientStore) {
    showDash(saved);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    tryRestoreOtpStep();
  }
})();
