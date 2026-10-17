import { createFileRoute } from "@tanstack/react-router";
import { InfoRow, PageHeader } from "@/components/roomie/Common";
import { useCurrentUser, useStore } from "@/lib/store";

export const Route = createFileRoute("/pj/profil")({
  head: () => ({ meta: [{ title: "Profil — Roomie" }, { name: "description", content: "Profil PJ Kelas." }] }),
  component: () => {
    const s = useStore();
    const u = useCurrentUser()!;
    const mine = s.reservations.filter((r) => r.userId === u.id);
    return (
      <>
        <PageHeader title="Profil" subtitle="Informasi akun PJ Kelas Anda." />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="surface-card flex flex-col items-center p-6 text-center">
            <span className="grid size-20 place-items-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-soft">
              {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            <p className="mt-4 text-lg font-bold">{u.name}</p>
            <p className="text-sm text-muted-foreground">PJ Kelas · {u.kelas}</p>
          </div>
          <div className="surface-card divide-y p-6 md:col-span-2">
            <InfoRow label="Email" value={u.email} />
            <InfoRow label="NIM" value={u.nim} />
            <InfoRow label="Program Studi" value={u.prodi} />
            <InfoRow label="Kelas" value={u.kelas} />
            <InfoRow label="Total Reservasi" value={mine.length} />
            <InfoRow label="Sesi Selesai" value={mine.filter((r) => r.status === "COMPLETED").length} />
          </div>
        </div>
      </>
    );
  },
});
