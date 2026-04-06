import { createClient } from "@supabase/supabase-js";

function getUrlKey() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

let clientSingleton = null;

export function getBookingsSupabase() {
  const pair = getUrlKey();
  if (!pair) return null;
  if (!clientSingleton) {
    clientSingleton = createClient(pair.url, pair.key);
  }
  return clientSingleton;
}

function mapFromDb(r) {
  return {
    id: r.id,
    createdAt: r.created_at,
    name: r.name ?? "",
    phone: r.phone ?? "",
    dateYmd: r.date_ymd ?? "",
    timeHm: r.time_hm ?? "",
    masterId: r.master_id ?? "",
    masterName: r.master_name ?? "",
  };
}

function mapToDb(row) {
  return {
    id: row.id,
    created_at: row.createdAt,
    name: row.name,
    phone: row.phone,
    date_ymd: row.dateYmd,
    time_hm: row.timeHm,
    master_id: row.masterId,
    master_name: row.masterName,
  };
}

export async function fetchBookings() {
  const sb = getBookingsSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapFromDb);
}

export async function insertBooking(row) {
  const sb = getBookingsSupabase();
  if (!sb) throw new Error("Supabase не настроен");
  const { error } = await sb.from("bookings").insert(mapToDb(row));
  if (error) throw error;
}

export async function deleteBookingRemote(id) {
  const sb = getBookingsSupabase();
  if (!sb) throw new Error("Supabase не настроен");
  const { error } = await sb.from("bookings").delete().eq("id", id);
  if (error) throw error;
}

export async function clearAllBookingsRemote() {
  const sb = getBookingsSupabase();
  if (!sb) throw new Error("Supabase не настроен");
  const { error } = await sb.from("bookings").delete().neq("id", "");
  if (error) throw error;
}

export function subscribeBookings(onChange) {
  const sb = getBookingsSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel("velvet-bookings")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}
