import { Link } from "@tanstack/react-router";
import { CalendarDays, Users, Sparkles, Wallet, Settings, LogOut } from "lucide-react";
import logo from "@/assets/roshan-lotus.png";
import { useAuth } from "@/lib/auth";

const items = [
  { title: "Agenda", to: "/", icon: CalendarDays, exact: true },
  { title: "Clientes", to: "/clientes", icon: Users, exact: false },
  { title: "Servicios", to: "/servicios", icon: Sparkles, exact: false },
  { title: "Pagos", to: "/pagos", icon: Wallet, exact: false },
  { title: "Configuración", to: "/configuracion", icon: Settings, exact: false },
] as const;

export function AppSidebar() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex flex-col items-center gap-3 px-6 py-8">
        <img src={logo} alt="Roshan" width={512} height={512} className="h-16 w-16" />
        <div className="text-center">
          <p className="font-display text-3xl leading-none tracking-wide text-gold-gradient">
            Roshan
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.42em] text-muted-foreground">
            Masajes
          </p>
        </div>
      </div>

      <div className="mx-6 h-px hairline-gold" />

      <nav className="flex flex-col gap-1 px-4 py-6">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            className="group flex items-center gap-3 rounded-md px-4 py-3 text-sm tracking-wide text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-primary data-[status=active]:bg-sidebar-accent data-[status=active]:text-primary"
          >
            <item.icon className="h-4 w-4" strokeWidth={1.5} />
            <span>{item.title}</span>
          </Link>
        ))}

        <button
          onClick={cerrarSesion}
          className="mt-2 flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm tracking-wide text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-status-danger"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          <span>Cerrar sesión</span>
        </button>
      </nav>

      <div className="mt-auto px-6 py-8">
        <div className="rounded-md border border-border/60 px-4 py-3">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Sesión</p>
          <p className="mt-1 font-display text-lg text-primary">{usuario?.usuario ?? "Studio"}</p>
          <p className="text-xs text-muted-foreground">Panel del propietario</p>
        </div>
      </div>
    </aside>
  );
}
