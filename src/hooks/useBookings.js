import { useState, useEffect, useCallback, useMemo } from "react";
import * as bookings from "../lib/bookingsStore";

export function useBookings() {
  const cloud = useMemo(() => bookings.isCloudBookingsEnabled(), []);
  const [list, setList] = useState(() => (cloud ? [] : bookings.loadBookings()));
  const [loading, setLoading] = useState(cloud);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let unsubRealtime = () => {};

    async function refresh() {
      try {
        setLoadError(null);
        const next = await bookings.loadBookingsList();
        setList(next);
      } catch (e) {
        setLoadError(e?.message || "Ошибка загрузки заявок");
        if (!cloud) setList(bookings.loadBookings());
      } finally {
        if (cloud) setLoading(false);
      }
    }

    function onCustom() {
      if (cloud) {
        refresh();
      } else {
        setList(bookings.loadBookings());
      }
    }

    window.addEventListener("velvet-bookings-changed", onCustom);
    window.addEventListener("storage", (e) => {
      if (e.key === "velvet_hair_bookings_v1") onCustom();
    });

    if (cloud) {
      import("../lib/bookingsRemote.js").then((m) => {
        unsubRealtime = m.subscribeBookings(() => {
          refresh();
        });
        refresh();
      });
    }

    return () => {
      window.removeEventListener("velvet-bookings-changed", onCustom);
      unsubRealtime();
    };
  }, [cloud]);

  const add = useCallback((entry) => bookings.addBooking(entry), []);
  const remove = useCallback((id) => bookings.removeBooking(id), []);
  const clearAll = useCallback(() => bookings.clearAllBookings(), []);

  return {
    list,
    loading,
    loadError,
    cloudEnabled: cloud,
    add,
    remove,
    clearAll,
  };
}
