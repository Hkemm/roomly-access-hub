import { DoorOpen } from "lucide-react";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-11 rounded-2xl" : "size-9 rounded-xl";
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid ${box} place-items-center bg-gradient-primary text-primary-foreground shadow-soft`}>
        <DoorOpen className={size === "lg" ? "size-6" : "size-5"} />
      </span>
      <span className={`font-extrabold tracking-tight ${size === "lg" ? "text-2xl" : "text-xl"}`}>
        Room<span className="text-primary">ie</span>
      </span>
    </div>
  );
}
