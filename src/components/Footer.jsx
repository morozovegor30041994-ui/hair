import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <span className="logo logo--small">
            Velvet<span>Hair</span>
          </span>
          <p className="footer__copy">
            © 2026 Velvet Hair. Все права защищены.{" "}
            <Link to="/lk" className="footer__admin">
              ЛК
            </Link>
          </p>
        </div>
        <div className="footer__legal" id="requisites" aria-labelledby="footer-requisites-title">
          <p className="footer__legal-title" id="footer-requisites-title">
            Сведения об индивидуальном предпринимателе
          </p>
          <dl className="footer__requisites">
            <dt>ФИО</dt>
            <dd>Пупкин Иван Иванович</dd>
            <dt>ОГРНИП</dt>
            <dd>34245347438483</dd>
            <dt>ИНН</dt>
            <dd>5243245163</dd>
            <dt>Адрес регистрации</dt>
            <dd>г.&nbsp;Москва, ул.&nbsp;Пупкина, д.&nbsp;36</dd>
            <dt>Контактные данные</dt>
            <dd>
              <a href="tel:+79091233221">+7&nbsp;(909)&nbsp;123-32-21</a>
            </dd>
          </dl>
        </div>
      </div>
    </footer>
  );
}
