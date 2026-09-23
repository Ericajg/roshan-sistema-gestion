import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  MessageCircle,
  Plus,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard, btnPrimario } from "@/components/ui-kit";
import {
  BloqueoModal,
  NuevoTurnoModal,
  PagoModal,
  SlotLibreModal,
  TurnoDetalleModal,
  estadoTurnoLabel,
} from "@/components/turno-modals";
import {
  HORAS,
  HOY,
  fechaCorta,
  fechaLarga,
  formatoMoneda,
  nombreDia,
  semanaDe,
  sumarDias,
  sumarMinutos,
  type EstadoTurno,
} from "@/lib/mock-data";
import { agruparBloqueos, estadoCobro, franjasDeServicio, pagadoDeTurno } from "@/lib/store";
import {
  useBloqueos,
  useBloquearDiaCompleto,
  usePagos,
  useQuitarBloqueo,
  useTurnosDia,
  useTurnosRango,
} from "@/lib/queries";
import { linkWhatsApp, mensajeRecordatorioTurno } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda de turnos — Roshan Masajes" },
      {
        name: "description",
        content:
          "Agenda diaria y semanal de Roshan Masajes: turnos, estados, horarios libres y bloqueos.",
      },
      { property: "og:title", content: "Agenda de turnos — Roshan Masajes" },
      {
        property: "og:description",
        content: "Vista diaria y semanal de los turnos del estudio Roshan.",
      },
    ],
  }),
  component: Agenda,
});

const ROW = 44;

const estadoCard: Record<EstadoTurno, { card: string; hora: string; dot: string }> = {
  reservado: {
    card: "border border-primary/45 border-l-4 border-l-primary bg-primary/12 text-foreground",
    hora: "text-primary/80",
    dot: "bg-primary",
  },
  realizado: {
    card: "border border-status-success/45 border-l-4 border-l-status-success bg-status-success/12 text-foreground",
    hora: "text-status-success",
    dot: "bg-status-success",
  },
  ausente: {
    card: "border border-dashed border-status-warning/50 border-l-4 border-l-status-warning bg-status-warning/10 text-foreground/90",
    hora: "text-status-warning",
    dot: "border border-status-warning bg-transparent",
  },
  cancelado: {
    card: "border border-status-danger/40 border-l-4 border-l-status-danger bg-status-danger/10 text-muted-foreground",
    hora: "text-status-danger/70",
    dot: "bg-status-danger",
  },
};

type Modal =
  | { tipo: "turno"; turnoId: string }
  | { tipo: "pago"; turnoId: string }
  | { tipo: "slot"; fecha: string; hora: string }
  | { tipo: "nuevo"; fecha: string; hora?: string | undefined }
  | { tipo: "bloqueo"; fecha: string; hora: string }
  | null;

function Agenda() {
  const [vista, setVista] = useState<"dia" | "semana">("semana");
  const [fecha, setFecha] = useState(HOY);
  const [modal, setModal] = useState<Modal>(null);

  const dias = useMemo(() => (vista === "semana" ? semanaDe(fecha) : [fecha]), [vista, fecha]);
  const semana = useMemo(() => semanaDe(fecha), [fecha]);

  const { data: turnos = [] } = useTurnosRango(semana[0]!, semana[5]!);
  const { data: bloqueos = [] } = useBloqueos();
  const { data: pagos = [] } = usePagos();
  const quitarBloqueo = useQuitarBloqueo();
  const bloquearDiaCompleto = useBloquearDiaCompleto();

  // RF-25: recordatorio ~24hs antes, sin depender de qué semana esté en vista.
  const manana = sumarDias(HOY, 1);
  const { data: turnosManana = [] } = useTurnosDia(manana);
  const recordatoriosManana = turnosManana.filter((t) => t.estado === "reservado");

  const mover = (paso: number) =>
    setFecha((f) => sumarDias(f, vista === "semana" ? paso * 7 : paso));

  const turnosDelDia = turnos.filter((t) => t.fecha === fecha && t.estado !== "cancelado");
  const proximos = turnosDelDia.filter((t) => t.estado === "reservado").length;

  const cobradoSemana = pagos
    .filter((p) => semana.includes(p.fecha))
    .reduce((a, p) => a + p.monto, 0);

  const pendienteSemana = turnos
    .filter((t) => semana.includes(t.fecha) && t.estado !== "cancelado")
    .reduce((total, t) => total + Math.max(0, t.precioAcordado - pagadoDeTurno(pagos, t.id)), 0);

  const rango =
    vista === "semana"
      ? `${fechaCorta(semana[0]!)} al ${fechaCorta(semana[5]!)}`
      : `${nombreDia(fecha)} ${fechaLarga(fecha)}`;

  const ocupadoEn = (dia: string, idx: number) => {
    const conTurno = turnos.some((t) => {
      if (t.fecha !== dia || t.estado === "cancelado") return false;
      const franjas = franjasDeServicio(t.duracion);
      const inicio = HORAS.indexOf(t.hora);
      return idx >= inicio && idx < inicio + franjas;
    });
    if (conTurno) return true;
    return bloqueos.some((b) => b.fecha === dia && b.hora === HORAS[idx]);
  };

  const gruposBloqueo = useMemo(() => agruparBloqueos(bloqueos), [bloqueos]);

  const bloquearDia = (dia: string) => {
    const horasLibres = HORAS.filter((_, idx) => !ocupadoEn(dia, idx));
    if (!horasLibres.length) return;
    bloquearDiaCompleto.mutate({ fecha: dia, horas: horasLibres });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={vista === "semana" ? "Semana del" : "Día"}
        title="Agenda"
        description={`${rango} · ${turnos.filter((t) => dias.includes(t.fecha) && t.estado !== "cancelado").length} sesiones en vista.`}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-md border border-border p-1">
              {(["dia", "semana"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className={`rounded px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors ${
                    vista === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {v === "dia" ? "Día" : "Semana"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-md border border-border">
              <button
                aria-label="Anterior"
                onClick={() => mover(-1)}
                className="px-3 py-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setFecha(HOY)}
                className="px-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
              >
                Hoy
              </button>
              <button
                aria-label="Siguiente"
                onClick={() => mover(1)}
                className="px-3 py-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              className={btnPrimario}
              onClick={() =>
                setModal({ tipo: "nuevo", fecha: vista === "dia" ? fecha : semana[0]! })
              }
            >
              <Plus className="h-4 w-4" /> Nuevo turno
            </button>
          </>
        }
      />

      {recordatoriosManana.length ? (
        <div className="panel-luxe rounded-xl p-5">
          <p className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
            Recordatorios de mañana ({nombreDia(manana)} {fechaCorta(manana)})
          </p>
          <ul className="mt-3 space-y-2">
            {recordatoriosManana.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 px-4 py-2.5"
              >
                <span className="text-sm text-foreground">
                  <span className="text-primary">{t.hora}</span> · {t.cliente} — {t.servicio}
                </span>
                <a
                  className="inline-flex items-center gap-1.5 rounded-md border border-status-success/50 px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-status-success transition-colors hover:bg-status-success/10"
                  href={linkWhatsApp(t.telefono, mensajeRecordatorioTurno(t))}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Recordar
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-4">
        <StatCard
          label="Turnos del día"
          valor={String(turnosDelDia.length)}
          detalle={`${nombreDia(fecha)} ${fechaCorta(fecha)}`}
        />
        <StatCard label="Por atender" valor={String(proximos)} detalle="Turnos reservados" />
        <StatCard
          label="Cobrado en la semana"
          valor={formatoMoneda(cobradoSemana)}
          detalle="Señas y pagos"
        />
        <StatCard
          label="Saldo por cobrar"
          valor={formatoMoneda(pendienteSemana)}
          detalle="Turnos de la semana"
        />
      </div>

      <div className="panel-luxe overflow-hidden rounded-xl">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${dias.length}, 1fr)` }}>
          <div className="border-b border-r border-border px-3 py-4" />
          {dias.map((dia) => (
            <div
              key={dia}
              className={`group relative border-b border-r border-border px-4 py-4 text-center last:border-r-0 ${
                dia === HOY ? "bg-primary/5" : ""
              }`}
            >
              <p className="font-display text-xl text-primary">{nombreDia(dia)}</p>
              <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">
                {fechaCorta(dia)}
              </p>
              <button
                title="Bloquear el día completo"
                aria-label={`Bloquear todo el día ${nombreDia(dia)}`}
                onClick={() => bloquearDia(dia)}
                disabled={bloquearDiaCompleto.isPending}
                className="absolute right-1.5 top-1.5 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
              >
                <Lock className="h-3 w-3" />
              </button>
            </div>
          ))}

          <div className="border-r border-border">
            {HORAS.map((hora) => (
              <div
                key={hora}
                className="flex items-start justify-end border-b border-border/50 pr-3 pt-1 text-[0.7rem] text-muted-foreground"
                style={{ height: ROW }}
              >
                {hora.endsWith(":00") ? hora : ""}
              </div>
            ))}
          </div>

          {dias.map((dia) => (
            <div key={dia} className="relative border-r border-border last:border-r-0">
              {HORAS.map((hora, idx) => (
                <button
                  key={hora}
                  onClick={() =>
                    ocupadoEn(dia, idx) ? undefined : setModal({ tipo: "slot", fecha: dia, hora })
                  }
                  className="block w-full border-b border-border/40 transition-colors hover:bg-primary/5"
                  style={{ height: ROW }}
                  aria-label={`${hora} del ${nombreDia(dia)}`}
                />
              ))}

              {gruposBloqueo
                .filter((g) => g.fecha === dia)
                .map((g) => {
                  const top = HORAS.indexOf(g.horaInicio) * ROW;
                  const franjas = Math.max(
                    1,
                    (HORAS.indexOf(g.horaFin) === -1 ? HORAS.length : HORAS.indexOf(g.horaFin)) -
                      HORAS.indexOf(g.horaInicio),
                  );
                  return (
                    <div
                      key={g.ids.join("-")}
                      className="absolute left-1.5 right-1.5 overflow-hidden rounded-md border border-dashed border-border bg-secondary/70 px-3 py-2"
                      style={{ top: top + 3, height: franjas * ROW - 6 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex items-center gap-1.5 truncate text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                          <Lock className="h-3 w-3 shrink-0" /> Bloqueado
                        </p>
                        <button
                          aria-label="Quitar bloqueo"
                          onClick={() => quitarBloqueo.mutate(g.ids)}
                          className="text-muted-foreground transition-colors hover:text-status-danger"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="truncate text-xs text-foreground/70">
                        {g.horaInicio} – {g.horaFin}
                      </p>
                    </div>
                  );
                })}

              {turnos
                .filter((t) => t.fecha === dia)
                .map((turno) => {
                  const franjas = franjasDeServicio(turno.duracion);
                  const top = HORAS.indexOf(turno.hora) * ROW;
                  const estilo = estadoCard[turno.estado];
                  const tachado = turno.estado === "cancelado" ? "line-through" : "";
                  const cobro = estadoCobro(turno.precioAcordado, pagadoDeTurno(pagos, turno.id));

                  return (
                    <button
                      key={turno.id}
                      onClick={() => setModal({ tipo: "turno", turnoId: turno.id })}
                      title={`${estadoTurnoLabel[turno.estado]} · ${turno.hora}–${sumarMinutos(turno.hora, turno.duracion)}`}
                      className={`absolute left-1.5 right-1.5 overflow-hidden rounded-md px-3 py-2 text-left transition-transform hover:-translate-y-0.5 ${estilo.card}`}
                      style={{ top: top + 3, height: franjas * ROW - 6 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`truncate text-xs font-medium tracking-wide ${tachado}`}>
                          {turno.cliente}
                        </p>
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${estilo.dot}`}
                          aria-hidden
                        />
                      </div>
                      <p className={`truncate text-[0.7rem] text-muted-foreground ${tachado}`}>
                        {turno.servicio} · {formatoMoneda(turno.precioAcordado)}
                      </p>
                      <p
                        className={`mt-1 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] ${estilo.hora}`}
                      >
                        {turno.hora}
                        {turno.estado !== "cancelado" && cobro !== "cobrado" ? (
                          <span className="text-status-warning">
                            {cobro === "parcial" ? "· seña" : "· sin cobrar"}
                          </span>
                        ) : null}
                      </p>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-primary/45 border-l-2 border-l-primary bg-primary/15" />
          Reservado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-status-success/45 border-l-2 border-l-status-success bg-status-success/15" />
          Realizado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-dashed border-status-warning/50 border-l-2 border-l-status-warning bg-status-warning/15" />
          Ausente
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-status-danger/40 border-l-2 border-l-status-danger bg-status-danger/15" />
          Cancelado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border border-dashed border-border bg-secondary/70" />
          Horario bloqueado
        </span>
        <span className="ml-auto flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5" /> Tocá un horario libre para agendar o bloquear.
        </span>
      </div>

      {modal?.tipo === "turno" ? (
        <TurnoDetalleModal
          turnoId={modal.turnoId}
          onClose={() => setModal(null)}
          onRegistrarPago={(turnoId) => setModal({ tipo: "pago", turnoId })}
        />
      ) : null}

      {modal?.tipo === "pago" ? (
        <PagoModal turnoId={modal.turnoId} onClose={() => setModal(null)} />
      ) : null}

      {modal?.tipo === "slot" ? (
        <SlotLibreModal
          fecha={modal.fecha}
          hora={modal.hora}
          onClose={() => setModal(null)}
          onCrearTurno={() => setModal({ tipo: "nuevo", fecha: modal.fecha, hora: modal.hora })}
          onBloquear={() => setModal({ tipo: "bloqueo", fecha: modal.fecha, hora: modal.hora })}
        />
      ) : null}

      {modal?.tipo === "nuevo" ? (
        <NuevoTurnoModal
          fechaInicial={modal.fecha}
          horaInicial={modal.hora}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal?.tipo === "bloqueo" ? (
        <BloqueoModal fecha={modal.fecha} hora={modal.hora} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}
