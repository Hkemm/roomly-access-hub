// Local demo data. Replace with Laravel/MySQL data when integrating.
import type { Reservation, Room, SensorStatus, User } from "./types";
import { toDateStr, toTimeStr } from "./rules";

export const users: User[] = [
  {
    id: "u1",
    name: "Rina Kartika",
    email: "pj@roomie.ac.id",
    password: "roomie123",
    role: "pj",
    nim: "2210511034",
    kelas: "Informatika 3A",
    prodi: "S1 Informatika",
  },
  {
    id: "u2",
    name: "Bima Pratama",
    email: "bima@roomie.ac.id",
    password: "roomie123",
    role: "pj",
    nim: "2210511077",
    kelas: "Sistem Informasi 2B",
    prodi: "S1 Sistem Informasi",
  },
  { id: "a1", name: "Admin Akademik", email: "admin@roomie.ac.id", password: "admin123", role: "admin" },
];

export const rooms: Room[] = [
  { id: "r1", code: "A101", name: "Ruang A101", building: "Gedung A", floor: 1, capacity: 40, token: "ROOMIE-A101-7F3K", active: true, kind: "kelas", facilities: ["Proyektor", "AC", "Whiteboard"] },
  { id: "r2", code: "A102", name: "Ruang A102", building: "Gedung A", floor: 1, capacity: 35, token: "ROOMIE-A102-Q8MZ", active: true, kind: "kelas", facilities: ["Proyektor", "AC"] },
  { id: "r3", code: "A201", name: "Ruang A201", building: "Gedung A", floor: 2, capacity: 50, token: "ROOMIE-A201-L2PX", active: true, kind: "kelas", facilities: ["Proyektor", "AC", "Sound System"] },
  { id: "r4", code: "A202", name: "Ruang A202", building: "Gedung A", floor: 2, capacity: 30, token: "ROOMIE-A202-V9TD", active: false, kind: "kelas", facilities: ["AC", "Whiteboard"] },
  { id: "r5", code: "B101", name: "Ruang B101", building: "Gedung B", floor: 1, capacity: 45, token: "ROOMIE-B101-H4NC", active: true, kind: "kelas", facilities: ["Proyektor", "AC"] },
  { id: "r6", code: "B102", name: "Ruang B102", building: "Gedung B", floor: 1, capacity: 25, token: "ROOMIE-B102-R6WE", active: true, kind: "kelas", facilities: ["Smart TV", "AC"] },
  { id: "r7", code: "LAB1", name: "Laboratorium Komputer 1", building: "Gedung C", floor: 3, capacity: 32, token: "ROOMIE-LAB1-K7SA", active: true, kind: "lab", facilities: ["32 PC", "Proyektor", "AC"] },
  { id: "r8", code: "LAB2", name: "Laboratorium Komputer 2", building: "Gedung C", floor: 3, capacity: 28, token: "ROOMIE-LAB2-Z1YB", active: true, kind: "lab", facilities: ["28 PC", "Smart TV", "AC"] },
];

export const sensors: SensorStatus[] = rooms.map((r) => ({
  roomId: r.id,
  pir: "unknown",
  reed: "unknown",
  device: "unconnected",
  lastUpdate: null,
  simulated: false,
}));

function roundTo10(d: Date) {
  const x = new Date(d);
  x.setSeconds(0, 0);
  x.setMinutes(Math.floor(x.getMinutes() / 10) * 10);
  return x;
}
const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Builds reservations relative to "now" so the demo flow always works. */
export function buildReservations(now = new Date()): Reservation[] {
  const base = roundTo10(now);
  const today = toDateStr(now);
  const created = addDays(now, -2).toISOString();
  const yest = toDateStr(addDays(now, -1));
  const tomorrow = toDateStr(addDays(now, 1));
  const lastWeek = toDateStr(addDays(now, -6));
  const sameDay = (a: Date, b: Date) => a.getDate() === b.getDate();
  const safe = (d: Date, fallback: string) => (sameDay(d, now) ? toTimeStr(d) : fallback);

  const myStart = addMin(base, -10);
  const myEnd = addMin(base, 90);
  const otherStart = addMin(base, -40);
  const otherEnd = addMin(base, 60);

  return [
    { id: "res-1", roomId: "r1", userId: "u1", course: "Pemrograman Web", sks: 3, date: today, start: safe(myStart, "00:00"), end: safe(myEnd, "23:50"), status: "CONFIRMED", createdAt: created },
    { id: "res-2", roomId: "r7", userId: "u1", course: "Basis Data", sks: 3, date: tomorrow, start: "09:00", end: "11:30", status: "CONFIRMED", createdAt: created },
    { id: "res-3", roomId: "r3", userId: "u1", course: "Struktur Data", sks: 2, date: yest, start: "13:00", end: "14:40", status: "COMPLETED", createdAt: created, checkInAt: `${yest}T12:55:00`, checkOutAt: `${yest}T14:35:00` },
    { id: "res-4", roomId: "r2", userId: "u1", course: "Statistika", sks: 2, date: lastWeek, start: "08:00", end: "09:40", status: "CANCELLED", createdAt: created, cancelledBy: "pj" },
    { id: "res-5", roomId: "r5", userId: "u2", course: "Analisis Sistem", sks: 3, date: today, start: safe(otherStart, "00:00"), end: safe(otherEnd, "23:50"), status: "CONFIRMED", createdAt: created, checkInAt: otherStart.toISOString() },
    { id: "res-6", roomId: "r8", userId: "u2", course: "Jaringan Komputer", sks: 3, date: lastWeek, start: "10:00", end: "12:30", status: "COMPLETED", createdAt: created, checkInAt: `${lastWeek}T10:02:00`, checkOutAt: `${lastWeek}T12:21:00` },
  ];
}
