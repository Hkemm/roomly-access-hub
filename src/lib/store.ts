// Lightweight demo store (no external state library). Persists to localStorage.
// In Laravel, each action maps to a controller endpoint.
import { useEffect, useState, useSyncExternalStore } from "react";
import { buildReservations, rooms as seedRooms, sensors as seedSensors, users as seedUsers } from "./mock-data";
import type { Reservation, Room, SensorStatus, User } from "./types";

export interface State {
  users: User[];
  rooms: Room[];
  reservations: Reservation[];
  sensors: SensorStatus[];
  currentUserId: string | null;
  hydrated: boolean;
}

const KEY = "roomie-demo-v1";
const SESSION_KEY = "roomie-session";

const initial = (): State => ({
  users: seedUsers,
  rooms: seedRooms,
  reservations: buildReservations(),
  sensors: seedSensors,
  currentUserId: null,
  hydrated: false,
});

let state: State = initial();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  const { users, rooms, reservations, sensors } = state;
  localStorage.setItem(KEY, JSON.stringify({ users, rooms, reservations, sensors }));
}

function set(fn: (s: State) => Partial<State>) {
  state = { ...state, ...fn(state) };
  persist();
  listeners.forEach((l) => l());
}

export function hydrateStore() {
  if (state.hydrated || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<State>) : {};
    const uid = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    state = { ...state, ...saved, currentUserId: uid, hydrated: true };
  } catch {
    state = { ...state, hydrated: true };
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function useCurrentUser() {
  const s = useStore();
  return s.users.find((u) => u.id === s.currentUserId) ?? null;
}

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const actions = {
  login(email: string, password: string, remember: boolean): User | null {
    const u = state.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
    if (!u) return null;
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, u.id);
    set(() => ({ currentUserId: u.id }));
    return u;
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    set(() => ({ currentUserId: null }));
  },
  createReservation(r: Omit<Reservation, "id" | "status" | "createdAt">) {
    const res: Reservation = { ...r, id: uid("res"), status: "CONFIRMED", createdAt: new Date().toISOString() };
    set((s) => ({ reservations: [res, ...s.reservations] }));
    return res;
  },
  cancelReservation(id: string, by: "pj" | "admin") {
    set((s) => ({
      reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: "CANCELLED", cancelledBy: by } : r)),
    }));
  },
  checkIn(id: string) {
    const at = new Date().toISOString();
    set((s) => ({ reservations: s.reservations.map((r) => (r.id === id ? { ...r, checkInAt: at } : r)) }));
  },
  checkOut(id: string) {
    const at = new Date().toISOString();
    set((s) => ({
      reservations: s.reservations.map((r) => (r.id === id ? { ...r, checkOutAt: at, status: "COMPLETED" } : r)),
    }));
    return at;
  },
  saveRoom(room: Omit<Room, "id" | "token"> & { id?: string }) {
    if (room.id) {
      set((s) => ({ rooms: s.rooms.map((r) => (r.id === room.id ? { ...r, ...room, id: r.id } : r)) }));
      return;
    }
    const id = uid("r");
    const token = `ROOMIE-${room.code.toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    set((s) => ({
      rooms: [...s.rooms, { ...room, id, token }],
      sensors: [...s.sensors, { roomId: id, pir: "unknown", reed: "unknown", device: "unconnected", lastUpdate: null, simulated: false }],
    }));
  },
  setRoomActive(id: string, active: boolean) {
    set((s) => ({ rooms: s.rooms.map((r) => (r.id === id ? { ...r, active } : r)) }));
  },
  simulateSensor(roomId: string, patch: Partial<Omit<SensorStatus, "roomId">>) {
    set((s) => ({
      sensors: s.sensors.map((x) =>
        x.roomId === roomId ? { ...x, ...patch, simulated: true, lastUpdate: new Date().toISOString() } : x,
      ),
    }));
  },
  resetSensor(roomId: string) {
    set((s) => ({
      sensors: s.sensors.map((x) =>
        x.roomId === roomId ? { roomId, pir: "unknown", reed: "unknown", device: "unconnected", lastUpdate: null, simulated: false } : x,
      ),
    }));
  },
  resetDemo() {
    const uidNow = state.currentUserId;
    state = { ...initial(), currentUserId: uidNow, hydrated: true };
    persist();
    listeners.forEach((l) => l());
  },
};
