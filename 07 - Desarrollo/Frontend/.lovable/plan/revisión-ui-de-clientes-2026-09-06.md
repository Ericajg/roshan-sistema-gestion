# Revisión UI de Clientes

## Objetivo
Completar el listado, alta, edición, ficha e historial de Clientes usando exclusivamente los mocks actuales, conservando la identidad visual de ROSHAN y sin modificar otras secciones.

## Cambios

### 1. Listado de clientes
- Mantener las tres tarjetas superiores y ajustar la tercera etiqueta a **Clientes sin sesiones**.
- Conservar los cálculos actuales de clientes registrados y sesiones realizadas; considerar como sesión únicamente un turno con estado `realizado`.
- Cambiar el texto del buscador a **Buscar por nombre, apellido o teléfono** y limitar la búsqueda a esos tres datos.
- Reorganizar la tabla en: **Cliente, Contacto, Última sesión, Sesiones, Editar, Ficha**.
- Mostrar las observaciones generales debajo del nombre solo cuando existan.
- Calcular la última sesión a partir del turno `realizado` más reciente; mostrar **Sin sesiones** cuando no exista.
- Separar Editar y Ficha en columnas propias, manteniendo sus acciones actuales.
- En pantallas angostas, permitir desplazamiento horizontal de la tabla y conservar anchos mínimos para que nombres, datos y acciones no se corten ni se superpongan.

### 2. Nuevo cliente y Editar cliente
- Mantener exactamente los campos existentes: Nombre, Apellido, Teléfono, Email, Fecha de nacimiento y Observaciones.
- Marcar visualmente Nombre, Apellido y Teléfono como obligatorios y conservar la validación que impide guardar si están vacíos.
- Mantener los botones Cancelar y Guardar cliente, con una disposición adaptable para móvil.
- Ajustar las filas de dos columnas para que pasen a una sola columna en pantallas angostas.

### 3. Ficha del cliente
- Conservar encabezado, contacto y acciones **Editar datos** y **Agendar turno**, evitando desbordes en móvil.
- Mantener las cuatro tarjetas solicitadas y sus cálculos actuales: sesiones realizadas, turnos totales, total abonado y saldo pendiente.
- Mantener fecha de nacimiento, última sesión y observaciones generales dentro de Datos personales, rotulando explícitamente estas últimas como **Observaciones generales del cliente**.
- Hacer que las cuatro tarjetas y los bloques de información se distribuyan progresivamente según el ancho disponible.

### 4. Historial del cliente
- Presentar cada turno con Servicio, Fecha, Hora, Importe abonado, Precio total y Estado claramente identificados.
- Conservar el acceso al detalle del turno al seleccionar un registro.
- Separar visual y textualmente **Observaciones de la atención** de las observaciones generales del cliente; las primeras permanecerán asociadas a cada turno.
- Mostrar en esta sección el estado `ausente` como **No asistió**, sin cambiar etiquetas ni comportamiento fuera de Clientes.
- Mantener el orden cronológico descendente y adaptar cada registro para lectura clara en móvil y escritorio.

## Alcance técnico
- Cambios limitados a las dos pantallas de Clientes y, si hace falta, ajustes de presentación reutilizables que no alteren otras secciones.
- Sin API, persistencia, backend ni cambios en los datos mock.
- Sin cambios de paleta, tipografías, logo, menú lateral o navegación.
- Verificación final del listado, formulario, ficha e historial en escritorio y móvil, incluyendo alta, edición, búsqueda y apertura de ficha.
