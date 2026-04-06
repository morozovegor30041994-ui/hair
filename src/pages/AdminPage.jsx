import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ADMIN_PASSWORD } from "../config";
import { useBookings } from "../hooks/useBookings";

const SESSION_KEY = "velvet_admin_session";

function formatRuDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatVisitDate(ymd) {
  if (!ymd) return "—";
  const p = ymd.split("-");
  if (p.length !== 3) return ymd;
  return p[2] + "." + p[1] + "." + p[0];
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  let m = String(d.getMonth() + 1);
  if (m.length < 2) m = "0" + m;
  let day = String(d.getDate());
  if (day.length < 2) day = "0" + day;
  return y + "-" + m + "-" + day;
}

export default function AdminPage() {
  const { list, remove, clearAll } = useBookings();
  const [loggedIn, setLoggedIn] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const sortedList = useMemo(() => list, [list]);

  function handleLogin(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setLoggedIn(true);
      setLoginError(false);
      setPassword("");
      setShowPass(false);
    } else {
      setLoginError(true);
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setLoggedIn(false);
  }

  function exportCsv() {
    const headers = ["Получено", "Имя", "Телефон", "Дата визита", "Время", "Мастер"];
    const rows = [headers.join(";")];
    list.forEach((b) => {
      rows.push(
        [formatRuDate(b.createdAt), b.name, b.phone, formatVisitDate(b.dateYmd), b.timeHm || "—", b.masterName || b.masterId]
          .map((cell) => '"' + String(cell).replace(/"/g, '""') + '"')
          .join(";")
      );
    });
    const blob = new Blob(["\uFEFF" + rows.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "velvet-hair-zayavki-" + todayYmd() + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleDelete(id) {
    if (confirm("Удалить эту заявку?")) remove(id);
  }

  function handleClearAll() {
    if (
      confirm(
        "Удалить все заявки из хранилища браузера? Это действие нельзя отменить."
      )
    ) {
      clearAll();
    }
  }

  if (!loggedIn) {
    return (
      <div id="login-screen" className="admin-login admin-body">
        <form id="login-form" noValidate onSubmit={handleLogin}>
          <p className="admin-login__brand">Velvet Hair</p>
          <h1 className="admin-login__title">Вход для администратора</h1>
          <label htmlFor="admin-password">Пароль</label>
          <input
            type={showPass ? "text" : "password"}
            id="admin-password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="admin-show-password">
            <input
              type="checkbox"
              checked={showPass}
              onChange={(e) => setShowPass(e.target.checked)}
              aria-controls="admin-password"
            />
            Показать пароль
          </label>
          <button type="submit">Войти</button>
          {loginError && <p className="admin-error">Неверный пароль</p>}
          <p className="admin-login__back">
            <Link to="/">← На сайт</Link> · <Link to="/lk">ЛК</Link>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div id="dashboard" className="admin-dashboard admin-body">
      <header className="header">
        <div className="container admin-dashboard__top">
          <h1>Заявки на консультацию</h1>
          <div className="admin-dashboard__actions">
            <button type="button" className="admin-btn" onClick={exportCsv}>
              Выгрузить CSV
            </button>
            <button type="button" className="admin-btn admin-btn--danger" onClick={handleClearAll}>
              Очистить все
            </button>
            <button type="button" className="admin-btn" onClick={logout}>
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="container">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Получено</th>
                <th scope="col">Имя</th>
                <th scope="col">Телефон</th>
                <th scope="col">Дата визита</th>
                <th scope="col">Время</th>
                <th scope="col">Мастер</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((b) => (
                <tr key={b.id}>
                  <td>{formatRuDate(b.createdAt)}</td>
                  <td>{b.name}</td>
                  <td>{b.phone}</td>
                  <td>{formatVisitDate(b.dateYmd)}</td>
                  <td>{b.timeHm || "—"}</td>
                  <td>{b.masterName || b.masterId}</td>
                  <td className="admin-col-actions">
                    <button type="button" className="admin-btn admin-btn--danger" onClick={() => handleDelete(b.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedList.length === 0 && (
          <p className="admin-empty">
            Пока нет заявок. Они появятся здесь после отправки формы на главной странице сайта.
          </p>
        )}
        <p className="admin-note">
          Заявки хранятся в браузере этого компьютера (localStorage). Чтобы видеть заявки от клиентов с других устройств, нужен сервер или облачная база. Пароль задайте в файле{" "}
          <code>src/config.js</code> (константа <code>ADMIN_PASSWORD</code>).
        </p>
      </main>
    </div>
  );
}
