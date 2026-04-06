import { Link } from "react-router-dom";

/** Единая точка входа: клиент или администратор. */
export default function LkPage() {
  return (
    <div className="cabinet-auth cabinet-body" style={{ marginTop: "clamp(2.5rem, 10vh, 5rem)" }}>
      <p className="cabinet-auth__brand">Velvet Hair</p>
      <h1 className="cabinet-auth__title">ЛК</h1>
      <p className="cabinet-auth__lead">Выберите, как вы хотите войти.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Link to="/cabinet" className="cabinet-auth__submit" style={{ textAlign: "center", textDecoration: "none" }}>
          Вход для клиентов
        </Link>
        <Link
          to="/admin"
          className="cabinet-auth__secondary"
          style={{ textAlign: "center", textDecoration: "none", display: "block" }}
        >
          Вход для администратора
        </Link>
      </div>
      <p className="cabinet-auth__links" style={{ marginTop: "1.25rem" }}>
        <Link to="/">← На главную</Link>
      </p>
    </div>
  );
}
