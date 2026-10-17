import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/roomie/Common";
import { HistoryTable } from "@/components/roomie/HistoryTable";
import { useCurrentUser, useStore } from "@/lib/store";

export const Route = createFileRoute("/pj/riwayat")({
  head: () => ({ meta: [{ title: "Riwayat Penggunaan — Roomie" }, { name: "description", content: "Riwayat sesi penggunaan ruang kelas Anda." }] }),
  component: () => {
    const s = useStore();
    const user = useCurrentUser()!;
    return (
      <>
        <PageHeader title="Riwayat Penggunaan" subtitle="Waktu check-in dan checkout aktual dari sesi yang telah selesai." />
        <HistoryTable items={s.reservations.filter((r) => r.userId === user.id)} rooms={s.rooms} users={s.users} />
      </>
    );
  },
});
