import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CameraOff, Info, KeyRound, QrCode, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InfoRow, PageHeader } from "@/components/roomie/Common";
import { ReservationActions } from "@/components/roomie/ReservationCard";
import { AvailabilityBadge, roomImage } from "@/components/roomie/RoomCard";
import { StatusBadge } from "@/components/roomie/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDate, fmtTime } from "@/lib/format";
import { activeSessions, combine, isAvailableNow, toDateStr } from "@/lib/rules";
import { useCurrentUser, useNow, useStore } from "@/lib/store";

export const Route = createFileRoute("/pj/scan")({
  head: () => ({ meta: [{ title: "Scan QR Ruangan — Roomie" }, { name: "description", content: "Scan QR ruangan untuk reservasi, check-in, dan checkout." }] }),
  component: ScanPage,
});

type Scanner = { stop: () => Promise<void>; clear: () => void };

function ScanPage() {
  const s = useStore();
  const user = useCurrentUser()!;
  const now = useNow(15_000);
  const [token, setToken] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const scannerRef = useRef<Scanner | null>(null);

  const resolve = (raw: string) => {
    const t = raw.trim().toUpperCase();
    const room = s.rooms.find((r) => r.token.toUpperCase() === t);
    if (!room) {
      toast.error("QR tidak valid atau ruangan tidak terdaftar.");
      return false;
    }
    setRoomId(room.id);
    toast.success(`Ruangan terdeteksi: ${room.name}`);
    return true;
  };

  const stop = async () => {
    const sc = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (sc) {
      try { await sc.stop(); sc.clear(); } catch { /* already stopped */ }
    }
  };

  const start = async () => {
    setCamError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("Browser tidak mendukung akses kamera. Gunakan input token manual.");
      return;
    }
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const sc = new Html5Qrcode("qr-reader");
      scannerRef.current = sc as unknown as Scanner;
      setScanning(true);
      await sc.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 220, height: 220 } }, (text) => {
        if (resolve(text)) void stop();
      }, () => {});
    } catch {
      setScanning(false);
      scannerRef.current = null;
      setCamError("Kamera tidak dapat diakses. Izinkan akses kamera (HTTPS/localhost) atau gunakan token manual.");
    }
  };

  useEffect(() => () => { void stop(); }, []);

  const room = s.rooms.find((r) => r.id === roomId);
  const myActive = activeSessions(s.reservations).find((r) => r.userId === user.id);
  const othersActive = room && activeSessions(s.reservations).find((r) => r.roomId === room.id && r.userId !== user.id);
  const myHere = room
    ? s.reservations
        .filter((r) => r.roomId === room.id && r.userId === user.id && r.status === "CONFIRMED" && (r.checkInAt || (r.date === toDateStr(now) && combine(r.date, r.end) > now)))
        .sort((a, b) => (a.checkInAt ? -1 : b.checkInAt ? 1 : a.start.localeCompare(b.start)))[0]
    : undefined;

  return (
    <>
      <PageHeader title="Scan QR Ruangan" subtitle="Satu pemindai untuk reservasi, check-in, dan checkout." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="surface-card p-4">
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-foreground/90">
              <div id="qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
              {!scanning && (
                <div className="absolute inset-0 grid place-items-center text-center text-primary-foreground/80">
                  <div><QrCode className="mx-auto size-14 opacity-70" /><p className="mt-2 text-sm">Kamera belum aktif</p></div>
                </div>
              )}
              <div className="pointer-events-none absolute inset-[14%] rounded-2xl border-2 border-primary-glow">
                {scanning && <div className="scan-line absolute inset-x-2 h-0.5 rounded-full bg-primary-glow shadow-soft" />}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {!scanning ? (
                <Button className="flex-1" size="lg" onClick={start}><Camera />Mulai Scan</Button>
              ) : (
                <Button className="flex-1" size="lg" variant="outline" onClick={stop}><CameraOff />Matikan Kamera</Button>
              )}
            </div>
            <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Izinkan akses kamera saat diminta. Kamera hanya berfungsi di HTTPS atau localhost.
            </p>
            {camError && <p className="mt-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{camError}</p>}
          </div>
          <form className="surface-card p-4" onSubmit={(e) => { e.preventDefault(); if (token.trim()) resolve(token); }}>
            <p className="mb-2 flex items-center gap-2 text-sm font-bold"><KeyRound className="size-4 text-primary" />Input Token Manual</p>
            <div className="flex gap-2">
              <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="cth. ROOMIE-A101-7F3K" className="h-11 rounded-xl bg-card font-mono" />
              <Button type="submit" className="h-11">Cek</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.rooms.slice(0, 5).map((r) => (
                <button key={r.id} type="button" onClick={() => { setToken(r.token); resolve(r.token); }} className="rounded-lg bg-mint px-2 py-1 font-mono text-[11px] text-secondary-foreground hover:bg-accent">{r.token}</button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Token demo di atas tersedia untuk simulasi tanpa kamera.</p>
          </form>
        </div>

        <div>
          {!room ? (
            <div className="surface-card grid h-full min-h-72 place-items-center p-8 text-center">
              <div>
                <ScanLine className="mx-auto size-12 text-soft" />
                <p className="mt-3 font-semibold">Belum ada ruangan dipindai</p>
                <p className="mt-1 text-sm text-muted-foreground">Arahkan kamera ke QR code yang tertempel di pintu ruangan.</p>
              </div>
            </div>
          ) : (
            <div className="surface-card overflow-hidden animate-rise">
              <img src={roomImage(room)} alt={room.name} width={1024} height={640} className="h-40 w-full object-cover" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold">{room.name}</p>
                    <p className="text-sm text-muted-foreground">{room.building} · Lantai {room.floor} · {room.capacity} orang</p>
                  </div>
                  <AvailabilityBadge room={room} available={isAvailableNow(room, s.reservations, now)} />
                </div>

                {myHere?.checkInAt ? (
                  <div className="mt-5 rounded-2xl bg-success/10 p-4">
                    <StatusBadge tone="success">Sesi Aktif</StatusBadge>
                    <InfoRow label="Mata kuliah" value={myHere.course} />
                    <InfoRow label="Mulai sesi" value={fmtTime(myHere.checkInAt)} />
                    <InfoRow label="Jadwal" value={`${myHere.start} – ${myHere.end}`} />
                    <div className="mt-3"><ReservationActions r={myHere} room={room} userId={user.id} now={now} showCancel={false} /></div>
                  </div>
                ) : myHere ? (
                  <div className="mt-5 rounded-2xl bg-accent p-4">
                    <StatusBadge tone="primary">Reservasi CONFIRMED</StatusBadge>
                    <InfoRow label="Mata kuliah" value={myHere.course} />
                    <InfoRow label="Tanggal" value={fmtDate(myHere.date)} />
                    <InfoRow label="Waktu" value={`${myHere.start} – ${myHere.end}`} />
                    <div className="mt-3"><ReservationActions r={myHere} room={room} userId={user.id} now={now} showCancel={false} /></div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {othersActive && <p className="rounded-xl bg-warning/15 p-3 text-sm text-warning-foreground">Ruangan sedang digunakan oleh kelas lain ({othersActive.course}). Anda tidak dapat melakukan checkout sesi milik orang lain.</p>}
                    {myActive && <p className="rounded-xl bg-info/10 p-3 text-sm text-info">Anda masih memiliki sesi aktif di ruangan lain. Scan QR ruangan tersebut untuk checkout.</p>}
                    <p className="text-sm text-muted-foreground">Anda belum memiliki reservasi aktif di ruangan ini hari ini.</p>
                    {room.active ? (
                      <Button asChild size="lg" className="w-full"><Link to="/pj/booking/$roomId" params={{ roomId: room.id }}>Buat Reservasi</Link></Button>
                    ) : (
                      <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">Ruangan nonaktif — tidak dapat direservasi.</p>
                    )}
                  </div>
                )}
                <Button variant="ghost" className="mt-3 w-full" onClick={() => setRoomId(null)}>Scan ruangan lain</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
