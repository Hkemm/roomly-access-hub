import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/roomie/AppShell";

export const Route = createFileRoute("/admin")({
  component: () => <AppShell role="admin" />,
});
