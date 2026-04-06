import { useState, useEffect } from "react";
import * as bookings from "../lib/bookingsStore";

export function useBookings() {
  const [list, setList] = useState(bookings.loadBookings);

  useEffect(() => {
    const fn = () => setList(bookings.loadBookings());
    window.addEventListener("velvet-bookings-changed", fn);
    window.addEventListener("storage", (e) => {
      if (e.key === "velvet_hair_bookings_v1") fn();
    });
    return () => window.removeEventListener("velvet-bookings-changed", fn);
  }, []);

  return {
    list,
    add: bookings.addBooking,
    remove: bookings.removeBooking,
    clearAll: bookings.clearAllBookings,
  };
}
