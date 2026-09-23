// Funciones puras compartidas por varias pantallas. Los datos ya no viven acá
// (ver src/lib/queries.ts) — esto son solo derivaciones sobre lo que cada
// pantalla obtiene de la API.

import {
  HORAS,
  sumarMinutos,
  type BloqueoHorario,
  type Cliente,
  type Pago,
  type TurnoAgenda,
} from "./mock-data";

export type EstadoCobro = "cobrado" | "parcial" | "pendiente";

export const nombreCompleto = (c: Cliente) => `${c.nombre} ${c.apellido}`;

export const iniciales = (c: Cliente) => `${c.nombre[0] ?? ""}${c.apellido[0] ?? ""}`;

/** Ignora may/min y acentos, para comparar "María" con "maria", etc. */
export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const soloDigitos = (s: string) => s.replace(/\D/g, "");

/** RF-02 / RN-02: coincidencias por nombre+apellido o teléfono, para avisar
 * antes de cargar un cliente que podría ya estar registrado. */
export function posiblesDuplicados(
  datos: { nombre: string; apellido: string; telefono: string },
  clientes: Cliente[],
  excluirId?: string,
) {
  const nombreCompletoNuevo = normalizar(`${datos.nombre} ${datos.apellido}`);
  const telefonoNuevo = soloDigitos(datos.telefono);

  return clientes.filter((c) => {
    if (c.id === excluirId) return false;
    const mismoNombre =
      nombreCompletoNuevo.length > 2 &&
      normalizar(`${c.nombre} ${c.apellido}`) === nombreCompletoNuevo;
    const mismoTelefono = telefonoNuevo.length > 5 && soloDigitos(c.telefono) === telefonoNuevo;
    return mismoNombre || mismoTelefono;
  });
}

export const pagadoDeTurno = (pagos: Pago[], turnoId: string) =>
  pagos.filter((p) => p.turnoId === turnoId).reduce((a, p) => a + p.monto, 0);

export const estadoCobro = (precio: number, pagado: number): EstadoCobro => {
  if (pagado >= precio && precio > 0) return "cobrado";
  if (pagado > 0) return "parcial";
  return "pendiente";
};

export const franjasDeServicio = (duracion: number) => Math.max(1, Math.round(duracion / 30));

/** Índices de HORAS ocupados en un día por turnos activos y bloqueos. */
export function ocupacionDelDia(fecha: string, turnos: TurnoAgenda[], bloqueos: BloqueoHorario[]) {
  const ocupados = new Set<number>();

  turnos
    .filter((t) => t.fecha === fecha && t.estado !== "cancelado")
    .forEach((t) => {
      const franjas = franjasDeServicio(t.duracion);
      const inicio = HORAS.indexOf(t.hora);
      for (let i = 0; i < franjas; i += 1) ocupados.add(inicio + i);
    });

  bloqueos
    .filter((b) => b.fecha === fecha)
    .forEach((b) => {
      const idx = HORAS.indexOf(b.hora);
      if (idx >= 0) ocupados.add(idx);
    });

  return ocupados;
}

// ---------------------------------------------------------------------------
// Bloqueos: agrupar franjas puntuales consecutivas en un rango visual
// ---------------------------------------------------------------------------

export type BloqueoGrupo = {
  ids: string[];
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

export function agruparBloqueos(bloqueos: BloqueoHorario[]): BloqueoGrupo[] {
  const porDia = new Map<string, BloqueoHorario[]>();

  bloqueos.forEach((b) => {
    const lista = porDia.get(b.fecha) ?? [];
    lista.push(b);
    porDia.set(b.fecha, lista);
  });

  const grupos: BloqueoGrupo[] = [];

  porDia.forEach((lista, fecha) => {
    const ordenados = [...lista].sort((a, b) => a.hora.localeCompare(b.hora));
    let actual: BloqueoGrupo | null = null;

    ordenados.forEach((b) => {
      if (actual && actual.horaFin === b.hora) {
        actual.horaFin = sumarMinutos(b.hora, 30);
        actual.ids.push(b.id);
      } else {
        if (actual) grupos.push(actual);
        actual = { ids: [b.id], fecha, horaInicio: b.hora, horaFin: sumarMinutos(b.hora, 30) };
      }
    });

    if (actual) grupos.push(actual);
  });

  return grupos;
}

export type MedioPagoOpcion = Pago["medio"];
export type TipoPagoOpcion = Pago["tipo"];

export const MEDIOS_PAGO: Pago["medio"][] = ["Efectivo", "Transferencia", "Débito", "Crédito"];
export const TIPOS_PAGO: Pago["tipo"][] = ["Seña", "Pago"];
