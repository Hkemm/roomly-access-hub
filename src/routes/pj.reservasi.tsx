import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarX } from "lucide-react";
import { useState } from "react";
import { EmptyState, InfoRow, PageHeader } from "@/components/roomie/Common";
import { ReservationCard } from "@/components/roomie/ReservationCard";
import { StatusBadge, usageMeta } from "@/components/roomie/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { usageStatus, type UsageStatus } from "@/lib/rules";
import { useCurrentUser, useNow, useStore } from "@/lib/store";
import type { Reservation } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pj/reservasi")({
  head: () => ({ meta: [{ title: "Reservasi Saya — Roomie" }, { name: "description", content: "Daftar reservasi ruang kelas Anda." }] }),
  component: MyReservations,
});

const TABS: { key: string; label: string; match: (u: UsageStatus) => boolean }[] = [
  { key: "all", label: "Semua", match: () => true },
  { key: "up", label: "Mendatang", match: (u) => u === "BELUM_DIMULAI" },
  { key: "on", label: "Sedang Berlangsung", match: (u) => u === "AKTIF" },
  { key: "done", label: "Selesai", match: (u) => u === "SELESAI" || u === "KEDALUWARSA" },
  { key: "cx", label: "Dibatalkan", match: (u) => u === "DIBATALKAN" },
];

function MyReservations() {
  const s = useStore();
  const user = useCurrentUser()!;
  const now = useNow();
  const [tab, setTab] = useState("all");
  const [detail, setDetail] = useState<Reservation | null>(null);
  const t = TABS.find((x) => x.key === tab)!;
  const list = s.reservations
    .filter((r) => r.userId === user.id && t.match(usageStatus(r, now)))
    .sort((a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`));
  const room = (id: string) => s.rooms.find((r) => r.id === id);

  return (
    <>
      <PageHeader title="Reservasi Saya" subtitle="Pantau dan kelola semua reservasi ruang kelas Anda."
        action={<Button asChild><Link to="/pj/ruangan">Reservasi Baru</Link></Button>} />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((x) => (
          <button key={x.key} onClick={() => setTab(x.key)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all", tab === x.key ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-muted-foreground hover:bg-accent")}>
            {x.label}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => <ReservationCard key={r.id} r={r} room={room(r.roomId)} userId={user.id} now={now} onDetail={() => setDetail(r)} />)}
        </div>
      ) : (
        <EmptyState icon={CalendarX} title="Tidak ada reservasi" text="Belum ada reservasi pada kategori ini." />
      )}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader><DialogTitle>Detail Reservasi</DialogTitle></DialogHeader>
          {detail && (
            <div className="divide-y rounded-xl border px-4">
              <InfoRow label="Ruangan" value={room(detail.roomId)?.name} />
              <InfoRow label="Mata Kuliah" value={detail.course} />
              <InfoRow label="SKS" value={detail.sks} />
              <InfoRow label="Tanggal" value={fmtDate(detail.date)} />
              <InfoRow label="Waktu" value={`${detail.start} – ${detail.end}`} />
              <InfoRow label="Status" value={detail.status} />
              <InfoRow label="Penggunaan" value={<StatusBadge tone={usageMeta[usageStatus(detail, now)].tone}>{usageMeta[usageStatus(detail, now)].label}</StatusBadge>} />
              {detail.checkInAt && <InfoRow label="Check-in" value={fmtDateTime(detail.checkInAt)} />}
              {detail.checkOutAt && <InfoRow label="Checkout" value={fmtDateTime(detail.checkOutAt)} />}
              {detail.cancelledBy && <InfoRow label="Dibatalkan oleh" value={detail.cancelledBy === "admin" ? "Administrator" : "PJ Kelas"} />}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
