import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity, CalendarCheck, DoorOpen, History, LayoutDashboard, ListChecks, LogOut, Menu, QrCode, Radio, User as UserIcon, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { actions, useCurrentUser, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

export const NAV: Record<Role, NavItem[]> = {
  pj: [
    { to: "/pj", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/pj/ruangan", label: "Daftar Ruangan", icon: DoorOpen },
    { to: "/pj/scan", label: "Scan QR", icon: QrCode },
    { to: "/pj/reservasi", label: "Reservasi Saya", icon: CalendarCheck },
    { to: "/pj/riwayat", label: "Riwayat Penggunaan", icon: History },
    { to: "/pj/profil", label: "Profil", icon: UserIcon },
  ],
  admin: [
    { to: "/admin", label: "Dashboard Admin", icon: LayoutDashboard, exact: true },
    { to: "/admin/ruangan", label: "Manajemen Ruangan", icon: DoorOpen },
    { to: "/admin/reservasi", label: "Semua Reservasi", icon: ListChecks },
    { to: "/admin/monitoring", label: "Monitoring Ruangan", icon: Radio },
    { to: "/admin/sesi", label: "Sesi Aktif", icon: Activity },
    { to: "/admin/riwayat", label: "Riwayat Penggunaan", icon: History },
  ],
};

function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Logo /></div>
      <p className="px-5 pb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {role === "pj" ? "PJ Kelas" : "Administrator"}
      </p>
      <nav className="flex-1 space-y-1 px-3">
        {NAV[role].map((n) => {
          const active = n.exact ? path === n.to || path === `${n.to}/` : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                active ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}>
              <n.icon className="size-[18px]" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <div className="mb-3 rounded-2xl bg-gradient-mint p-4 text-xs text-secondary-foreground">
          <p className="font-bold">Mode Demo</p>
          <p className="mt-1 opacity-80">Data tersimpan lokal di browser. Belum terhubung ke server.</p>
          <button className="mt-2 font-bold underline underline-offset-2" onClick={() => actions.resetDemo()}>Reset data demo</button>
        </div>
        <button onClick={() => { actions.logout(); navigate({ to: "/" }); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
          <LogOut className="size-[18px]" />Logout
        </button>
      </div>
    </div>
  );
}

export function AppShell({ role }: { role: Role }) {
  const { hydrated } = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/" });
    else if (user.role !== role) navigate({ to: user.role === "pj" ? "/pj" : "/admin" });
  }, [hydrated, user, role, navigate]);

  if (!hydrated || !user || user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="size-10 animate-spin rounded-full border-4 border-accent border-t-primary" />
      </div>
    );
  }

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:block">
        <Sidebar role={role} />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-lift animate-in slide-in-from-left">
            <button className="absolute right-3 top-5 rounded-lg p-1.5 hover:bg-accent" onClick={() => setOpen(false)} aria-label="Tutup menu"><X className="size-5" /></button>
            <Sidebar role={role} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu /></Button>
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-3">
            {role === "pj" && (
              <Button asChild size="sm" className="hidden sm:inline-flex"><Link to="/pj/scan"><QrCode />Scan QR</Link></Button>
            )}
            <div className="flex items-center gap-2.5 rounded-full border bg-card py-1 pl-1 pr-3">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">{initials}</span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-[11px] text-muted-foreground">{role === "pj" ? user.kelas : "Administrator"}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
