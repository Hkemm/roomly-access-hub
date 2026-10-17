import { Activity, Clock, DoorClosed, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { fmtDateTime } from "@/lib/format";
import type { SensorStatus } from "@/lib/types";
import { SimBadge } from "./Common";
import { StatusBadge, type Tone } from "./StatusBadge";

export const pirMeta = {
  unknown: { label: "Belum Diketahui", tone: "neutral" as Tone },
  motion: { label: "Gerakan Terdeteksi", tone: "warning" as Tone },
  none: { label: "Tidak Ada Gerakan Terdeteksi", tone: "info" as Tone },
};
export const reedMeta = {
  unknown: { label: "Belum Diketahui", tone: "neutral" as Tone },
  open: { label: "Pintu Terbuka", tone: "warning" as Tone },
  closed: { label: "Pintu Tertutup", tone: "info" as Tone },
};
export const deviceMeta = {
  unconnected: { label: "Belum Terhubung", tone: "neutral" as Tone },
  online: { label: "Online", tone: "success" as Tone },
  offline: { label: "Offline", tone: "danger" as Tone },
};

function Tile({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-mint/60 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-card text-primary">{icon}</span>
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function SensorPanel({ s }: { s?: SensorStatus }) {
  const sensor: SensorStatus = s ?? { roomId: "", pir: "unknown", reed: "unknown", device: "unconnected", lastUpdate: null, simulated: false };
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sensor.lastUpdate ? "Status sensor perangkat IoT" : "Belum Ada Data Sensor — menunggu integrasi ESP32"}
        </p>
        {sensor.simulated && <SimBadge />}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile icon={<Activity className="size-4" />} title="PIR Motion Sensor">
          <StatusBadge tone={pirMeta[sensor.pir].tone}>{pirMeta[sensor.pir].label}</StatusBadge>
        </Tile>
        <Tile icon={<DoorClosed className="size-4" />} title="Magnetic Reed Switch">
          <StatusBadge tone={reedMeta[sensor.reed].tone}>{reedMeta[sensor.reed].label}</StatusBadge>
        </Tile>
        <Tile icon={<Wifi className="size-4" />} title="Koneksi ESP32">
          <StatusBadge tone={deviceMeta[sensor.device].tone}>{deviceMeta[sensor.device].label}</StatusBadge>
        </Tile>
        <Tile icon={<Clock className="size-4" />} title="Update Sensor Terakhir">
          <p className="text-sm font-semibold">{sensor.lastUpdate ? fmtDateTime(sensor.lastUpdate) : "Belum ada data"}</p>
        </Tile>
      </div>
    </div>
  );
}
