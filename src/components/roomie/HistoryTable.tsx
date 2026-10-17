import { History } from "lucide-react";
import { fmtShortDate, fmtTime } from "@/lib/format";
import { durationLabel } from "@/lib/rules";
import type { Reservation, Room, User } from "@/lib/types";
import { EmptyState } from "./Common";

export function HistoryTable({ items, rooms, users, showUser }: { items: Reservation[]; rooms: Room[]; users: User[]; showUser?: boolean }) {
  const done = items
    .filter((r) => r.checkInAt && r.checkOutAt)
    .sort((a, b) => b.checkOutAt!.localeCompare(a.checkOutAt!));
  if (!done.length) return <EmptyState icon={History} title="Belum ada riwayat" text="Sesi yang sudah checkout akan muncul di sini." />;
  return (
    <div className="surface-card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-mint text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Ruangan</th>
            <th className="px-4 py-3">Mata Kuliah</th>
            {showUser && <th className="px-4 py-3">PJ Kelas</th>}
            <th className="px-4 py-3">Tanggal</th>
            <th className="px-4 py-3">Jadwal</th>
            <th className="px-4 py-3">Check-in</th>
            <th className="px-4 py-3">Checkout</th>
            <th className="px-4 py-3">Durasi</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {done.map((r) => (
            <tr key={r.id} className="hover:bg-mint/50">
              <td className="px-4 py-3 font-semibold">{rooms.find((x) => x.id === r.roomId)?.name}</td>
              <td className="px-4 py-3">{r.course}</td>
              {showUser && <td className="px-4 py-3">{users.find((u) => u.id === r.userId)?.name}</td>}
              <td className="px-4 py-3">{fmtShortDate(r.date)}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.start}–{r.end}</td>
              <td className="px-4 py-3">{fmtTime(r.checkInAt!)}</td>
              <td className="px-4 py-3">{fmtTime(r.checkOutAt!)}</td>
              <td className="px-4 py-3 font-semibold text-primary">{durationLabel(r.checkInAt!, r.checkOutAt!)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
