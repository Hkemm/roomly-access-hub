import { Link } from "@tanstack/react-router";
import { Building2, Layers, Users } from "lucide-react";
import classImg from "@/assets/room-class.jpg";
import labImg from "@/assets/room-lab.jpg";
import { Button } from "@/components/ui/button";
import type { Room } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export const roomImage = (r: Room) => (r.kind === "lab" ? labImg : classImg);

export function AvailabilityBadge({ room, available }: { room: Room; available: boolean }) {
  if (!room.active) return <StatusBadge tone="neutral">Nonaktif</StatusBadge>;
  return available ? <StatusBadge tone="success">Tersedia</StatusBadge> : <StatusBadge tone="danger">Tidak Tersedia</StatusBadge>;
}

export function RoomCard({ room, available, inUse }: { room: Room; available: boolean; inUse?: boolean }) {
  return (
    <div className="surface-card group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lift animate-rise">
      <div className="relative h-36 overflow-hidden">
        <img src={roomImage(room)} alt={room.name} loading="lazy" width={1024} height={640} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <AvailabilityBadge room={room} available={available} />
          {inUse && <StatusBadge tone="warning">Sedang Digunakan</StatusBadge>}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold leading-tight">{room.name}</p>
            <p className="text-xs font-medium text-muted-foreground">Kode {room.code}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Building2 className="size-3.5" />{room.building}</span>
          <span className="flex items-center gap-1"><Layers className="size-3.5" />Lantai {room.floor}</span>
          <span className="flex items-center gap-1"><Users className="size-3.5" />{room.capacity} org</span>
        </div>
        <Button asChild variant="soft" className="mt-4 w-full">
          <Link to="/pj/ruangan/$roomId" params={{ roomId: room.id }}>Lihat Detail</Link>
        </Button>
      </div>
    </div>
  );
}
