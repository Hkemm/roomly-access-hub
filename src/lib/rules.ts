// Frontend-only demo rules. Laravel must re-validate everything server-side.
import type { Reservation, Room, SensorStatus } from "./types";

export const CHECKIN_EARLY_MINUTES = 15;
export const BOOKING_MAX_DAYS_AHEAD = 14;
export const BOOKING_OPEN = "07:00";
export const BOOKING_CLOSE = "21:00";

const pad = (n: number) => String(n).padStart(2, "0");
export const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const combine = (date: string, time: string) => new Date(`${date}T${time}:00`);
export const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE;

export type UsageStatus = "BELUM_DIMULAI" | "AKTIF" | "SELESAI" | "KEDALUWARSA" | "DIBATALKAN";

export function usageStatus(r: Reservation, now: Date): UsageStatus {
  if (r.status === "CANCELLED") return "DIBATALKAN";
  if (r.status === "COMPLETED" || r.checkOutAt) return "SELESAI";
  if (r.checkInAt) return "AKTIF";
  if (combine(r.date, r.end) <= now) return "KEDALUWARSA";
  return "BELUM_DIMULAI";
}

type Check = { ok: true } | { ok: false; reason: string };

export function canCheckIn(r: Reservation, userId: string, now: Date): Check {
  if (r.userId !== userId) return { ok: false, reason: "Reservasi ini bukan milik Anda." };
  if (r.status !== "CONFIRMED") return { ok: false, reason: "Reservasi tidak berstatus CONFIRMED." };
  if (r.checkInAt) return { ok: false, reason: "Sesi sudah dimulai." };
  const start = combine(r.date, r.start).getTime() - CHECKIN_EARLY_MINUTES * 60_000;
  const end = combine(r.date, r.end).getTime();
  if (now.getTime() < start)
    return { ok: false, reason: `Check-in dibuka ${CHECKIN_EARLY_MINUTES} menit sebelum waktu mulai.` };
  if (now.getTime() >= end) return { ok: false, reason: "Waktu reservasi sudah berakhir." };
  return { ok: true };
}

export function canCheckOut(r: Reservation, userId: string): Check {
  if (r.userId !== userId) return { ok: false, reason: "Anda tidak dapat checkout sesi milik pengguna lain." };
  if (!r.checkInAt || r.checkOutAt) return { ok: false, reason: "Tidak ada sesi aktif." };
  return { ok: true };
}

export function canCancel(r: Reservation, now: Date): boolean {
  return r.status === "CONFIRMED" && !r.checkInAt && combine(r.date, r.end) > now;
}

export interface ReservationInput {
  roomId: string;
  course: string;
  sks: string;
  date: string;
  start: string;
  end: string;
}

export function validateReservation(
  input: ReservationInput,
  ctx: { rooms: Room[]; reservations: Reservation[]; now: Date },
): Record<string, string> {
  const e: Record<string, string> = {};
  const room = ctx.rooms.find((r) => r.id === input.roomId);
  if (!room) e.roomId = "Ruangan tidak ditemukan.";
  else if (!room.active) e.roomId = "Ruangan sedang nonaktif dan tidak dapat direservasi.";
  if (!input.course.trim()) e.course = "Nama mata kuliah wajib diisi.";
  if (!input.sks.trim()) e.sks = "Jumlah SKS wajib diisi.";
  else if (!/^\d+$/.test(input.sks.trim()) || Number(input.sks) < 1 || Number(input.sks) > 6)
    e.sks = "SKS harus bilangan bulat positif (1–6).";
  if (!input.date) e.date = "Tanggal wajib diisi.";
  if (!input.start) e.start = "Waktu mulai wajib diisi.";
  if (!input.end) e.end = "Waktu selesai wajib diisi.";
  if (Object.keys(e).length) return e;

  if (toMinutes(input.end) <= toMinutes(input.start)) e.end = "Waktu selesai harus setelah waktu mulai.";
  if (toMinutes(input.start) < toMinutes(BOOKING_OPEN) || toMinutes(input.end) > toMinutes(BOOKING_CLOSE))
    e.start = `Jam reservasi hanya ${BOOKING_OPEN}–${BOOKING_CLOSE}.`;

  const today = toDateStr(ctx.now);
  const max = new Date(ctx.now);
  max.setDate(max.getDate() + BOOKING_MAX_DAYS_AHEAD);
  if (input.date < today) e.date = "Tanggal tidak boleh di masa lalu.";
  else if (input.date > toDateStr(max)) e.date = `Reservasi maksimal ${BOOKING_MAX_DAYS_AHEAD} hari ke depan.`;
  else if (input.date === today && combine(input.date, input.start) < ctx.now)
    e.start = "Waktu mulai sudah lewat.";
  if (Object.keys(e).length) return e;

  const s = toMinutes(input.start);
  const en = toMinutes(input.end);
  const clash = ctx.reservations.find(
    (r) =>
      r.roomId === input.roomId &&
      r.date === input.date &&
      r.status !== "CANCELLED" &&
      overlaps(s, en, toMinutes(r.start), toMinutes(r.end)),
  );
  if (clash) e.start = `Bentrok dengan reservasi ${clash.course} (${clash.start}–${clash.end}).`;
  return e;
}

/** Reservation occupying the room right now (booked or in session). */
export function currentReservation(roomId: string, reservations: Reservation[], now: Date) {
  return reservations.find((r) => {
    if (r.roomId !== roomId || r.status !== "CONFIRMED") return false;
    if (r.checkInAt && !r.checkOutAt) return true;
    return combine(r.date, r.start) <= now && now < combine(r.date, r.end);
  });
}

export function isAvailableNow(room: Room, reservations: Reservation[], now: Date) {
  return room.active && !currentReservation(room.id, reservations, now);
}

export function activeSessions(reservations: Reservation[]) {
  return reservations.filter((r) => r.status === "CONFIRMED" && r.checkInAt && !r.checkOutAt);
}

/** Rooms that need a physical check: expired bookings today, or motion with no session (sensor data only). */
export function needsCheck(room: Room, reservations: Reservation[], sensor: SensorStatus | undefined, now: Date) {
  const today = toDateStr(now);
  const expired = reservations.some(
    (r) => r.roomId === room.id && r.date === today && usageStatus(r, now) === "KEDALUWARSA",
  );
  const inSession = activeSessions(reservations).some((r) => r.roomId === room.id);
  const motionNoSession = sensor?.pir === "motion" && !inSession;
  const offline = sensor?.device === "offline";
  return expired || motionNoSession || offline;
}

export function durationLabel(fromIso: string, toIso: string) {
  const mins = Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} jam ${m} menit` : `${m} menit`;
}
