import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, LogIn } from "lucide-react";
import logo from "@/assets/roshan-lotus.png";
import { useAuth } from "@/lib/auth";
import { Campo, Input, btnPrimario } from "@/components/ui-kit";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Roshan Masajes" },
      {
        name: "description",
        content: "Acceso al panel administrativo de Roshan Masajes: agenda, clientes y pagos.",
      },
      { property: "og:title", content: "Iniciar sesión — Roshan Masajes" },
      {
        property: "og:description",
        content: "Ingreso privado al sistema de gestión del estudio Roshan.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const { iniciarSesion, cargando, error } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void iniciarSesion(usuario, password);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Roshan Masajes" width={512} height={512} className="h-20 w-20" />
          <div className="text-center">
            <h1 className="font-display text-4xl leading-none tracking-wide text-gold-gradient">
              Roshan
            </h1>
            <p className="mt-2 text-[0.6rem] uppercase tracking-[0.42em] text-muted-foreground">
              Masajes · Panel de gestión
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="panel-luxe mt-9 space-y-5 rounded-xl p-7">
          <Campo label="Usuario">
            <Input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              placeholder="riki"
            />
          </Campo>

          <Campo label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Campo>

          {error ? (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-md border border-status-danger/50 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={cargando} className={`${btnPrimario} w-full`}>
            <LogIn className="h-4 w-4" /> {cargando ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
