// ============================================================================
// Tipos del dominio ROSHAN (reflejan el esquema real de SQL Server) y
// utilidades de fecha/hora/moneda usadas en toda la interfaz. Los datos en sí
// ya no viven acá — se piden a la API en tiempo real (ver src/lib/queries.ts).
// ============================================================================

export type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaNacimiento: string; // YYYY-MM-DD, "" si no tiene
  observaciones: string;
};

// Resumen que trae GET /api/clientes (evita pedir el historial de cada
// cliente por separado solo para mostrar estas dos columnas en el listado).
export type ClienteConResumen = Cliente & {
  sesionesRealizadas: number;
  ultimaSesion: string | null;
};

export type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  duracion: number; // minutos
  descripcion: string;
  activo: boolean;
};

export type EstadoTurno = "reservado" | "realizado" | "cancelado" | "ausente";

// El backend guarda los estados capitalizados en español (CHECK constraint).
export const ESTADO_API_A_UI: Record<string, EstadoTurno> = {
  Reservado: "reservado",
  Realizado: "realizado",
  Cancelado: "cancelado",
  "No asistió": "ausente",
};

export const ESTADO_UI_A_API: Record<EstadoTurno, string> = {
  reservado: "Reservado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  ausente: "No asistió",
};

// Fila tal como la entrega GET /api/turnos (agenda diaria/semanal): ya viene
// con nombre de cliente/servicio resueltos, no hace falta cruzarla con otros
// listados.
export type TurnoAgenda = {
  id: string;
  idCliente: string;
  cliente: string;
  telefono: string;
  servicio: string;
  duracion: number;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  estado: EstadoTurno;
  // RF-20 / RN-06: precio vigente al momento de reservar. No se recalcula
  // si más adelante cambia el precio del servicio.
  precioAcordado: number;
};

// Detalle puntual (GET /api/turnos/:id): agrega el id del servicio, útil
// para los modales que se abren fuera del contexto de la agenda.
export type TurnoDetalle = TurnoAgenda & {
  idServicio: string;
};

export type TipoPago = "Seña" | "Pago";
export type MedioPago = "Efectivo" | "Transferencia" | "Débito" | "Crédito";

export type Pago = {
  id: string;
  turnoId: string;
  cliente: string;
  servicio: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoPago;
  medio: MedioPago;
  monto: number;
};

// La tabla bloqueo_horario real guarda una franja puntual por fila
// (fecha + hora, sin motivo). Un bloqueo "de rango" en la UI se arma
// agrupando varias filas consecutivas — ver agruparBloqueos en store.tsx.
export type BloqueoHorario = {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
};

// ---------------------------------------------------------------------------
// Fechas y horarios de atención
// ---------------------------------------------------------------------------

export const HOY = new Date().toISOString().slice(0, 10);

export const HORAS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
];

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);

const toIso = (d: Date) => d.toISOString().slice(0, 10);

export const sumarDias = (iso: string, dias: number) => {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return toIso(d);
};

/** Lunes de la semana que contiene `iso`. */
export const inicioSemana = (iso: string) => {
  const d = toDate(iso);
  const dow = d.getUTCDay();
  return sumarDias(iso, dow === 0 ? -6 : 1 - dow);
};

/** Lunes a sábado de la semana de `iso`. */
export const semanaDe = (iso: string) => {
  const lunes = inicioSemana(iso);
  return Array.from({ length: 6 }, (_, i) => sumarDias(lunes, i));
};

export const nombreDia = (iso: string) => DIAS_SEMANA[toDate(iso).getUTCDay()];

export const fechaCorta = (iso: string) => {
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
};

export const fechaLarga = (iso: string) => {
  const d = toDate(iso);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const sumarMinutos = (hora: string, minutos: number) => {
  const [h = 0, m = 0] = hora.split(":").map(Number);
  const total = h * 60 + m + minutos;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/** Recorta "HH:MM:SS" (como llega un TIME de SQL Server) a "HH:MM". */
export const horaCorta = (hora: string) => hora.slice(0, 5);

export const formatoMoneda = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);
