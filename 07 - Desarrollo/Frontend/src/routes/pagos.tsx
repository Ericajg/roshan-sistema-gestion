import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge, Select, StatCard, btnFantasma } from "@/components/ui-kit";
import { PagoModal } from "@/components/turno-modals";
import { HOY, fechaLarga, formatoMoneda, semanaDe } from "@/lib/mock-data";
import { MEDIOS_PAGO, estadoCobro, pagadoDeTurno } from "@/lib/store";
import { usePagos, useTurnosRango } from "@/lib/queries";

export const Route = createFileRoute("/pagos")({
  head: () => ({
    meta: [
      { title: "Pagos y cobranzas — Roshan Masajes" },
      {
        name: "description",
        content:
          "Señas y pagos de Roshan Masajes por medio de cobro, con saldos pendientes por turno.",
      },
      { property: "og:title", content: "Pagos y cobranzas — Roshan Masajes" },
      {
        property: "og:description",
        content: "Ingresos, señas y saldos pendientes del estudio Roshan.",
      },
    ],
  }),
  component: Pagos,
});

const cobroTono = { cobrado: "verde", parcial: "ambar", pendiente: "rojo" } as const;
const cobroLabel = { cobrado: "Cobrado", parcial: "Seña", pendiente: "Sin cobrar" } as const;

function Pagos() {
  const semana = useMemo(() => semanaDe(HOY), []);
  const { data: pagos = [] } = usePagos();
  const { data: turnosSemana = [] } = useTurnosRango(semana[0]!, semana[5]!);
  const [medio, setMedio] = useState<string>("todos");
  const [tipo, setTipo] = useState<string>("todos");
  const [cobrando, setCobrando] = useState<string | null>(null);

  const totalSemana = pagos
    .filter((p) => semana.includes(p.fecha))
    .reduce((a, p) => a + p.monto, 0);

  const senas = pagos
    .filter((p) => semana.includes(p.fecha) && p.tipo === "Seña")
    .reduce((a, p) => a + p.monto, 0);

  const efectivo = pagos
    .filter((p) => semana.includes(p.fecha) && p.medio === "Efectivo")
    .reduce((a, p) => a + p.monto, 0);

  // Saldos pendientes de la semana en curso (coherente con el resto de la página).
  const pendientes = turnosSemana
    .filter((t) => t.estado !== "cancelado")
    .map((t) => ({ turno: t, saldo: Math.max(0, t.precioAcordado - pagadoDeTurno(pagos, t.id)) }))
    .filter((x) => x.saldo > 0);

  const saldoTotal = pendientes.reduce((a, x) => a + x.saldo, 0);

  const filtrados = pagos
    .filter((p) => (medio === "todos" ? true : p.medio === medio))
    .filter((p) => (tipo === "todos" ? true : p.tipo === tipo))
    .slice()
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Semana en curso"
        title="Pagos"
        description="Señas y pagos registrados, medio de cobro y saldos pendientes por turno."
      />

      <div className="grid gap-5 md:grid-cols-4">
        <StatCard label="Cobrado en la semana" valor={formatoMoneda(totalSemana)} />
        <StatCard label="Señas recibidas" valor={formatoMoneda(senas)} detalle="Reservas" />
        <StatCard label="En efectivo" valor={formatoMoneda(efectivo)} detalle="Caja del estudio" />
        <StatCard
          label="Saldo por cobrar"
          valor={formatoMoneda(saldoTotal)}
          detalle={`${pendientes.length} turnos de la semana`}
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Movimientos</h2>
          <div className="flex gap-3">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="todos">Todos los tipos</option>
              <option value="Seña">Seña</option>
              <option value="Pago">Pago</option>
            </Select>
            <Select value={medio} onChange={(e) => setMedio(e.target.value)}>
              <option value="todos">Todos los medios</option>
              {MEDIOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="panel-luxe overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Servicio</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Medio</th>
                <th className="px-6 py-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/40 last:border-b-0 hover:bg-accent/40"
                >
                  <td className="px-6 py-4 text-muted-foreground">{fechaLarga(p.fecha)}</td>
                  <td className="px-6 py-4">{p.cliente}</td>
                  <td className="px-6 py-4 text-muted-foreground">{p.servicio}</td>
                  <td className="px-6 py-4">
                    <Badge tono={p.tipo === "Seña" ? "ambar" : "verde"}>{p.tipo}</Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{p.medio}</td>
                  <td className="px-6 py-4 text-right font-display text-lg text-primary">
                    {formatoMoneda(p.monto)}
                  </td>
                </tr>
              ))}
              {!filtrados.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No hay movimientos con esos filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Saldos pendientes</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pendientes.map(({ turno, saldo }) => {
            const cobro = estadoCobro(turno.precioAcordado, pagadoDeTurno(pagos, turno.id));
            return (
              <article key={turno.id} className="panel-luxe rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-foreground">{turno.cliente}</p>
                    <p className="text-xs text-muted-foreground">
                      {turno.servicio} · {fechaLarga(turno.fecha)} {turno.hora}
                    </p>
                  </div>
                  <Badge tono={cobroTono[cobro]}>{cobroLabel[cobro]}</Badge>
                </div>
                <p className="mt-4 font-display text-2xl text-status-warning">
                  {formatoMoneda(saldo)}
                </p>
                <button
                  className={`${btnFantasma} mt-4 w-full`}
                  onClick={() => setCobrando(turno.id)}
                >
                  <Wallet className="h-4 w-4" /> Registrar pago
                </button>
              </article>
            );
          })}
          {!pendientes.length ? (
            <p className="text-sm text-muted-foreground">No hay saldos pendientes.</p>
          ) : null}
        </div>
      </section>

      {cobrando ? <PagoModal turnoId={cobrando} onClose={() => setCobrando(null)} /> : null}
    </div>
  );
}
