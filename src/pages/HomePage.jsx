import Header from "../components/Header";
import Footer from "../components/Footer";
import BookingSection from "../components/BookingSection";
import { IconCapsules, IconTape, IconNano, IconCorrection } from "../components/ServiceIcons";
import { useSmoothScrollToHash } from "../hooks/useSmoothScrollToHash";
import { smoothScrollToId } from "../utils/smoothScroll";

export default function HomePage() {
  useSmoothScrollToHash();

  return (
    <>
      <Header />
      <main id="main-content">
        <section className="hero">
          <div className="container hero__grid">
            <div className="hero__content">
              <p className="hero__label">Салон наращивания волос</p>
              <h1 className="hero__title">
                Длина и объём,
                <br />
                о которых вы мечтали
              </h1>
              <p className="hero__text">
                Натуральные славянские и европейские волосы, бережные техники и индивидуальный подбор под ваш тип и образ жизни.
              </p>
              <div className="hero__actions">
                <a
                  href="#booking"
                  className="btn btn--primary"
                  onClick={(e) => {
                    e.preventDefault();
                    smoothScrollToId("booking");
                  }}
                >
                  Записаться
                </a>
                <a
                  href="#services"
                  className="btn btn--ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    smoothScrollToId("services");
                  }}
                >
                  Смотреть услуги
                </a>
              </div>
            </div>
            <div className="hero__visual">
              <figure className="hero__figure">
                <img
                  className="hero__img"
                  src="/images/53324355ada3366e4299cff7201c0705.jpg"
                  width="600"
                  height="750"
                  alt="Длинные ухоженные волосы после процедуры в салоне"
                  decoding="async"
                />
                <div className="hero__shine" aria-hidden="true"></div>
              </figure>
            </div>
          </div>
        </section>

        <section className="about" id="about">
          <div className="container about__grid">
            <figure className="about__figure">
              <img
                className="about__img"
                src="/images/6.jpg"
                width="500"
                height="625"
                alt="Мастер салона работает с волосами клиентки"
                loading="lazy"
                decoding="async"
              />
            </figure>
            <div className="about__aside">
              <div className="about__text">
                <h2 className="section-title">Почему Velvet Hair</h2>
                <p>
                  Мы специализируемся только на наращивании и коррекции — это наша ежедневная практика и страсть. Подбираем длину, цвет и плотность так, чтобы результат выглядел естественно и служил долго.
                </p>
                <ul className="about__list">
                  <li>Сертифицированные мастера с опытом от 5 лет</li>
                  <li>Стерильные инструменты и качественные материалы</li>
                  <li>Бесплатная консультация и пробная прядь</li>
                </ul>
              </div>
              <div className="about__stats">
                <div className="stat">
                  <span className="stat__num">8+</span>
                  <span className="stat__label">лет на рынке</span>
                </div>
                <div className="stat">
                  <span className="stat__num">2000+</span>
                  <span className="stat__label">довольных клиентов</span>
                </div>
                <div className="stat">
                  <span className="stat__num">100%</span>
                  <span className="stat__label">натуральный волос</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="gallery" id="gallery" aria-labelledby="gallery-title">
          <div className="container">
            <h2 className="section-title section-title--center" id="gallery-title">
              Галерея
            </h2>
            <p className="section-lead">Вдохновляющие образы: длина, цвет и естественное падение волос.</p>
            <div className="gallery__grid">
              <figure className="gallery__item gallery__item--tall">
                <img
                  className="gallery__img"
                  src="/images/3.jpg"
                  width={540}
                  height={720}
                  sizes="(max-width: 900px) min(100vw - 3rem, 520px), min(560px, 52vw)"
                  alt="Работа салона — фото 3"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <figure className="gallery__item">
                <img
                  className="gallery__img"
                  src="/images/4.jpg"
                  width={640}
                  height={400}
                  sizes="(max-width: 900px) min(100vw - 3rem, 520px), min(480px, 40vw)"
                  alt="Работа салона — фото 4"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <figure className="gallery__item">
                <img
                  className="gallery__img"
                  src="/images/5.jpg"
                  width={640}
                  height={400}
                  sizes="(max-width: 900px) min(100vw - 3rem, 520px), min(480px, 40vw)"
                  alt="Работа салона — фото 5"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>
            <p className="gallery__credit">Фотографии салона Velvet Hair.</p>
          </div>
        </section>

        <section className="services" id="services">
          <div className="container">
            <h2 className="section-title section-title--center">Услуги и цены</h2>
            <p className="section-lead">Прозрачные условия — вы заранее знаете объём работы и стоимость.</p>
            <div className="services__grid">
              <article className="service-card">
                <div className="service-card__icon" aria-hidden="true">
                  <IconCapsules />
                </div>
                <h3>Капсулы / микрокапсулы</h3>
                <p>Классика наращивания: прочное крепление, удобная носка до 4–5 месяцев.</p>
                <span className="service-card__price">от 8 500 ₽</span>
              </article>
              <article className="service-card">
                <div className="service-card__icon" aria-hidden="true">
                  <IconTape />
                </div>
                <h3>Ленточное наращивание</h3>
                <p>Быстрая установка и снятие, идеально для первого опыта и частой смены образа.</p>
                <span className="service-card__price">от 6 900 ₽</span>
              </article>
              <article className="service-card">
                <div className="service-card__icon" aria-hidden="true">
                  <IconNano />
                </div>
                <h3>Микрокапсулы «Nano»</h3>
                <p>Почти незаметные крепления — максимально естественный вид у корней.</p>
                <span className="service-card__price">от 12 000 ₽</span>
              </article>
              <article className="service-card">
                <div className="service-card__icon" aria-hidden="true">
                  <IconCorrection />
                </div>
                <h3>Коррекция</h3>
                <p>Перекапсуляция, перемещение прядей, уход за своими волосами.</p>
                <span className="service-card__price">от 4 200 ₽</span>
              </article>
            </div>
          </div>
        </section>

        <BookingSection />

        <section className="cta contacts-section" id="contact" aria-labelledby="contacts-title">
          <div className="container contacts-section__inner">
            <h2 className="section-title section-title--center" id="contacts-title">
              Контакты
            </h2>
            <p className="section-lead">Телефон, мессенджер и адрес салона.</p>
            <div className="contacts-section__grid">
              <a href="tel:+79011234567" className="contact-line">
                <span className="contact-line__label">Телефон</span>
                <span className="contact-line__value">+7 (901) 123-45-67</span>
              </a>
              <a href="https://max.ru/" className="contact-line" target="_blank" rel="noopener noreferrer">
                <span className="contact-line__label">Max</span>
                <span className="contact-line__value">Написать в мессенджере Max</span>
              </a>
              <p className="cta__address">
                <span className="contact-line__label">Адрес</span>
                <span className="contact-line__value">
                  г. Москва, ул. Авиаконструктора Миля, 8 к1
                  <br />
                  ежедневно 10:00 — 21:00
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
