import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/roomie/ConfirmDialog";
import { EmptyState, InfoRow, PageHeader } from "@/components/roomie/Common";
import { roomImage } from "@/components/roomie/RoomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtDate } from "@/lib/format";
import { BOOKING_CLOSE, BOOKING_MAX_DAYS_AHEAD, BOOKING_OPEN, toDateStr, validateReservation } from "@/lib/rules";
import { actions, useCurrentUser, useStore } from "@/lib/store";

export const Route = createFileRoute("/pj/booking/$roomId")({
  head: () => ({ meta: [{ title: "Buat Reservasi — Roomie" }, { name: "description", content: "Formulir reservasi ruang kelas." }] }),
  component: Booking,
});

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function Booking() {
  const { roomId } = Route.useParams();
  const s = useStore();
  const user = useCurrentUser()!;
  const navigate = useNavigate();
  const room = s.rooms.find((r) => r.id === roomId);
  const [f, setF] = useState({ course: "", sks: "", date: toDateStr(new Date()), start: "", end: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);

  if (!room) return <EmptyState icon={CalendarCheck} title="Ruangan tidak ditemukan" />;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const inputCls = "h-11 rounded-xl bg-card";

  const review = (e: React.FormEvent) => {
    e.preventDefault();
    const er = validateReservation({ roomId, ...f }, { rooms: s.rooms, reservations: s.reservations, now: new Date() });
    setErrors(er);
    if (!Object.keys(er).length) setConfirm(true);
  };

  const submit = () => {
    const er = validateReservation({ roomId, ...f }, { rooms: s.rooms, reservations: s.reservations, now: new Date() });
    if (Object.keys(er).length) return setErrors(er);
    actions.createReservation({ roomId, userId: user.id, course: f.course.trim(), sks: Number(f.sks), date: f.date, start: f.start, end: f.end });
    toast.success("Reservasi berhasil dikonfirmasi!");
    navigate({ to: "/pj/reservasi" });
  };

  return (
    <>
      <Link to="/pj/ruangan/$roomId" params={{ roomId }} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" />Kembali
      </Link>
      <PageHeader title="Buat Reservasi" subtitle={`Jam operasional ${BOOKING_OPEN}–${BOOKING_CLOSE}, maksimal ${BOOKING_MAX_DAYS_AHEAD} hari ke depan.`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={review} noValidate className="surface-card space-y-4 p-6 lg:col-span-2">
          <Field id="room" label="Ruangan" error={errors.roomId}>
            <Input id="room" value={`${room.name} (${room.code})`} readOnly className={`${inputCls} bg-muted`} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field id="course" label="Nama Mata Kuliah" error={errors.course}>
                <Input id="course" value={f.course} onChange={set("course")} placeholder="cth. Pemrograman Web" className={inputCls} />
              </Field>
            </div>
            <Field id="sks" label="Jumlah SKS" error={errors.sks}>
              <Input id="sks" inputMode="numeric" value={f.sks} onChange={set("sks")} placeholder="3" className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="date" label="Tanggal Reservasi" error={errors.date}>
              <Input id="date" type="date" value={f.date} onChange={set("date")} className={inputCls} />
            </Field>
            <Field id="start" label="Waktu Mulai" error={errors.start}>
              <Input id="start" type="time" value={f.start} onChange={set("start")} className={inputCls} />
            </Field>
            <Field id="end" label="Waktu Selesai" error={errors.end}>
              <Input id="end" type="time" value={f.end} onChange={set("end")} className={inputCls} />
            </Field>
          </div>
          <Field id="pj" label="PJ Kelas">
            <Input id="pj" value={`${user.name} — ${user.kelas}`} readOnly className={`${inputCls} bg-muted`} />
          </Field>
          {!room.active && <p className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">Ruangan ini sedang nonaktif dan tidak dapat direservasi.</p>}
          <Button type="submit" size="lg" className="w-full" disabled={!room.active}>Tinjau Reservasi</Button>
        </form>
        <div className="surface-card h-fit overflow-hidden">
          <img src={roomImage(room)} alt={room.name} width={1024} height={640} className="h-40 w-full object-cover" />
          <div className="p-5">
            <p className="font-bold">{room.name}</p>
            <p className="text-sm text-muted-foreground">{room.building} · Lantai {room.floor} · {room.capacity} orang</p>
          </div>
        </div>
      </div>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Ringkasan Reservasi" description="Periksa kembali detail sebelum konfirmasi." confirmLabel="Konfirmasi Reservasi" onConfirm={submit}>
        <div className="divide-y rounded-xl border px-4">
          <InfoRow label="Ruangan" value={room.name} />
          <InfoRow label="Mata Kuliah" value={f.course} />
          <InfoRow label="SKS" value={f.sks} />
          <InfoRow label="Tanggal" value={f.date ? fmtDate(f.date) : "-"} />
          <InfoRow label="Waktu" value={`${f.start} – ${f.end}`} />
          <InfoRow label="PJ Kelas" value={user.name} />
        </div>
      </ConfirmDialog>
    </>
  );
}
