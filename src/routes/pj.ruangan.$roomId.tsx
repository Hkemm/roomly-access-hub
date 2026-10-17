import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, CalendarPlus, Layers, QrCode, Users } from "lucide-react";
import { EmptyState, InfoRow, PageHeader } from "@/components/roomie/Common";
import { AvailabilityBadge, roomImage } from "@/components/roomie/RoomCard";
import { SensorPanel } from "@/components/roomie/SensorPanel";
import { StatusBadge, usageMeta } from "@/components/roomie/StatusBadge";
import { Button } from "@/components/ui/button";
import { fmtShortDate } from "@/lib/format";
import { combine, currentReservation, isAvailableNow, toDateStr, usageStatus } from "@/lib/rules";
import { useNow, useStore } from "@/lib/store";

export const Route = createFileRoute("/pj/ruangan/$roomId")({
  head: () => ({ meta: [{ title: "Detail Ruangan — Roomie" }, { name: "description", content: "Jadwal, status penggunaan, dan sensor ruangan." }] }),
  component: RoomDetail,
});

export function RoomDetailBody({ roomId, backTo }: { roomId: string; backTo?: boolean }) {
  const s = useStore();
  const now = useNow();
  const room = s.rooms.find((r) => r.id === roomId);
  if (!room) return <EmptyState icon={Building2} title="Ruangan tidak ditemukan" />;
  const today = toDateStr(now);
  const schedule = s.reservations
    .filter((r) => r.roomId === room.id && r.status !== "CANCELLED" && r.date >= today)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const cur = currentReservation(room.id, s.reservations, now);
  const usage = cur ? usageMeta[usageStatus(cur, now)] : null;
  const sensor = s.sensors.find((x) => x.roomId === room.id);

  return (
    <>
      {backTo && (
        <Link to="/pj/ruangan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" />Kembali
        </Link>
      )}
      <PageHeader title={room.name} subtitle={`Kode ${room.code} · ${room.building}, Lantai ${room.floor}`}
        action={<div className="flex gap-2">
          <Button asChild variant="outline" disabled={!room.active}><Link to="/pj/booking/$roomId" params={{ roomId: room.id }}><CalendarPlus />Reservasi</Link></Button>
          <Button asChild><Link to="/pj/scan"><QrCode />Scan QR untuk Reservasi</Link></Button>
        </div>} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="surface-card overflow-hidden">
            <img src={roomImage(room)} alt={room.name} width={1024} height={640} className="h-56 w-full object-cover" />
            <div className="grid grid-cols-3 divide-x p-4 text-center text-sm">
              <div><Building2 className="mx-auto size-5 text-primary" /><p className="mt-1 font-semibold">{room.building}</p></div>
              <div><Layers className="mx-auto size-5 text-primary" /><p className="mt-1 font-semibold">Lantai {room.floor}</p></div>
              <div><Users className="mx-auto size-5 text-primary" /><p className="mt-1 font-semibold">{room.capacity} orang</p></div>
            </div>
            <div className="flex flex-wrap gap-2 border-t p-4">
              {room.facilities.map((f) => <StatusBadge key={f} tone="primary" dot={false}>{f}</StatusBadge>)}
            </div>
          </div>
          <div className="surface-card p-5">
            <h3 className="mb-3 font-bold">Jadwal Reservasi</h3>
            {schedule.length ? (
              <div className="divide-y">
                {schedule.map((r) => {
                  const u = usageMeta[usageStatus(r, now)];
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-semibold">{r.course}</p>
                        <p className="text-muted-foreground">{fmtShortDate(r.date)} · {r.start}–{r.end}</p>
                      </div>
                      <StatusBadge tone={u.tone}>{u.label}</StatusBadge>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground">Belum ada jadwal mendatang.</p>}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className="surface-card p-5">
            <h3 className="mb-2 font-bold">Status Ruangan</h3>
            <InfoRow label="Ketersediaan" value={<AvailabilityBadge room={room} available={isAvailableNow(room, s.reservations, now)} />} />
            <InfoRow label="Penggunaan" value={usage ? <StatusBadge tone={usage.tone}>{usage.label}</StatusBadge> : <StatusBadge tone="neutral">Tidak ada sesi</StatusBadge>} />
            {cur && <InfoRow label="Kegiatan" value={`${cur.course} (${cur.start}–${cur.end})`} />}
            {cur && combine(cur.date, cur.end) < now && <p className="text-xs text-warning-foreground">Sesi melewati jadwal selesai.</p>}
          </div>
          <div className="surface-card p-5">
            <h3 className="mb-3 font-bold">Monitoring Fisik</h3>
            <SensorPanel s={sensor} />
          </div>
        </div>
      </div>
    </>
  );
}

function RoomDetail() {
  const { roomId } = Route.useParams();
  return <RoomDetailBody roomId={roomId} backTo />;
}
