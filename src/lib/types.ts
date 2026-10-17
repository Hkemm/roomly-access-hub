export type Role = "pj" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // demo only — real auth handled by Laravel
  role: Role;
  nim?: string;
  kelas?: string;
  prodi?: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  token: string; // static QR token
  active: boolean;
  kind: "kelas" | "lab";
  facilities: string[];
}

export type ReservationStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Reservation {
  id: string;
  roomId: string;
  userId: string;
  course: string;
  sks: number;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  status: ReservationStatus;
  createdAt: string;
  checkInAt?: string;
  checkOutAt?: string;
  cancelledBy?: "pj" | "admin";
}

export type PirState = "unknown" | "motion" | "none";
export type ReedState = "unknown" | "open" | "closed";
export type DeviceState = "unconnected" | "online" | "offline";

export interface SensorStatus {
  roomId: string;
  pir: PirState;
  reed: ReedState;
  device: DeviceState;
  lastUpdate: string | null;
  simulated: boolean;
}
