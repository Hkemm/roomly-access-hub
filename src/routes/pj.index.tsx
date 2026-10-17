import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CalendarCheck, CalendarX, CheckCircle2, DoorOpen, Activity, QrCode } from "lucide-react";
import { EmptyState, PageHeader, StatCard } from "@/components/roomie/Common";
import { ReservationCard } from "@/components/roomie/ReservationCard";
import { RoomCard } from "@/components/roomie/RoomCard";
import { Button } from "@/components/ui/button";
import { activeSessions, combine, isAvailableNow, needsCheck } from "@/lib/rules";
import { useCurrentUser, useNow, useStore } from "@/lib/store";

export const Route = createFileRoute("/pj/")({
  head: () => ({ meta: [{ title: "Dashboard PJ Kelas — Roomie" }, { name: "description", content: "Ringkasan ruangan dan reservasi Anda." }] }),
  component: PjDashboard,
});

function PjDashboard() {
  const s = useStore();
  const user = useCurrentUser()!;
  const now = useNow();
  const active = activeSessions(s.reservations);
  const activeRooms = s.rooms.filter((r) => active.some((a) => a.roomId === r.id));
  const available = s.rooms.filter((r) => isAvailableNow(r, s.reservations, now));
  const check = s.rooms.filter((r) => needsCheck(r, s.reservations, s.sensors.find((x) => x.roomId === r.id), now));

  const mine = s.reservations
    .filter((r) => r.userId === user.id && r.status === "CONFIRMED" && (r.checkInAt || combine(r.date, r.end) > now))
    .sort((a, b) => (a.checkInAt ? -1 : b.checkInAt ? 1 : `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)));
  const next = mine[0];

  const quick = [
    { to: "/pj/scan", label: "Scan QR Ruangan", desc: "Reservasi, check-in & checkout", icon: QrCode, primary: true },
    { to: "/pj/ruangan", label: "Lihat Daftar Ruangan", desc: "Cari ruangan tersedia", icon: DoorOpen },
    { to: "/pj/reservasi", label: "Reservasi Saya", desc: `${mine.length} reservasi mendatang`, icon: CalendarCheck },
  ] as const;

  return (
    <>
      <PageHeader title="Selamat Datang di Roomie! 👋" subtitle="Kelola reservasi dan pantau ketersediaan ruang kelas dengan mudah." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Ruangan" value={s.rooms.length} icon={DoorOpen} hint={`${s.rooms.filter((r) => !r.active).length} nonaktif`} />
        <StatCard label="Ruangan Tersedia" value={available.length} icon={CheckCircle2} tone="success" hint="Saat ini" />
        <StatCard label="Sedang Digunakan" value={activeRooms.length} icon={Activity} tone="warning" hint="Sesi aktif" />
        <StatCard label="Perlu Diperiksa" value={check.length} icon={AlertTriangle} tone="danger" hint="Reservasi kedaluwarsa / sensor" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {quick.map((q) => (
          <Link key={q.to} to={q.to}
            className={`group flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift ${"primary" in q ? "bg-gradient-primary text-primary-foreground shadow-soft" : "surface-card"}`}>
            <span className={`grid size-12 place-items-center rounded-xl ${"primary" in q ? "bg-primary-foreground/20" : "bg-accent text-primary"}`}><q.icon className="size-6" /></span>
            <div className="flex-1">
              <p className="font-bold">{q.label}</p>
              <p className={`text-xs ${"primary" in q ? "opacity-85" : "text-muted-foreground"}`}>{q.desc}</p>
            </div>
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Reservasi Aktif & Mendatang</h2>
        {next ? (
          <ReservationCard r={next} room={s.rooms.find((r) => r.id === next.roomId)} userId={user.id} now={now} />
        ) : (
          <EmptyState icon={CalendarX} title="Belum ada reservasi" text="Scan QR ruangan atau pilih dari daftar ruangan untuk membuat reservasi."
            action={<Button asChild><Link to="/pj/ruangan">Cari Ruangan</Link></Button>} />
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Ringkasan Ruangan</h2>
          <Link to="/pj/ruangan" className="text-sm font-semibold text-primary hover:underline">Lihat semua</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {s.rooms.slice(0, 4).map((r) => (
            <RoomCard key={r.id} room={r} available={isAvailableNow(r, s.reservations, now)} inUse={activeRooms.some((a) => a.id === r.id)} />
          ))}
        </div>
      </section>
    </>
  );
}
