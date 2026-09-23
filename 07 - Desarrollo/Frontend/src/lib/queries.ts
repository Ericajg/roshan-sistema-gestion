// Hooks de React Query que conectan cada pantalla a la API Flask real.
// Cada mutación invalida las queries que dependen de lo que cambió.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api } from "./api";
import {
  ESTADO_API_A_UI,
  ESTADO_UI_A_API,
  horaCorta,
  sumarMinutos,
  type BloqueoHorario,
  type Cliente,
  type ClienteConResumen,
  type EstadoTurno,
  type MedioPago,
  type Pago,
  type Servicio,
  type TipoPago,
  type TurnoAgenda,
  type TurnoDetalle,
} from "./mock-data";

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

type ClienteApi = {
  id_cliente: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
  fecha_nacimiento: string | null;
  observaciones: string | null;
};

const clienteDesdeApi = (c: ClienteApi): Cliente => ({
  id: String(c.id_cliente),
  nombre: c.nombre,
  apellido: c.apellido,
  telefono: c.telefono,
  email: c.email ?? "",
  fechaNacimiento: c.fecha_nacimiento ?? "",
  observaciones: c.observaciones ?? "",
});

type ClienteConResumenApi = ClienteApi & {
  sesiones_realizadas: number;
  ultima_sesion: string | null;
};

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () =>
      (await api.get<ClienteConResumenApi[]>("/api/clientes")).map((c): ClienteConResumen => ({
        ...clienteDesdeApi(c),
        sesionesRealizadas: c.sesiones_realizadas,
        ultimaSesion: c.ultima_sesion,
      })),
  });
}

export function useCliente(id: string | null) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: async () => clienteDesdeApi(await api.get<ClienteApi>(`/api/clientes/${id}`)),
    enabled: Boolean(id),
  });
}

export type HistorialItem = {
  idTurno: string;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  servicio: string;
  precioAcordado: number;
  duracion: number;
  totalPagado: number;
  saldoPendiente: number;
  observaciones: string | null;
};

type HistorialApi = {
  cliente: { id_cliente: number; nombre: string; apellido: string; telefono: string };
  historial: {
    id_turno: number;
    fecha: string;
    hora: string;
    estado: string;
    servicio: string;
    precio_acordado: number;
    duracion: number;
    total_pagado: number;
    saldo_pendiente: number;
    observaciones: string | null;
  }[];
};

export function useHistorialCliente(id: string) {
  return useQuery({
    queryKey: ["clientes", id, "historial"],
    queryFn: async () => {
      const datos = await api.get<HistorialApi>(`/api/clientes/${id}/historial`);
      return {
        historial: datos.historial.map((h): HistorialItem => ({
          idTurno: String(h.id_turno),
          fecha: h.fecha,
          hora: horaCorta(h.hora),
          estado: ESTADO_API_A_UI[h.estado] ?? "reservado",
          servicio: h.servicio,
          precioAcordado: h.precio_acordado,
          duracion: h.duracion,
          totalPagado: h.total_pagado,
          saldoPendiente: h.saldo_pendiente,
          observaciones: h.observaciones,
        })),
      };
    },
    enabled: Boolean(id),
  });
}

type ClienteFormData = Omit<Cliente, "id">;

const clienteHaciaApi = (datos: ClienteFormData) => ({
  nombre: datos.nombre,
  apellido: datos.apellido,
  telefono: datos.telefono,
  email: datos.email || null,
  fecha_nacimiento: datos.fechaNacimiento || null,
  observaciones: datos.observaciones || null,
});

export function useCrearCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: ClienteFormData) => api.post("/api/clientes", clienteHaciaApi(datos)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useEditarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ClienteFormData }) =>
      api.put(`/api/clientes/${id}`, clienteHaciaApi(datos)),
    onSuccess: (_datos, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes", variables.id] });
    },
  });
}

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

type ServicioApi = {
  id_servicio: number;
  nombre: string;
  precio: number;
  duracion: number;
  descripcion: string | null;
  estado: boolean;
};

const servicioDesdeApi = (s: ServicioApi): Servicio => ({
  id: String(s.id_servicio),
  nombre: s.nombre,
  precio: s.precio,
  duracion: s.duracion,
  descripcion: s.descripcion ?? "",
  activo: s.estado,
});

export function useServicios() {
  return useQuery({
    queryKey: ["servicios"],
    queryFn: async () => (await api.get<ServicioApi[]>("/api/servicios")).map(servicioDesdeApi),
  });
}

type ServicioFormData = Omit<Servicio, "id" | "activo">;

const servicioHaciaApi = (datos: ServicioFormData) => ({
  nombre: datos.nombre,
  precio: datos.precio,
  duracion: datos.duracion,
  descripcion: datos.descripcion || null,
});

export function useCrearServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: ServicioFormData) => api.post("/api/servicios", servicioHaciaApi(datos)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servicios"] }),
  });
}

export function useEditarServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ServicioFormData }) =>
      api.put(`/api/servicios/${id}`, servicioHaciaApi(datos)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servicios"] }),
  });
}

export function useAlternarServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      api.patch(`/api/servicios/${id}/estado`, { estado: !activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servicios"] }),
  });
}

// ---------------------------------------------------------------------------
// Turnos
// ---------------------------------------------------------------------------

type TurnoAgendaApi = {
  id_turno: number;
  fecha: string;
  hora: string;
  estado: string;
  precio_acordado: number;
  id_cliente: number;
  cliente: string;
  telefono: string;
  servicio: string;
  duracion: number;
};

const turnoAgendaDesdeApi = (t: TurnoAgendaApi): TurnoAgenda => ({
  id: String(t.id_turno),
  idCliente: String(t.id_cliente),
  cliente: t.cliente,
  telefono: t.telefono,
  servicio: t.servicio,
  duracion: t.duracion,
  fecha: t.fecha,
  hora: horaCorta(t.hora),
  estado: ESTADO_API_A_UI[t.estado] ?? "reservado",
  precioAcordado: t.precio_acordado,
});

/** Turnos de un rango fecha (usado por la agenda: la semana visible). */
export function useTurnosRango(desde: string, hasta: string) {
  return useQuery({
    queryKey: ["turnos", { desde, hasta }],
    queryFn: async () => {
      const datos = await api.get<{ turnos: TurnoAgendaApi[] }>(
        `/api/turnos?desde=${desde}&hasta=${hasta}`,
      );
      return datos.turnos.map(turnoAgendaDesdeApi);
    },
  });
}

/** Turnos de un único día (usado por el selector de horario del modal). */
export function useTurnosDia(fecha: string) {
  return useQuery({
    queryKey: ["turnos", { fecha }],
    queryFn: async () => {
      const datos = await api.get<{ turnos: TurnoAgendaApi[] }>(`/api/turnos?fecha=${fecha}`);
      return datos.turnos.map(turnoAgendaDesdeApi);
    },
    enabled: Boolean(fecha),
  });
}

type TurnoDetalleApi = TurnoAgendaApi & { id_servicio: number };

export function useTurno(id: string | null) {
  return useQuery({
    queryKey: ["turnos", "detalle", id],
    queryFn: async (): Promise<TurnoDetalle> => {
      const t = await api.get<TurnoDetalleApi>(`/api/turnos/${id}`);
      return { ...turnoAgendaDesdeApi(t), idServicio: String(t.id_servicio) };
    },
    enabled: Boolean(id),
  });
}

function invalidarTurnos(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["turnos"] });
}

export function useCrearTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: {
      idCliente: string;
      idServicio: string;
      fecha: string;
      hora: string;
      precio: number;
    }) =>
      api.post<{ id_turno: number }>("/api/turnos", {
        id_cliente: Number(datos.idCliente),
        id_servicio: Number(datos.idServicio),
        fecha: datos.fecha,
        hora: datos.hora,
        precio: datos.precio,
      }),
    onSuccess: () => invalidarTurnos(queryClient),
  });
}

export function useReprogramarTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fecha, hora }: { id: string; fecha: string; hora: string }) =>
      api.put(`/api/turnos/${id}`, { fecha, hora }),
    onSuccess: () => invalidarTurnos(queryClient),
  });
}

/** Cancelar o marcar ausente (Realizado va por useCrearAtencion). */
export function useCambiarEstadoTurno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: "cancelado" | "ausente" }) =>
      api.put(`/api/turnos/${id}/estado`, { estado: ESTADO_UI_A_API[estado] }),
    onSuccess: () => invalidarTurnos(queryClient),
  });
}

type AtencionApi = {
  id_atencion: number;
  id_turno: number;
  observaciones: string | null;
};

export function useAtencion(id: string | null, habilitado: boolean) {
  return useQuery({
    queryKey: ["turnos", id, "atencion"],
    queryFn: async () => {
      try {
        return await api.get<AtencionApi>(`/api/turnos/${id}/atencion`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: Boolean(id) && habilitado,
  });
}

export function useCrearAtencion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observaciones }: { id: string; observaciones: string }) =>
      api.post(`/api/turnos/${id}/atencion`, { observaciones }),
    onSuccess: (_datos, variables) => {
      invalidarTurnos(queryClient);
      queryClient.invalidateQueries({ queryKey: ["turnos", variables.id, "atencion"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

type PagoApi = {
  id_pago: number;
  id_turno: number;
  cliente: string;
  servicio: string;
  tipo_pago: TipoPago;
  medio_pago: MedioPago;
  fecha: string;
  monto: number;
};

const pagoDesdeApi = (p: PagoApi): Pago => ({
  id: String(p.id_pago),
  turnoId: String(p.id_turno),
  cliente: p.cliente,
  servicio: p.servicio,
  fecha: p.fecha,
  tipo: p.tipo_pago,
  medio: p.medio_pago,
  monto: p.monto,
});

export function usePagos() {
  return useQuery({
    queryKey: ["pagos"],
    queryFn: async () => (await api.get<PagoApi[]>("/api/pagos")).map(pagoDesdeApi),
  });
}

export function useCrearPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: {
      turnoId: string;
      fecha: string;
      tipo: TipoPago;
      medio: MedioPago;
      monto: number;
    }) =>
      api.post("/api/pagos", {
        id_turno: Number(datos.turnoId),
        tipo_pago: datos.tipo,
        medio_pago: datos.medio,
        fecha: datos.fecha,
        monto: datos.monto,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pagos"] }),
  });
}

// ---------------------------------------------------------------------------
// Bloqueos de horario
// ---------------------------------------------------------------------------

type BloqueoApi = { id_bloqueo: number; fecha: string; hora: string };

const bloqueoDesdeApi = (b: BloqueoApi): BloqueoHorario => ({
  id: String(b.id_bloqueo),
  fecha: b.fecha,
  hora: horaCorta(b.hora),
});

export function useBloqueos() {
  return useQuery({
    queryKey: ["bloqueos"],
    queryFn: async () => (await api.get<BloqueoApi[]>("/api/bloqueos")).map(bloqueoDesdeApi),
  });
}

export function useBloquearHorario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos: { fecha: string; horaInicio: string; minutos: number }) => {
      const cantidadFranjas = Math.max(1, Math.round(datos.minutos / 30));
      let hora = datos.horaInicio;
      for (let i = 0; i < cantidadFranjas; i += 1) {
        await api.post("/api/bloqueos", { fecha: datos.fecha, hora });
        hora = sumarMinutos(hora, 30);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bloqueos"] }),
  });
}

/** RF-17: bloquea de una vez todas las franjas libres de un día (deja
 * intactos los turnos ya reservados y las franjas ya bloqueadas). */
export function useBloquearDiaCompleto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fecha, horas }: { fecha: string; horas: string[] }) => {
      await Promise.all(
        horas.map((hora) => api.post("/api/bloqueos", { fecha, hora }).catch(() => null)),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bloqueos"] }),
  });
}

export function useQuitarBloqueo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const lista = Array.isArray(ids) ? ids : [ids];
      await Promise.all(lista.map((id) => api.delete(`/api/bloqueos/${id}`)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bloqueos"] }),
  });
}
