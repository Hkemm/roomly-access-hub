import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { UsageStatus } from "@/lib/rules";
import type { ReservationStatus } from "@/lib/types";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        success: "bg-success/12 text-success",
        warning: "bg-warning/20 text-warning-foreground",
        danger: "bg-destructive/12 text-destructive",
        info: "bg-info/12 text-info",
        primary: "bg-accent text-accent-foreground",
        neutral: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type Tone = NonNullable<VariantProps<typeof badge>["tone"]>;

export function StatusBadge({ tone, children, dot = true, className }: { tone: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn(badge({ tone }), className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const usageMeta: Record<UsageStatus, { label: string; tone: Tone }> = {
  BELUM_DIMULAI: { label: "Belum Dimulai", tone: "info" },
  AKTIF: { label: "Aktif", tone: "success" },
  SELESAI: { label: "Selesai", tone: "neutral" },
  KEDALUWARSA: { label: "Kedaluwarsa", tone: "warning" },
  DIBATALKAN: { label: "Dibatalkan", tone: "danger" },
};

export const statusMeta: Record<ReservationStatus, { tone: Tone }> = {
  CONFIRMED: { tone: "primary" },
  COMPLETED: { tone: "neutral" },
  CANCELLED: { tone: "danger" },
};
