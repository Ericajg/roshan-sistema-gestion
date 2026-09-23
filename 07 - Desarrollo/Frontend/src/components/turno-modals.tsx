import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Ban,
  CalendarClock,
  CalendarPlus,
  Check,
  Lock,
  MessageCircle,
  UserRound,
  Wallet,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Campo,
  Detalle,
  Input,
  Select,
  Textarea,
  btnExito,
  btnFantasma,
  btnNeutro,
  btnPeligro,
  btnPrimario,
  type Tono,
} from "@/components/ui-kit";
import {
  HORAS,
  fechaLarga,
  formatoMoneda,
  nombreDia,
  sumarMinutos,
  type EstadoTurno,
} from "@/lib/mock-data";
import {
  MEDIOS_PAGO,
  TIPOS_PAGO,
  estadoCobro,
  franjasDeServicio,
  nombreCompleto,
  ocupacionDelDia,
  pagadoDeTurno,
} from "@/lib/store";
import {
  useAtencion,
  useBloqueos,
  useBloquearHorario,
  useCambiarEstadoTurno,
  useClientes,
  useCliente,
  useCrearAtencion,
  useCrearPago,
  useCrearTurno,
  usePagos,
  useReprogramarTurno,
  useServicios,
  useTurno,
  useTurnosDia,
} from "@/lib/queries";
import { linkWhatsApp, mensajeConfirmacionTurno } from "@/lib/whatsapp";

export const estadoTurnoTono: Record<EstadoTurno, Tono> = {
  reservado: "oro",
  realizado: "verde",
  cancelado: "rojo",
  ausente: "ambar",
};

export const estadoTurnoLabel: Record<EstadoTurno, string> = {
  reservado: "Reservado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  ausente: "Ausente",
};

const cobroTono = { cobrado: "verde", parcial: "ambar", pendiente: "rojo" } as const;
const cobroLabel = { cobrado: "Cobrado", parcial: "Parcial", pendiente: "Sin cobrar" } as const;

// ---------------------------------------------------------------------------
// Detalle de turno
// ---------------------------------------------------------------------------

export function TurnoDetalleModal({
  turnoId,
  onClose,
  onRegistrarPago,
}: {
  turnoId: string;
  onClose: () => void;
  onRegistrarPago: (turnoId: string) => void;
}) {
  const { data: turno } = useTurno(turnoId);
  const { data: cliente } = useCliente(turno?.idCliente ?? null);
  const { data: pagos = [] } = usePagos();
  const { data: atencion } = useAtencion(turnoId, turno?.estado === "realizado");
  const cambiarEstado = useCambiarEstadoTurno();
  const crearAtencion = useCrearAtencion();
  const reprogramarTurno = useReprogramarTurno();
  const navigate = useNavigate();

  const [confirmando, setConfirmando] = useState<null | "realizado" | "cancelado" | "ausente">(
    null,
  );
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [reprogramando, setReprogramando] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");

  const { data: turnosNuevaFecha = [] } = useTurnosDia(reprogramando ? nuevaFecha : "");
  const { data: bloqueosDisponibilidad = [] } = useBloqueos();

  if (!turno) {
    return (
      <Modal abierto titulo="Turno" onClose={onClose}>
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </Modal>
    );
  }

  const precio = turno.precioAcordado;
  const pagado = pagadoDeTurno(pagos, turno.id);
  const cobro = estadoCobro(precio, pagado);
  const pagosTurno = pagos.filter((p) => p.turnoId === turno.id);
  const activo = turno.estado === "reservado";

  const aplicar = async (estado: "realizado" | "cancelado" | "ausente") => {
    setError(null);
    setGuardando(true);
    try {
      if (estado === "realizado") {
        await crearAtencion.mutateAsync({ id: turno.id, observaciones });
      } else {
        await cambiarEstado.mutateAsync({ id: turno.id, estado });
      }
      setConfirmando(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el turno");
    } finally {
      setGuardando(false);
    }
  };

  const abrirReprogramar = () => {
    setNuevaFecha(turno.fecha);
    setNuevaHora(turno.hora);
    setError(null);
    setReprogramando(true);
  };

  const franjasNuevas = franjasDeServicio(turno.duracion);
  const ocupadosNuevaFecha = ocupacionDelDia(
    nuevaFecha,
    turnosNuevaFecha.filter((t) => t.id !== turno.id),
    bloqueosDisponibilidad,
  );
  const inicioNuevo = HORAS.indexOf(nuevaHora);
  const cabeNuevo = inicioNuevo >= 0 && inicioNuevo + franjasNuevas <= HORAS.length;
  const libreNuevo =
    cabeNuevo &&
    Array.from({ length: franjasNuevas }, (_, i) => inicioNuevo + i).every(
      (i) => !ocupadosNuevaFecha.has(i),
    );
  const cambioTrivial = nuevaFecha === turno.fecha && nuevaHora === turno.hora;

  const confirmarReprogramar = async () => {
    setError(null);
    setGuardando(true);
    try {
      await reprogramarTurno.mutateAsync({ id: turno.id, fecha: nuevaFecha, hora: nuevaHora });
      setReprogramando(false);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo reprogramar el turno");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      eyebrow={`${nombreDia(turno.fecha)} · ${fechaLarga(turno.fecha)}`}
      titulo={turno.cliente}
      onClose={onClose}
      footer={
        confirmando || reprogramando ? (
          reprogramando ? (
            <>
              <button
                className={btnNeutro}
                onClick={() => setReprogramando(false)}
                disabled={guardando}
              >
                Volver
              </button>
              <button
                className={btnPrimario}
                disabled={!libreNuevo || cambioTrivial || guardando}
                onClick={() => void confirmarReprogramar()}
              >
                <CalendarClock className="h-4 w-4" />
                {guardando ? "Guardando…" : "Confirmar nuevo horario"}
              </button>
            </>
          ) : null
        ) : (
          <>
            <button
              className={btnNeutro}
              onClick={() => {
                onClose();
                navigate({ to: "/clientes/$clienteId", params: { clienteId: turno.idCliente } });
              }}
            >
              <UserRound className="h-4 w-4" /> Ver ficha
            </button>
            {turno.estado !== "cancelado" && cobro !== "cobrado" ? (
              <button
                className={btnFantasma}
                onClick={() => {
                  onClose();
                  onRegistrarPago(turno.id);
                }}
              >
                <Wallet className="h-4 w-4" /> Registrar pago
              </button>
            ) : null}
            <a
              className={btnFantasma}
              href={linkWhatsApp(turno.telefono, mensajeConfirmacionTurno(turno))}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            {activo ? (
              <>
                <button className={btnNeutro} onClick={abrirReprogramar}>
                  <CalendarClock className="h-4 w-4" /> Reprogramar
                </button>
                <button className={btnPeligro} onClick={() => setConfirmando("cancelado")}>
                  <Ban className="h-4 w-4" /> Cancelar turno
                </button>
                <button className={btnNeutro} onClick={() => setConfirmando("ausente")}>
                  Marcar ausente
                </button>
                <button className={btnExito} onClick={() => setConfirmando("realizado")}>
                  <Check className="h-4 w-4" /> Marcar realizado
                </button>
              </>
            ) : null}
          </>
        )
      }
    >
      {confirmando ? (
        <ConfirmacionEstado
          estado={confirmando}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          error={error}
          guardando={guardando}
          onCancelar={() => setConfirmando(null)}
          onConfirmar={() => void aplicar(confirmando)}
        />
      ) : reprogramando ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Elegí la nueva fecha y hora. El horario actual ({turno.hora} –{" "}
            {sumarMinutos(turno.hora, turno.duracion)} del {fechaLarga(turno.fecha)}) queda
            disponible.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Fecha">
              <Input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />
            </Campo>
            <Campo label="Hora de inicio">
              <Select value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)}>
                {HORAS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </Campo>
          </div>

          {cambioTrivial ? (
            <p className="text-xs text-muted-foreground">Elegí una fecha u hora distinta.</p>
          ) : !libreNuevo ? (
            <p className="rounded-md border border-status-danger/50 bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
              {cabeNuevo
                ? "Ese horario ya está ocupado o bloqueado. Elegí otro."
                : "La sesión no entra dentro del horario de atención."}
            </p>
          ) : (
            <p className="text-xs text-status-success">
              Horario disponible ({nuevaHora} – {sumarMinutos(nuevaHora, turno.duracion)}).
            </p>
          )}

          {error ? <p className="text-xs text-status-danger">{error}</p> : null}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge tono={estadoTurnoTono[turno.estado]}>{estadoTurnoLabel[turno.estado]}</Badge>
            <Badge tono={cobroTono[cobro]}>{cobroLabel[cobro]}</Badge>
          </div>

          <div className="space-y-2">
            <Detalle label="Servicio">{turno.servicio}</Detalle>
            <Detalle label="Horario">
              {turno.hora} – {sumarMinutos(turno.hora, turno.duracion)}
            </Detalle>
            <Detalle label="Duración">{turno.duracion} min</Detalle>
            <Detalle label="Teléfono">{turno.telefono}</Detalle>
            <Detalle label="Precio">{formatoMoneda(precio)}</Detalle>
            <Detalle label="Pagado">{formatoMoneda(pagado)}</Detalle>
            <Detalle label="Saldo">
              <span className={precio - pagado > 0 ? "text-status-warning" : "text-status-success"}>
                {formatoMoneda(Math.max(0, precio - pagado))}
              </span>
            </Detalle>
          </div>

          {pagosTurno.length ? (
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
                Pagos del turno
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {pagosTurno.map((p) => (
                  <li key={p.id} className="flex justify-between gap-4 text-muted-foreground">
                    <span>
                      {p.tipo} · {p.medio}
                    </span>
                    <span className="text-foreground">{formatoMoneda(p.monto)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {cliente?.observaciones ? (
            <div className="rounded-md border border-border/60 px-4 py-3">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
                Preferencias del cliente
              </p>
              <p className="mt-1 text-sm text-foreground/90">{cliente.observaciones}</p>
            </div>
          ) : null}

          {atencion ? (
            <div className="rounded-md border border-status-success/40 bg-status-success/5 px-4 py-3">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-status-success">
                Atención registrada
              </p>
              <p className="mt-1 text-sm text-foreground/90">
                {atencion.observaciones || "Sesión realizada sin observaciones."}
              </p>
            </div>
          ) : null}
        </>
      )}
    </Modal>
  );
}

function ConfirmacionEstado({
  estado,
  observaciones,
  setObservaciones,
  error,
  guardando,
  onCancelar,
  onConfirmar,
}: {
  estado: "realizado" | "cancelado" | "ausente";
  observaciones: string;
  setObservaciones: (v: string) => void;
  error: string | null;
  guardando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const textos = {
    realizado: {
      titulo: "¿Confirmás que la sesión fue realizada?",
      detalle: "Se registrará la atención con la fecha del turno.",
      boton: "Sí, fue realizada",
      clase: btnExito,
    },
    cancelado: {
      titulo: "¿Cancelar este turno?",
      detalle: "El horario vuelve a quedar disponible en la agenda.",
      boton: "Sí, cancelar turno",
      clase: btnPeligro,
    },
    ausente: {
      titulo: "¿Marcar al cliente como ausente?",
      detalle: "Queda registrado que no se presentó a la sesión.",
      boton: "Sí, no se presentó",
      clase: btnNeutro,
    },
  }[estado];

  return (
    <div className="space-y-4">
      <p className="font-display text-xl">{textos.titulo}</p>
      <p className="text-sm text-muted-foreground">{textos.detalle}</p>

      {estado === "realizado" ? (
        <Campo label="Observaciones de la atención">
          <Textarea
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Zonas trabajadas, sugerencias, próxima sesión…"
          />
        </Campo>
      ) : null}

      {error ? <p className="text-xs text-status-danger">{error}</p> : null}

      <div className="flex justify-end gap-3">
        <button className={btnNeutro} onClick={onCancelar} disabled={guardando}>
          Volver
        </button>
        <button className={textos.clase} onClick={onConfirmar} disabled={guardando}>
          {guardando ? "Guardando…" : textos.boton}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nuevo turno
// ---------------------------------------------------------------------------

export function NuevoTurnoModal({
  fechaInicial,
  horaInicial,
  clienteInicial,
  onClose,
}: {
  fechaInicial: string;
  horaInicial?: string | undefined;
  clienteInicial?: string | undefined;
  onClose: () => void;
}) {
  const { data: clientes = [] } = useClientes();
  const { data: servicios = [] } = useServicios();
  const activos = servicios.filter((s) => s.activo);

  const [clienteId, setClienteId] = useState<string>(clienteInicial ?? "");
  const [servicioId, setServicioId] = useState<string>("");
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState(horaInicial ?? HORAS[0]!);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [creado, setCreado] = useState<{
    cliente: string;
    servicio: string;
    fecha: string;
    hora: string;
    telefono: string;
  } | null>(null);

  const clienteIdEfectivo = clienteId || clientes[0]?.id || "";
  const servicioIdEfectivo = servicioId || activos[0]?.id || "";

  const servicio = activos.find((s) => s.id === servicioIdEfectivo);
  const cliente = clientes.find((c) => c.id === clienteIdEfectivo);
  const franjas = franjasDeServicio(servicio?.duracion ?? 60);

  const { data: turnosDia = [] } = useTurnosDia(fecha);
  const { data: bloqueos = [] } = useBloqueos();

  const ocupados = useMemo(
    () => ocupacionDelDia(fecha, turnosDia, bloqueos),
    [fecha, turnosDia, bloqueos],
  );

  const crearTurno = useCrearTurno();

  const inicio = HORAS.indexOf(hora);
  const cabe = inicio >= 0 && inicio + franjas <= HORAS.length;
  const libre =
    cabe && Array.from({ length: franjas }, (_, i) => inicio + i).every((i) => !ocupados.has(i));
  const puede = Boolean(clienteIdEfectivo && servicioIdEfectivo && libre);

  const guardar = async () => {
    if (!servicio || !cliente) return;
    setError(null);
    setGuardando(true);
    try {
      // RF-20 / RN-06: el precio se fija al momento de reservar.
      await crearTurno.mutateAsync({
        idCliente: clienteIdEfectivo,
        idServicio: servicioIdEfectivo,
        fecha,
        hora,
        precio: servicio.precio,
      });
      setCreado({
        cliente: nombreCompleto(cliente),
        servicio: servicio.nombre,
        fecha,
        hora,
        telefono: cliente.telefono,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo reservar el turno");
      setConfirmar(false);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      eyebrow="Agenda"
      titulo={creado ? "Turno reservado" : confirmar ? "Confirmar turno" : "Nuevo turno"}
      onClose={onClose}
      footer={
        creado ? (
          <>
            <a
              className={btnFantasma}
              href={linkWhatsApp(creado.telefono, mensajeConfirmacionTurno(creado))}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" /> Avisar por WhatsApp
            </a>
            <button className={btnPrimario} onClick={onClose}>
              <Check className="h-4 w-4" /> Listo
            </button>
          </>
        ) : confirmar ? (
          <>
            <button className={btnNeutro} onClick={() => setConfirmar(false)} disabled={guardando}>
              Volver
            </button>
            <button className={btnPrimario} onClick={() => void guardar()} disabled={guardando}>
              <Check className="h-4 w-4" /> {guardando ? "Guardando…" : "Confirmar turno"}
            </button>
          </>
        ) : (
          <>
            <button className={btnNeutro} onClick={onClose}>
              Cancelar
            </button>
            <button className={btnPrimario} disabled={!puede} onClick={() => setConfirmar(true)}>
              <CalendarPlus className="h-4 w-4" /> Continuar
            </button>
          </>
        )
      }
    >
      {creado ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            El turno de {creado.cliente} quedó reservado para el {fechaLarga(creado.fecha)} a las{" "}
            {creado.hora} hs. ¿Le avisamos por WhatsApp?
          </p>
        </div>
      ) : confirmar ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Revisá los datos antes de agendar la sesión.
          </p>
          <Detalle label="Cliente">{cliente ? nombreCompleto(cliente) : "—"}</Detalle>
          <Detalle label="Servicio">{servicio?.nombre ?? "—"}</Detalle>
          <Detalle label="Fecha">{`${nombreDia(fecha)} · ${fechaLarga(fecha)}`}</Detalle>
          <Detalle label="Horario">
            {hora} – {sumarMinutos(hora, servicio?.duracion ?? 60)}
          </Detalle>
          <Detalle label="Precio">{formatoMoneda(servicio?.precio ?? 0)}</Detalle>
          {error ? <p className="text-xs text-status-danger">{error}</p> : null}
        </div>
      ) : (
        <>
          <Campo label="Cliente">
            <Select value={clienteIdEfectivo} onChange={(e) => setClienteId(e.target.value)}>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {nombreCompleto(c)}
                </option>
              ))}
            </Select>
          </Campo>

          <Campo label="Servicio" hint="Solo se listan los servicios activos.">
            <Select value={servicioIdEfectivo} onChange={(e) => setServicioId(e.target.value)}>
              {activos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {s.duracion} min · {formatoMoneda(s.precio)}
                </option>
              ))}
            </Select>
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Campo>
            <Campo label="Hora de inicio">
              <Select value={hora} onChange={(e) => setHora(e.target.value)}>
                {HORAS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </Campo>
          </div>

          {!libre ? (
            <p className="rounded-md border border-status-danger/50 bg-status-danger/10 px-3 py-2 text-xs text-status-danger">
              {cabe
                ? "Ese horario ya está ocupado o bloqueado. Elegí otro."
                : "La sesión no entra dentro del horario de atención."}
            </p>
          ) : (
            <p className="text-xs text-status-success">
              Horario disponible ({hora} – {sumarMinutos(hora, servicio?.duracion ?? 60)}).
            </p>
          )}
        </>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Registrar pago
// ---------------------------------------------------------------------------

export function PagoModal({ turnoId, onClose }: { turnoId: string; onClose: () => void }) {
  const { data: turno } = useTurno(turnoId);
  const { data: pagos = [] } = usePagos();
  const crearPago = useCrearPago();

  const precio = turno?.precioAcordado ?? 0;
  const pagado = pagadoDeTurno(pagos, turnoId);
  const saldo = Math.max(0, precio - pagado);

  const [tipo, setTipo] = useState<(typeof TIPOS_PAGO)[number]>(pagado > 0 ? "Pago" : "Seña");
  const [medio, setMedio] = useState<(typeof MEDIOS_PAGO)[number]>("Efectivo");
  const [monto, setMonto] = useState(String(saldo));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  if (!turno) {
    return (
      <Modal abierto titulo="Registrar pago" onClose={onClose}>
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </Modal>
    );
  }

  const valor = Number(monto) || 0;

  const guardar = async () => {
    setError(null);
    setGuardando(true);
    try {
      await crearPago.mutateAsync({
        turnoId: turno.id,
        fecha: turno.fecha,
        tipo,
        medio,
        monto: valor,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el pago");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      eyebrow="Pagos"
      titulo="Registrar pago"
      onClose={onClose}
      footer={
        <>
          <button className={btnNeutro} onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button
            className={btnPrimario}
            disabled={valor <= 0 || guardando}
            onClick={() => void guardar()}
          >
            <Wallet className="h-4 w-4" /> {guardando ? "Guardando…" : "Registrar"}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        <Detalle label="Cliente">{turno.cliente}</Detalle>
        <Detalle label="Servicio">{turno.servicio}</Detalle>
        <Detalle label="Precio">{formatoMoneda(precio)}</Detalle>
        <Detalle label="Saldo pendiente">{formatoMoneda(saldo)}</Detalle>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Tipo">
          <Select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as (typeof TIPOS_PAGO)[number])}
          >
            {TIPOS_PAGO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Medio de pago">
          <Select
            value={medio}
            onChange={(e) => setMedio(e.target.value as (typeof MEDIOS_PAGO)[number])}
          >
            {MEDIOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <Campo label="Monto">
        <Input
          type="number"
          min={0}
          step={500}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
      </Campo>

      {error ? <p className="text-xs text-status-danger">{error}</p> : null}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Horario libre → crear turno o bloquear
// ---------------------------------------------------------------------------

export function SlotLibreModal({
  fecha,
  hora,
  onCrearTurno,
  onBloquear,
  onClose,
}: {
  fecha: string;
  hora: string;
  onCrearTurno: () => void;
  onBloquear: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      abierto
      ancho="max-w-md"
      eyebrow={`${nombreDia(fecha)} · ${fechaLarga(fecha)}`}
      titulo={`Horario libre ${hora}`}
      onClose={onClose}
    >
      <p className="text-sm text-muted-foreground">¿Qué querés hacer con esta franja?</p>
      <div className="grid gap-3">
        <button className={btnPrimario} onClick={onCrearTurno}>
          <CalendarPlus className="h-4 w-4" /> Agendar un turno
        </button>
        <button className={btnNeutro} onClick={onBloquear}>
          <Lock className="h-4 w-4" /> Bloquear el horario
        </button>
      </div>
    </Modal>
  );
}

export function BloqueoModal({
  fecha,
  hora,
  onClose,
}: {
  fecha: string;
  hora: string;
  onClose: () => void;
}) {
  const bloquearHorario = useBloquearHorario();
  const [minutos, setMinutos] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setError(null);
    setGuardando(true);
    try {
      await bloquearHorario.mutateAsync({ fecha, horaInicio: hora, minutos });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo bloquear el horario");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      ancho="max-w-md"
      eyebrow={`${nombreDia(fecha)} · ${fechaLarga(fecha)}`}
      titulo="Bloquear horario"
      onClose={onClose}
      footer={
        <>
          <button className={btnNeutro} onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button className={btnPrimario} onClick={() => void guardar()} disabled={guardando}>
            <Lock className="h-4 w-4" /> {guardando ? "Bloqueando…" : "Bloquear"}
          </button>
        </>
      }
    >
      <Detalle label="Desde">{hora}</Detalle>
      <Campo label="Duración">
        <Select value={minutos} onChange={(e) => setMinutos(Number(e.target.value))}>
          <option value={30}>30 minutos</option>
          <option value={60}>1 hora</option>
          <option value={90}>1 hora 30</option>
          <option value={120}>2 horas</option>
        </Select>
      </Campo>
      {error ? <p className="text-xs text-status-danger">{error}</p> : null}
    </Modal>
  );
}
