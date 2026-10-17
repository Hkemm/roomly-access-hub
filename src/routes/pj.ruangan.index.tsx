import { createFileRoute } from "@tanstack/react-router";
import { SearchX, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/roomie/Common";
import { RoomCard } from "@/components/roomie/RoomCard";
import { Input } from "@/components/ui/input";
import { activeSessions, isAvailableNow, overlaps, toDateStr, toMinutes } from "@/lib/rules";
import { useNow, useStore } from "@/lib/store";

export const Route = createFileRoute("/pj/ruangan/")({
  head: () => ({ meta: [{ title: "Daftar Ruangan — Roomie" }, { name: "description", content: "Cari dan filter ruang kelas kampus." }] }),
  component: RoomList,
});

const selectCls = "h-11 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function RoomList() {
  const s = useStore();
  const now = useNow();
  const [q, setQ] = useState("");
  const [building, setBuilding] = useState("all");
  const [avail, setAvail] = useState("all");
  const [cap, setCap] = useState("0");
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const buildings = [...new Set(s.rooms.map((r) => r.building))];
  const active = activeSessions(s.reservations);

  const freeFor = (roomId: string, isActive: boolean) => {
    if (!isActive) return false;
    if (!start || !end || toMinutes(end) <= toMinutes(start)) return isAvailableNow(s.rooms.find((r) => r.id === roomId)!, s.reservations, now);
    return !s.reservations.some((r) => r.roomId === roomId && r.date === date && r.status !== "CANCELLED" && overlaps(toMinutes(start), toMinutes(end), toMinutes(r.start), toMinutes(r.end)));
  };

  const list = useMemo(
    () =>
      s.rooms
        .map((r) => ({ r, free: freeFor(r.id, r.active) }))
        .filter(({ r, free }) =>
          (q === "" || `${r.name} ${r.code}`.toLowerCase().includes(q.toLowerCase())) &&
          (building === "all" || r.building === building) &&
          r.capacity >= Number(cap) &&
          (avail === "all" || (avail === "free" ? free : !free)),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s, q, building, avail, cap, date, start, end, now],
  );

  return (
    <>
      <PageHeader title="Daftar Ruangan" subtitle="Temukan ruang kelas yang sesuai dengan kebutuhan Anda." />
      <div className="surface-card mb-6 grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-4 lg:col-span-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari ruangan..." value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-xl bg-card pl-10" />
        </div>
        <select className={selectCls} value={building} onChange={(e) => setBuilding(e.target.value)} aria-label="Filter gedung">
          <option value="all">Semua Gedung</option>
          {buildings.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select className={selectCls} value={avail} onChange={(e) => setAvail(e.target.value)} aria-label="Filter ketersediaan">
          <option value="all">Semua Status</option>
          <option value="free">Tersedia</option>
          <option value="busy">Tidak Tersedia</option>
        </select>
        <select className={selectCls} value={cap} onChange={(e) => setCap(e.target.value)} aria-label="Filter kapasitas">
          <option value="0">Semua Kapasitas</option>
          <option value="30">≥ 30 orang</option>
          <option value="40">≥ 40 orang</option>
          <option value="50">≥ 50 orang</option>
        </select>
        <div className="grid grid-cols-3 gap-3 md:col-span-4">
          <label className="text-xs font-semibold text-muted-foreground">Tanggal<input type="date" className={`${selectCls} mt-1 w-full`} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="text-xs font-semibold text-muted-foreground">Mulai<input type="time" className={`${selectCls} mt-1 w-full`} value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="text-xs font-semibold text-muted-foreground">Selesai<input type="time" className={`${selectCls} mt-1 w-full`} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
        <p className="text-xs text-muted-foreground md:col-span-4">
          {start && end ? `Ketersediaan untuk ${date}, ${start}–${end}.` : "Ketersediaan saat ini. Isi tanggal & jam untuk mengecek jadwal tertentu."}
        </p>
      </div>
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.map(({ r, free }) => <RoomCard key={r.id} room={r} available={free} inUse={active.some((a) => a.roomId === r.id)} />)}
        </div>
      ) : (
        <EmptyState icon={SearchX} title="Ruangan tidak ditemukan" text="Coba ubah kata kunci atau filter pencarian." />
      )}
    </>
  );
}
