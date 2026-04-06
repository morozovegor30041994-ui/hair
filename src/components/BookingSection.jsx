import { useState, useMemo, useEffect } from "react";
import { useBookings } from "../hooks/useBookings";
import * as clientStore from "../lib/clientStore";
import BookingDatePicker from "./BookingDatePicker";
import {
  MASTERS,
  todayLocalYmd,
  getWorkingIdsForDate,
  getShiftLabelForDate,
  getEffectiveMinVisitHm,
  isOnVisitSlotGrid,
  allSlotsHm,
  formatSlotLabelHm,
  isSlotDisabledForPicker,
  isSlotBookedOrBlocked,
} from "../lib/schedule";

const MASTER_ORDER = [
  { id: "olga", top: true },
  { id: "kristina", top: true },
  { id: "alina", top: false },
  { id: "anna", top: false },
];

export default function BookingSection() {
  const { list: bookings, add } = useBookings();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateYmd, setDateYmd] = useState("");
  const [timeHm, setTimeHm] = useState("");
  const [masterId, setMasterId] = useState("");
  const [success, setSuccess] = useState(false);

  const minDate = todayLocalYmd();

  useEffect(() => {
    setTimeHm("");
    setMasterId("");
  }, [dateYmd]);

  const workingIds = dateYmd ? getWorkingIdsForDate(dateYmd) : [];

  const effMinForTitle = dateYmd ? getEffectiveMinVisitHm(dateYmd) : "10:00";

  const slotsUi = useMemo(() => {
    if (!dateYmd) {
      return {
        hint: "Сначала выберите дату — появятся доступные слоты.",
        slots: [],
        hasFree: false,
        showGrid: false,
      };
    }
    const eff = getEffectiveMinVisitHm(dateYmd);
    if (eff > "21:00") {
      return {
        hint: "На сегодня свободных слотов нет. Выберите другую дату.",
        slots: [],
        hasFree: false,
        showGrid: false,
      };
    }
    const slots = allSlotsHm();
    let hasFree = false;
    const buttons = slots.map((slotHm) => {
      const disabled = isSlotDisabledForPicker(dateYmd, slotHm, eff, bookings);
      if (!disabled) hasFree = true;
      return { slotHm, disabled };
    });
    const hint = !hasFree
      ? "На эту дату нет свободных слотов. Выберите другую дату или время."
      : "";
    return { hint, slots: buttons, hasFree, showGrid: true };
  }, [dateYmd, bookings]);

  function handleSubmit(e) {
    e.preventDefault();
    setSuccess(false);

    if (!dateYmd) {
      alert("Выберите дату.");
      return;
    }
    const working = getWorkingIdsForDate(dateYmd);
    if (!masterId || working.indexOf(masterId) === -1) {
      alert("Выберите мастера из числа работающих в выбранную дату.");
      return;
    }
    if (!timeHm) {
      alert("Выберите время визита.");
      return;
    }
    const eff = getEffectiveMinVisitHm(dateYmd);
    if (eff > "21:00") {
      alert("На выбранную дату нет доступных слотов. Укажите другую дату.");
      return;
    }
    if (timeHm < eff || timeHm > "21:00") {
      alert("Время визита должно быть с 10:00 до 21:00 (шаг 30 минут).");
      return;
    }
    if (!isOnVisitSlotGrid(timeHm)) {
      alert("Выберите время с шагом 30 минут.");
      return;
    }
    if (isSlotBookedOrBlocked(dateYmd, timeHm, bookings)) {
      alert(
        "Это время уже занято или пересекается с другой записью (ближайшие 4 часа). Выберите другой слот."
      );
      return;
    }

    const masterName = MASTERS[masterId] || masterId;
    let row;
    try {
      row = add({
        name,
        phone,
        dateYmd,
        timeHm,
        masterId,
        masterName,
      });
    } catch {
      alert("Ошибка сохранения заявки.");
      return;
    }

    try {
      if (row) clientStore.syncFromBooking(row);
    } catch {
      /* optional */
    }

    setSuccess(true);
    setName("");
    setPhone("");
    setDateYmd("");
    setTimeHm("");
    setMasterId("");
  }

  const masterHint = !dateYmd
    ? "Сначала выберите дату — покажем, кто в смене."
    : `В эту дату в смене: ${getShiftLabelForDate(dateYmd)}. Выберите мастера.`;

  return (
    <section className="booking-section" id="booking" aria-labelledby="booking-title">
      <div className="container booking-section__inner">
        <h2 className="section-title section-title--center" id="booking-title">
          Запись на консультацию
        </h2>

        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          <div className="booking-form__fields">
            <label className="form-field">
              <span className="form-field__label">Имя</span>
              <input
                type="text"
                name="name"
                className="form-field__input"
                placeholder="Как к вам обращаться"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => {
                  setSuccess(false);
                  setName(e.target.value);
                }}
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Телефон</span>
              <input
                type="tel"
                name="phone"
                className="form-field__input"
                placeholder="+7 (901) 123-45-67"
                autoComplete="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={(e) => {
                  setSuccess(false);
                  setPhone(e.target.value);
                }}
              />
            </label>
            <div className="form-field form-field--date-picker">
              <span className="form-field__label" id="booking-date-label">
                Желаемая дата
              </span>
              <BookingDatePicker
                value={dateYmd}
                minYmd={minDate}
                labelledBy="booking-date-label"
                onChange={(ymd) => {
                  setSuccess(false);
                  setDateYmd(ymd);
                }}
              />
            </div>

            <div className="form-field form-field--time-slots">
              <span className="form-field__label" id="booking-time-label">
                Время визита
              </span>
              {slotsUi.hint ? (
                <p className="booking-time-slots-hint" style={{ margin: "0 0 0.5rem" }}>
                  {slotsUi.hint}
                </p>
              ) : null}
              <div className="booking-time-slots" role="radiogroup" aria-labelledby="booking-time-label">
                {slotsUi.showGrid &&
                  slotsUi.slots.map(({ slotHm, disabled }) => (
                    <button
                      key={slotHm}
                      type="button"
                      className={`booking-time-slot${timeHm === slotHm ? " booking-time-slot--selected" : ""}`}
                      role="radio"
                      aria-checked={timeHm === slotHm}
                      disabled={disabled}
                      title={
                        disabled
                          ? slotHm < effMinForTitle
                            ? "Время уже прошло"
                            : "Занято (запись или ближайшие 4 часа)"
                          : undefined
                      }
                      onClick={() => {
                        if (!disabled) {
                          setSuccess(false);
                          setTimeHm(slotHm);
                        }
                      }}
                    >
                      {formatSlotLabelHm(slotHm)}
                    </button>
                  ))}
              </div>
            </div>

            <div className="form-field form-field--masters">
              <span className="form-field__label" id="master-label">
                Мастер
              </span>
              <p className="master-hint">{masterHint}</p>
              <fieldset className="master-fieldset" aria-labelledby="master-label">
                <legend className="visually-hidden">Выбор мастера</legend>
                <div className="master-cards" id="master-cards">
                  {MASTER_ORDER.map(({ id, top }) => {
                    const isOn = workingIds.indexOf(id) !== -1;
                    const disabled = !dateYmd || !isOn;
                    return (
                      <label
                        key={id}
                        className={`master-card${top ? " master-card--top" : ""}${disabled ? " master-card--disabled" : ""}`}
                        data-master={id}
                      >
                        <input
                          type="radio"
                          name="master"
                          value={id}
                          className="master-card__input"
                          checked={masterId === id}
                          disabled={disabled}
                          onChange={() => {
                            setSuccess(false);
                            setMasterId(id);
                          }}
                        />
                        <span className="master-card__body">
                          <span className="master-card__name">{MASTERS[id]}</span>
                          {top ? <span className="master-card__badge">Топ мастер</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>
          <button type="submit" className="btn btn--primary booking-form__submit">
            Отправить заявку
          </button>
          <p className="booking-form__hint">
            Заявка сохраняется и передаётся администратору салона. Мы свяжемся с вами для подтверждения даты и времени.
          </p>
          {success && (
            <p className="booking-form__success" role="status">
              <span className="booking-form__success-text">
                Заявка принята. Мы свяжемся с вами для подтверждения даты и времени.
              </span>
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
