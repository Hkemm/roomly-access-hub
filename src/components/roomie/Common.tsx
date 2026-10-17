import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between animate-rise">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "primary" }: { label: string; value: number | string; icon: LucideIcon; hint?: string; tone?: "primary" | "success" | "warning" | "danger" }) {
  const toneCls = {
    primary: "bg-accent text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
  }[tone];
  return (
    <div className="surface-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift animate-rise">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid size-10 place-items-center rounded-xl", toneCls)}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
        <Icon className="size-7" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

export function SimBadge() {
  return (
    <span className="rounded-md bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning-foreground">
      Data Simulasi
    </span>
  );
}
