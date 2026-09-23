# Roadmap — Panel ROSHAN MASAJES

Sistema administrativo para un único usuario (Riki). Solo interfaz, datos ficticios.
Entidades fijas: Usuario, Cliente, Servicio, Turno, Pago, Atencion, Bloqueo_Horario.

## Hecho

- [x] Estados de turno diferenciados por color elegante (reservado/realizado/cancelado/ausente)
- [x] Modelo de datos ficticio con las 7 entidades definitivas
- [x] Sesión ficticia (usuario único) + pantalla de Login
- [x] Sidebar con Agenda, Clientes, Servicios, Pagos, Configuración, Cerrar sesión
- [x] Agenda: vista diaria y semanal, cambio de fecha, horarios libres, bloqueos
- [x] Agenda: modal de turno con detalle, pago, marcar realizado, cancelar
- [x] Nuevo turno con confirmación y control de disponibilidad
- [x] Bloqueo de horarios desde Agenda
- [x] Clientes: búsqueda, alta, edición, ficha con historial
- [x] Servicios: alta, edición, activar/desactivar (inactivos no se ofrecen en turnos)
- [x] Pagos: 4 tarjetas resumen + tabla de movimientos (tipo y medio definidos)
- [x] Tarjetas de gestión diaria en Agenda

## Hecho — alineación con la base real y los documentos de análisis

- [x] Servicio: se sacó `categoria` (no existe en la tabla `servicio` ni en los requerimientos)
- [x] Bloqueo de horario: se pasó de "rango + motivo" a franjas puntuales de 30 min
      (así se guarda en `bloqueo_horario`); la UI sigue mostrando rangos agrupando
      franjas consecutivas (`agruparBloqueos` en `store.tsx`)
- [x] Turno: se agregó `precioAcordado` (RF-20 / RN-06) — se fija al reservar y no
      se recalcula si cambia el precio del servicio. Ya replicado en la base real
      (`turno.precio_acordado`) y en el backend

## Pendiente (fuera de esta etapa)

- [ ] Conexión a API Flask + SQL Server (recién cuando la interfaz esté aprobada)
