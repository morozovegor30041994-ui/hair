import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { SMS_SEND_ENDPOINT } from "../config";
import * as clientStore from "../lib/clientStore";

const SESSION_KEY = "velvet_client_phone_key";
const OTP_PENDING_KEY = "velvet_cabinet_otp_pending";
const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function maskPhoneForSms(phoneKey) {
  if (!phoneKey || phoneKey.length !== 11) return "—";
  return "+7 (***) ***-" + phoneKey.slice(7, 9) + "-" + phoneKey.slice(9, 11);
}

function generateOtpCode() {
  const buf = new Uint32Array(1);
  if (window.crypto && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    buf[0] = Math.floor(Math.random() * 4294967295);
  }
  return String(100000 + (buf[0] % 900000));
}

function loadPendingOtp() {
  try {
    const raw = sessionStorage.getItem(OTP_PENDING_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o.phoneKey || !o.code || !o.expiresAt) return null;
    return o;
  } catch {
    return null;
  }
}

function savePendingOtp(phoneKey, code) {
  sessionStorage.setItem(
    OTP_PENDING_KEY,
    JSON.stringify({
      phoneKey,
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
    })
  );
}

function clearPendingOtp() {
  sessionStorage.removeItem(OTP_PENDING_KEY);
}

function formatVisit(ymd) {
  if (!ymd) return "—";
  const p = ymd.split("-");
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
  } catch {
    return "";
  }
}

export default function CabinetPage() {
  const [sessionPhone, setSessionPhone] = useState(() => {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s && /^7\d{10}$/.test(s) ? s : null;
  });
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendUntil, setResendUntil] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (Date.now() >= resendUntil) return;
    const t = setInterval(() => setTick((x) => x + 1), 400);
    return () => clearInterval(t);
  }, [resendUntil]);

  const resendLeft = Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000));

  const sendSmsViaBackend = useCallback((phoneKey, code) => {
    if (!SMS_SEND_ENDPOINT) return Promise.resolve({ ok: false, skipped: true });
    return fetch(SMS_SEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneKey, code }),
    })
      .then((r) => ({ ok: r.ok, skipped: false }))
      .catch(() => ({ ok: false, skipped: false }));
  }, []);

  const issueOtp = useCallback(
    (phoneKey) => {
      const code = generateOtpCode();
      savePendingOtp(phoneKey, code);
      setOtpStep(true);
      setCodeInput("");
      setOtpError("");
      setLoginError("");
      setResendUntil(Date.now() + RESEND_COOLDOWN_MS);

      sendSmsViaBackend(phoneKey, code).then((result) => {
        if (result.skipped) {
          setDemoCode(code);
        } else if (result.ok) {
          setDemoCode("");
        } else {
          setDemoCode(code);
          setOtpError(
            "Сервер не отправил СМС. Код показан ниже — проверьте SMS_SEND_ENDPOINT в src/config.js."
          );
        }
      });
    },
    [sendSmsViaBackend]
  );

  useEffect(() => {
    if (sessionPhone) return;
    const pending = loadPendingOtp();
    if (!pending || Date.now() > pending.expiresAt) {
      if (pending) clearPendingOtp();
      return;
    }
    setPhoneInput(clientStore.formatPhoneDisplay(pending.phoneKey));
    setOtpStep(true);
    if (!SMS_SEND_ENDPOINT) setDemoCode(pending.code);
    setResendUntil(Date.now());
  }, [sessionPhone]);

  function requestSendCode() {
    setLoginError("");
    setOtpError("");
    const key = clientStore.normalizePhone(phoneInput);
    if (!key) {
      setLoginError("Введите корректный номер телефона (10 или 11 цифр).");
      return;
    }
    issueOtp(key);
  }

  function verifyOtp() {
    setOtpError("");
    const key = clientStore.normalizePhone(phoneInput);
    const raw = codeInput.replace(/\D/g, "");
    const pending = loadPendingOtp();

    if (!pending) {
      setOtpError("Код устарел или не запрашивался. Запросите код снова.");
      setOtpStep(false);
      resetOtpUi();
      return;
    }
    if (Date.now() > pending.expiresAt) {
      clearPendingOtp();
      setOtpError("Срок действия кода истёк. Запросите новый.");
      setDemoCode("");
      return;
    }
    if (key !== pending.phoneKey) {
      setOtpError("Номер не совпадает с тем, на который запрошен код.");
      return;
    }
    if (raw !== pending.code) {
      setOtpError("Неверный код. Проверьте СМС и введите снова.");
      return;
    }

    clearPendingOtp();
    setDemoCode("");
    sessionStorage.setItem(SESSION_KEY, key);
    setSessionPhone(key);
    setOtpStep(false);
  }

  function resetOtpUi() {
    clearPendingOtp();
    setDemoCode("");
    setOtpStep(false);
    setCodeInput("");
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setSessionPhone(null);
    resetOtpUi();
    setPhoneInput("");
  }

  function backToPhone() {
    resetOtpUi();
    setLoginError("");
  }

  const phoneKeyForMask = useMemo(() => {
    const k = clientStore.normalizePhone(phoneInput);
    if (k) return k;
    const o = loadPendingOtp();
    return o ? o.phoneKey : "";
  }, [phoneInput, otpStep]);

  if (sessionPhone) {
    return (
      <CabinetDashboard phoneKey={sessionPhone} onLogout={logout} />
    );
  }

  return (
    <div id="cabinet-auth" className="cabinet-auth cabinet-body">
      <p className="cabinet-auth__brand">Velvet Hair</p>
      <h1 className="cabinet-auth__title">Личный кабинет</h1>
      <p className="cabinet-auth__lead">
        Введите номер телефона, который указывали при записи. Мы отправим код в СМС — после ввода кода откроется кабинет.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {!otpStep ? (
          <div id="cabinet-step-phone">
            <label htmlFor="cabinet-phone">Телефон</label>
            <input
              type="tel"
              id="cabinet-phone"
              name="phone"
              autoComplete="tel"
              placeholder="+7 (901) 123-45-67"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  requestSendCode();
                }
              }}
            />
            {loginError && <p className="cabinet-auth__error">{loginError}</p>}
            <button type="button" className="cabinet-auth__submit" id="cabinet-send-code" onClick={requestSendCode}>
              Получить код
            </button>
          </div>
        ) : (
          <div id="cabinet-step-otp" className="cabinet-step-otp">
            <p className="cabinet-auth__otp-lead" id="cabinet-otp-lead">
              Код отправлен на номер{" "}
              <strong>{maskPhoneForSms(phoneKeyForMask)}</strong>
            </p>
            <label htmlFor="cabinet-code">Код из СМС</label>
            <input
              type="text"
              id="cabinet-code"
              name="code"
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              placeholder="000000"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  verifyOtp();
                }
              }}
            />
            {otpError && <p className="cabinet-auth__error">{otpError}</p>}
            <button type="button" className="cabinet-auth__submit" id="cabinet-verify-btn" onClick={verifyOtp}>
              Войти
            </button>
            <div className="cabinet-auth__otp-actions">
              <button
                type="button"
                className="cabinet-auth__secondary"
                id="cabinet-resend"
                disabled={resendLeft > 0}
                onClick={() => {
                  if (resendLeft > 0) return;
                  requestSendCode();
                }}
              >
                {resendLeft > 0 ? `Отправить код повторно (${resendLeft} с)` : "Отправить код повторно"}
              </button>
              <button type="button" className="cabinet-auth__text-btn" id="cabinet-back-phone" onClick={backToPhone}>
                Изменить номер
              </button>
            </div>
          </div>
        )}
        {demoCode && (
          <div className="cabinet-auth__demo" id="cabinet-otp-demo">
            <p className="cabinet-auth__demo-title">Демо-режим</p>
            <p className="cabinet-auth__demo-text">Без сервера СМС не отправляются. Код для входа:</p>
            <p className="cabinet-auth__demo-code" id="cabinet-demo-code" aria-live="polite">
              {demoCode}
            </p>
          </div>
        )}
      </form>
      <p className="cabinet-auth__links">
        <Link to="/">← На главную</Link> · <Link to="/lk">ЛК</Link>
      </p>
    </div>
  );
}

function CabinetDashboard({ phoneKey, onLogout }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const p = clientStore.getProfile(phoneKey);
    clientStore.migratePastDue(p);
    clientStore.saveProfile(phoneKey, p);
    setProfile(p);
  }, [phoneKey]);

  useEffect(() => {
    const fn = () => setProfile(clientStore.getProfile(phoneKey));
    window.addEventListener("velvet-client-changed", fn);
    return () => window.removeEventListener("velvet-client-changed", fn);
  }, [phoneKey]);

  if (!profile) {
    return (
      <div className="cabinet-body" style={{ padding: "3rem", textAlign: "center" }}>
        Загрузка…
      </div>
    );
  }

  const p = profile;

  const sorted = [...(p.upcoming || [])].sort((a, b) => {
    const c = (a.dateYmd || "").localeCompare(b.dateYmd || "");
    if (c !== 0) return c;
    return (a.timeHm || "").localeCompare(b.timeHm || "");
  });

  const pastSorted = [...(p.past || [])].sort((a, b) => {
    const c = (b.dateYmd || "").localeCompare(a.dateYmd || "");
    if (c !== 0) return c;
    return (b.timeHm || "").localeCompare(a.timeHm || "");
  });

  return (
    <div id="cabinet-dash" className="cabinet-dash cabinet-body">
      <header className="header">
        <div className="container cabinet-dash__top">
          <div>
            <h1 id="cabinet-user-name">{p.name ? p.name : "Клиент"}</h1>
            <p className="cabinet-dash__meta" id="cabinet-user-phone">
              {clientStore.formatPhoneDisplay(phoneKey)}
            </p>
          </div>
          <div className="cabinet-dash__actions">
            <Link to="/" className="admin-btn">
              На сайт
            </Link>
            <button type="button" className="admin-btn" id="cabinet-logout" onClick={onLogout}>
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="container">
        <section className="cabinet-section" aria-labelledby="upcoming-title">
          <h2 className="cabinet-section__title" id="upcoming-title">
            Предстоящая запись
          </h2>
          <div className="cabinet-cards" id="cabinet-upcoming">
            {sorted.length === 0 ? (
              <p className="cabinet-empty">Нет активных записей. Оформите запись на главной странице сайта.</p>
            ) : (
              sorted.map((u) => (
                <div key={u.id} className="cabinet-card">
                  <div className="cabinet-card__row">
                    <span className="cabinet-card__label">Дата визита</span>
                    <strong>{formatVisit(u.dateYmd)}</strong>
                  </div>
                  <div className="cabinet-card__row">
                    <span className="cabinet-card__label">Время</span>
                    <strong>{formatTimeLabel(u.timeHm)}</strong>
                  </div>
                  <div className="cabinet-card__row">
                    <span className="cabinet-card__label">Мастер</span>
                    {u.masterName || "—"}
                  </div>
                  <div className="cabinet-card__row">
                    <span className="cabinet-card__label">Заявка от</span>
                    {formatCreated(u.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="cabinet-section" aria-labelledby="past-title">
          <h2 className="cabinet-section__title" id="past-title">
            Прошедшие процедуры
          </h2>
          <div className="cabinet-cards" id="cabinet-past">
            {pastSorted.length === 0 ? (
              <p className="cabinet-empty">История появится после прошедших дат записей.</p>
            ) : (
              pastSorted.map((x) => (
                <div key={x.id} className="cabinet-card cabinet-card--past">
                  <div className="cabinet-card__row">
                    <span className="cabinet-card__label">Дата</span>
                    <strong>{formatVisit(x.dateYmd)}</strong>
                  </div>
                  {x.timeHm ? (
                    <div className="cabinet-card__row">
                      <span className="cabinet-card__label">Время</span>
                      <strong>{formatTimeLabel(x.timeHm)}</strong>
                    </div>
                  ) : null}
                  <div className="cabinet-card__row">
                    <span className="cabinet-card__label">Мастер</span>
                    {x.masterName || "—"}
                  </div>
                  <div className="cabinet-card__row">
                    <span className="cabinet-card__label">Процедура</span>
                    {x.title || "Визит"}
                  </div>
                  {x.note ? <div className="cabinet-card__row">{x.note}</div> : null}
                </div>
              ))
            )}
          </div>
        </section>
        <p className="cabinet-note">
          Данные хранятся в браузере этого устройства. После даты визита запись переносится в историю автоматически. Для полного учёта на всех устройствах нужен сервер или приложение салона. Вход в кабинет защищён кодом из СМС; без сервера отправки СМС код в демо-режиме показывается на экране входа.
        </p>
      </main>
    </div>
  );
}
