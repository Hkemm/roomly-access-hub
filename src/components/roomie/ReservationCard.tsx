import { CalendarDays, Clock, DoorOpen, LogIn, LogOut, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtTime } from "@/lib/format";
import { canCancel, canCheckIn, canCheckOut, durationLabel, usageStatus } from "@/lib/rules";
import { actions } from "@/lib/store";
import type { Reservation, Room } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { InfoRow } from "./Common";
import { StatusBadge, statusMeta, usageMeta } from "./StatusBadge";

/** Check-in / checkout / cancel buttons with confirmation. Reused by dashboard, list and scanner. */
export function ReservationActions({ r, room, userId, now, showCancel = true }: { r: Reservation; room?: Room | undefined; userId: string; now: Date; showCancel?: boolean }) {
  const [dlg, setDlg] = useState<null | "in" | "out" | "cancel">(null);
  const ci = canCheckIn(r, userId, now);
  const co = canCheckOut(r, userId);
  const cancelable = r.userId === userId && canCancel(r, now);
  const mine = r.userId === userId;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {mine && co.ok && (
          <Button variant="destructive" onClick={() => setDlg("out")}><LogOut />Checkout</Button>
        )}
        {mine && !r.checkInAt && r.status === "CONFIRMED" && (
          <Button variant="success" disabled={!ci.ok} title={!ci.ok ? ci.reason : undefined} onClick={() => setDlg("in")}>
            <LogIn />Check-in
          </Button>
        )}
        {showCancel && cancelable && (
          <Button variant="outline" onClick={() => setDlg("cancel")}><X />Batalkan</Button>
        )}
      </div>
      {mine && !r.checkInAt && r.status === "CONFIRMED" && !ci.ok && (
        <p className="mt-2 text-xs text-muted-foreground">{ci.reason}</p>
      )}

      <ConfirmDialog open={dlg === "in"} onOpenChange={(o) => !o && setDlg(null)} title="Konfirmasi Check-in" description={`Mulai sesi di ${room?.name ?? "ruangan"} untuk ${r.course}?`} confirmLabel="Ya, Check-in" variant="success"
        onConfirm={() => { actions.checkIn(r.id); toast.success("Check-in berhasil. Sesi kini AKTIF."); }} />
      <ConfirmDialog open={dlg === "out"} onOpenChange={(o) => !o && setDlg(null)} title="Konfirmasi Checkout" description="Akhiri sesi penggunaan ruangan ini?" confirmLabel="Ya, Checkout" variant="destructive"
        onConfirm={() => {
          const at = actions.checkOut(r.id);
          toast.success(`Checkout berhasil. Durasi: ${durationLabel(r.checkInAt!, at)}.`);
        }}>
        {r.checkInAt && <InfoRow label="Mulai sesi" value={fmtTime(r.checkInAt)} />}
      </ConfirmDialog>
      <ConfirmDialog open={dlg === "cancel"} onOpenChange={(o) => !o && setDlg(null)} title="Batalkan Reservasi?" description={`Reservasi ${r.course} di ${room?.name ?? "ruangan"} akan dibatalkan.`} confirmLabel="Ya, Batalkan" variant="destructive"
        onConfirm={() => { actions.cancelReservation(r.id, "pj"); toast("Reservasi dibatalkan."); }} />
    </>
  );
}

export function ReservationCard({ r, room, userId, now, onDetail }: { r: Reservation; room?: Room | undefined; userId: string; now: Date; onDetail?: (() => void) | undefined }) {
  const u = usageMeta[usageStatus(r, now)];
  return (
    <div className="surface-card p-5 animate-rise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><DoorOpen className="size-5" /></span>
          <div>
            <p className="font-bold">{r.course}</p>
            <p className="text-sm text-muted-foreground">{room?.name ?? "—"} · {r.sks} SKS</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <StatusBadge tone={statusMeta[r.status].tone} dot={false}>{r.status}</StatusBadge>
          <StatusBadge tone={u.tone}>{u.label}</StatusBadge>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><CalendarDays className="size-4" />{fmtDate(r.date)}</span>
        <span className="flex items-center gap-1.5"><Clock className="size-4" />{r.start} – {r.end}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ReservationActions r={r} room={room} userId={userId} now={now} />
        {onDetail && <Button variant="ghost" onClick={onDetail}>Lihat Detail</Button>}
      </div>
    </div>
  );
}
