import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarPlus, Mail, Pencil, Phone } from "lucide-react";
import { Badge, Detalle, StatCard, btnFantasma, btnPrimario } from "@/components/ui-kit";
import { ClienteFormModal } from "./clientes.index";
import {
  NuevoTurnoModal,
  PagoModal,
  TurnoDetalleModal,
  estadoTurnoTono,
} from "@/components/turno-modals";
import { HOY, fechaLarga, formatoMoneda, nombreDia } from "@/lib/mock-data";
import { iniciales, nombreCompleto } from "@/lib/store";
import { useClientes, useCliente, useEditarCliente, useHistorialCliente } from "@/lib/queries";

export const Route = createFileRoute("/clientes/$clienteId")({
  head: () => ({
    meta: [
      { title: "Ficha de cliente — Roshan Masajes" },
      {
        name: "description",
        content:
          "Ficha del cliente en Roshan Masajes: datos de contacto, historial de turnos, atenciones y pagos.",
      },
      { property: "og:title", content: "Ficha de cliente — Roshan Masajes" },
      {
        property: "og:description",
        content: "Historial completo de sesiones, atenciones y pagos del cliente.",
      },
    ],
  }),
  component: FichaCliente,
});

type Modal =
  | { tipo: "editar" }
  | { tipo: "nuevoTurno" }
  | { tipo: "turno"; turnoId: string }
  | { tipo: "pago"; turnoId: string }
  | null;

function FichaCliente() {
  const { clienteId } = Route.useParams();
  const { data: cliente } = useCliente(clienteId);
  const { data: historialDatos } = useHistorialCliente(clienteId);
  const { data: clientes = [] } = useClientes();
  const editarCliente = useEditarCliente();
  const [modal, setModal] = useState<Modal>(null);
  const [error, setError] = useState<string | null>(null);

  if (!cliente) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl">Cargando…</h1>
        <Link to="/clientes" className={btnFantasma}>
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Link>
      </div>
    );
  }

  const historial = historialDatos?.historial ?? [];
  const realizadas = historial.filter((t) => t.estado === "realizado").length;
  const totalPagado = historial.reduce((a, t) => a + t.totalPagado, 0);
  const saldo = historial
    .filter((t) => t.estado !== "cancelado")
    .reduce((total, t) => total + Math.max(0, t.saldoPendiente), 0);
  const ultima = historial.find((t) => t.estado === "realizado");

  return (
    <div className="space-y-8">
      <Link
        to="/clientes"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Clientes
      </Link>

      <header className="flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/40 font-display text-xl text-primary sm:h-16 sm:w-16 sm:text-2xl">
            {iniciales(cliente)}
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-primary/70">Ficha</p>
            <h1 className="mt-1 break-words font-display text-3xl sm:text-4xl">
              {nombreCompleto(cliente)}
            </h1>
            <p className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
              <span className="flex min-w-0 items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {cliente.telefono}
              </span>
              <span className="flex min-w-0 items-center gap-2 break-all">
                <Mail className="h-3.5 w-3.5" /> {cliente.email || "—"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <button className={btnFantasma} onClick={() => setModal({ tipo: "editar" })}>
            <Pencil className="h-4 w-4" /> Editar datos
          </button>
          <button className={btnPrimario} onClick={() => setModal({ tipo: "nuevoTurno" })}>
            <CalendarPlus className="h-4 w-4" /> Agendar turno
          </button>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sesiones realizadas" valor={String(realizadas)} />
        <StatCard label="Turnos totales" valor={String(historial.length)} />
        <StatCard label="Total abonado" valor={formatoMoneda(totalPagado)} />
        <StatCard label="Saldo pendiente" valor={formatoMoneda(saldo)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel-luxe space-y-3 rounded-xl p-6">
          <h2 className="font-display text-2xl">Datos personales</h2>
          <Detalle label="Nacimiento">
            {cliente.fechaNacimiento ? fechaLarga(cliente.fechaNacimiento) : "—"}
          </Detalle>
          <Detalle label="Última sesión">
            {ultima ? fechaLarga(ultima.fecha) : "Sin sesiones"}
          </Detalle>
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
              Observaciones generales del cliente
            </p>
            <p className="mt-2 text-sm text-foreground/90">{cliente.observaciones || "—"}</p>
          </div>
        </div>

        <div className="panel-luxe rounded-xl p-6 lg:col-span-2">
          <h2 className="font-display text-2xl">Historial de turnos</h2>
          <div className="mt-4 space-y-3">
            {historial.map((t) => (
              <button
                key={t.idTurno}
                onClick={() => setModal({ tipo: "turno", turnoId: t.idTurno })}
                className="block w-full rounded-md border border-border/60 px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] xl:items-center">
                  <div className="min-w-0">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                      Servicio
                    </p>
                    <p className="mt-1 text-sm text-foreground">{t.servicio}</p>
                  </div>
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                      Fecha y hora
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {nombreDia(t.fecha)} {fechaLarga(t.fecha)} · {t.hora}
                    </p>
                  </div>
                  <div className="sm:col-span-2 xl:col-span-1 xl:text-right">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                      Estado
                    </p>
                    <div className="mt-1 inline-flex">
                      <Badge tono={estadoTurnoTono[t.estado]}>
                        {t.estado === "ausente"
                          ? "No asistió"
                          : t.estado === "reservado"
                            ? "Reservado"
                            : t.estado === "realizado"
                              ? "Realizado"
                              : "Cancelado"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/40 pt-3">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                      Importe abonado
                    </p>
                    <p className="mt-1 text-sm text-foreground">{formatoMoneda(t.totalPagado)}</p>
                  </div>
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                      Precio total
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatoMoneda(t.precioAcordado)}
                    </p>
                  </div>
                </div>
                {t.observaciones ? (
                  <div className="mt-3 border-t border-status-success/30 pt-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-status-success">
                      Observaciones de la atención
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t.observaciones}
                    </p>
                  </div>
                ) : null}
              </button>
            ))}
            {!historial.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Todavía no tiene turnos registrados.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {modal?.tipo === "editar" ? (
        <ClienteFormModal
          cliente={cliente}
          clientesExistentes={clientes}
          onClose={() => setModal(null)}
          onGuardar={async (datos) => {
            setError(null);
            try {
              await editarCliente.mutateAsync({ id: cliente.id, datos });
              setModal(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo guardar el cliente");
            }
          }}
        />
      ) : null}

      {modal?.tipo === "nuevoTurno" ? (
        <NuevoTurnoModal
          fechaInicial={HOY}
          clienteInicial={cliente.id}
          onClose={() => setModal(null)}
        />
      ) : null}

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
    </div>
  );
}
