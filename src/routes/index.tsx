import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, GraduationCap, Lock, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import heroImg from "@/assets/login-hero.jpg";
import { Logo } from "@/components/roomie/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actions, useCurrentUser, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk — Roomie" },
      { name: "description", content: "Masuk ke Roomie untuk reservasi dan check-in ruang kelas via QR." },
      { property: "og:title", content: "Masuk — Roomie" },
      { property: "og:description", content: "Masuk ke Roomie untuk reservasi dan check-in ruang kelas via QR." },
    ],
  }),
  component: Login,
});

const DEMO = [
  { key: "pj", label: "PJ Kelas", desc: "Reservasi & check-in", email: "pj@roomie.ac.id", password: "roomie123", icon: GraduationCap },
  { key: "admin", label: "Administrator", desc: "Kelola & monitoring", email: "admin@roomie.ac.id", password: "admin123", icon: ShieldCheck },
] as const;

function Login() {
  const navigate = useNavigate();
  const { hydrated } = useStore();
  const user = useCurrentUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (hydrated && user) navigate({ to: user.role === "pj" ? "/pj" : "/admin" });
  }, [hydrated, user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (!email.trim()) er.email = "Email wajib diisi.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) er.email = "Format email tidak valid.";
    if (!password) er.password = "Password wajib diisi.";
    else if (password.length < 6) er.password = "Password minimal 6 karakter.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const u = actions.login(email, password, remember);
    if (!u) {
      setErrors({ password: "Email atau password salah." });
      return;
    }
    toast.success(`Selamat datang, ${u.name}!`);
    navigate({ to: u.role === "pj" ? "/pj" : "/admin" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-mint p-12 lg:flex">
        <Logo size="lg" />
        <img src={heroImg} alt="Ilustrasi kampus pintar Roomie" width={1024} height={1024} className="mx-auto w-full max-w-md mix-blend-multiply" />
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            Your Space,<br /><span className="text-primary">Your Schedule.</span>
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Reservasi ruang kelas lebih mudah, cepat, dan terorganisir bersama Roomie.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 lg:hidden"><Logo size="lg" /></div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome Back!</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Masuk untuk mengelola reservasi ruang kelas Anda.</p>

          <div className="mt-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Akun Demo</p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO.map((d) => {
                const sel = email === d.email;
                return (
                  <button key={d.key} type="button" onClick={() => { setEmail(d.email); setPassword(d.password); setErrors({}); }}
                    className={cn("rounded-2xl border p-3 text-left transition-all hover:border-primary hover:shadow-soft", sel ? "border-primary bg-accent" : "bg-card")}>
                    <d.icon className="size-5 text-primary" />
                    <p className="mt-2 text-sm font-bold">{d.label}</p>
                    <p className="text-xs text-muted-foreground">{d.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="nama@roomie.ac.id" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-card pl-10" />
              </div>
              {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-card px-10" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-medium text-destructive">{errors.password}</p>}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-primary" />
              Ingat saya
            </label>
            <Button type="submit" size="lg" className="w-full">Masuk</Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">Autentikasi disimulasikan untuk keperluan demo.</p>
        </div>
      </section>
    </div>
  );
}
