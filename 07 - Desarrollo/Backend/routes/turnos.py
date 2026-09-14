from routes.auth_middleware import login_requerido
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
from database import get_connection

turnos_bp = Blueprint("turnos", __name__)

ESTADOS_VALIDOS = ["Reservado", "Realizado", "Cancelado", "No asistió"]
MARGEN_MINUTOS = 10  # RN-09: margen entre el fin de una atención y el próximo horario


def _rango(fecha, hora, duracion_minutos):
    inicio = datetime.strptime(f"{fecha} {hora}", "%Y-%m-%d %H:%M")
    fin = inicio + timedelta(minutes=duracion_minutos)
    return inicio, fin


def _turno_en_conflicto(cursor, fecha, hora, duracion, excluir_id_turno=None):
    """RF-10 / RNF-04: evita turnos superpuestos, respetando la duración
    del servicio y un margen de MARGEN_MINUTOS después de cada turno."""

    inicio_nuevo, fin_nuevo = _rango(fecha, hora, duracion)

    cursor.execute("""
        SELECT t.id_turno, t.hora, s.duracion
        FROM turno t
        INNER JOIN servicio s ON t.id_servicio = s.id_servicio
        WHERE t.fecha = ?
          AND t.estado <> 'Cancelado'
          AND t.id_turno <> ?
    """, (fecha, excluir_id_turno or 0))

    for fila in cursor.fetchall():
        inicio_existente = datetime.combine(inicio_nuevo.date(), fila.hora)
        fin_existente_con_margen = inicio_existente + timedelta(
            minutes=fila.duracion + MARGEN_MINUTOS
        )

        if inicio_nuevo < fin_existente_con_margen and inicio_existente < fin_nuevo:
            return True

    return False


def _horario_bloqueado(cursor, fecha, hora, duracion):
    """Verifica si algún bloqueo_horario cae dentro del rango del turno."""

    inicio_nuevo, fin_nuevo = _rango(fecha, hora, duracion)

    cursor.execute("""
        SELECT hora FROM bloqueo_horario WHERE fecha = ?
    """, (fecha,))

    for fila in cursor.fetchall():
        momento = datetime.combine(inicio_nuevo.date(), fila.hora)
        if inicio_nuevo <= momento < fin_nuevo:
            return True

    return False


@turnos_bp.route("/api/turnos", methods=["POST"])
@login_requerido
def crear_turno():

    datos = request.get_json()

    id_cliente = datos.get("id_cliente")
    id_servicio = datos.get("id_servicio")
    fecha = datos.get("fecha")
    hora = datos.get("hora")
    precio = datos.get("precio")

    if not id_cliente or not id_servicio or not fecha or not hora:
        return jsonify({
            "ok": False,
            "mensaje": "id_cliente, id_servicio, fecha y hora son obligatorios"
        }), 400

    try:
        fecha_hora_turno = datetime.strptime(f"{fecha} {hora}", "%Y-%m-%d %H:%M")
    except ValueError:
        return jsonify({
            "ok": False,
            "mensaje": "Formato de fecha u hora inválido (usar YYYY-MM-DD y HH:MM)"
        }), 400

    if fecha_hora_turno <= datetime.now():
        return jsonify({
            "ok": False,
            "mensaje": "El turno debe ser a futuro"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_cliente FROM cliente WHERE id_cliente = ?
        """, (id_cliente,))

        if not cursor.fetchone():
            return jsonify({
                "ok": False,
                "mensaje": "Cliente no encontrado"
            }), 404

        cursor.execute("""
            SELECT id_servicio, precio, duracion FROM servicio WHERE id_servicio = ?
        """, (id_servicio,))

        servicio = cursor.fetchone()

        if not servicio:
            return jsonify({
                "ok": False,
                "mensaje": "Servicio no encontrado"
            }), 404

        # RF-20 / RN-06: el precio acordado se fija al momento de reservar
        # y no vuelve a recalcularse si cambia el precio del servicio.
        precio_acordado = float(precio) if precio is not None else float(servicio.precio)

        if precio_acordado <= 0:
            return jsonify({
                "ok": False,
                "mensaje": "El precio acordado debe ser mayor a 0"
            }), 400

        if _turno_en_conflicto(cursor, fecha, hora, servicio.duracion):
            return jsonify({
                "ok": False,
                "mensaje": "Ese horario se superpone con otro turno"
            }), 409

        if _horario_bloqueado(cursor, fecha, hora, servicio.duracion):
            return jsonify({
                "ok": False,
                "mensaje": "Ese horario está bloqueado"
            }), 409

        cursor.execute("""
            INSERT INTO turno
                (id_cliente, id_servicio, fecha, hora, estado, precio_acordado)
            OUTPUT INSERTED.id_turno
            VALUES (?, ?, ?, ?, 'Reservado', ?)
        """, (id_cliente, id_servicio, fecha, hora, precio_acordado))

        nuevo_id = cursor.fetchone()[0]

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Turno reservado correctamente",
            "id_turno": nuevo_id,
            "precio_acordado": precio_acordado
        }), 201

    finally:
        cursor.close()
        connection.close()


@turnos_bp.route("/api/turnos/<int:id_turno>", methods=["GET"])
@login_requerido
def obtener_turno(id_turno):

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                t.id_turno,
                t.fecha,
                t.hora,
                t.estado,
                t.precio_acordado,
                c.id_cliente,
                c.nombre AS cliente_nombre,
                c.apellido AS cliente_apellido,
                c.telefono,
                s.id_servicio,
                s.nombre AS servicio,
                s.duracion
            FROM turno t
            INNER JOIN cliente c ON t.id_cliente = c.id_cliente
            INNER JOIN servicio s ON t.id_servicio = s.id_servicio
            WHERE t.id_turno = ?
        """, (id_turno,))

        fila = cursor.fetchone()

        if not fila:
            return jsonify({
                "ok": False,
                "mensaje": "Turno no encontrado"
            }), 404

        return jsonify({
            "id_turno": fila.id_turno,
            "fecha": str(fila.fecha),
            "hora": str(fila.hora),
            "estado": fila.estado,
            "precio_acordado": float(fila.precio_acordado),
            "id_cliente": fila.id_cliente,
            "cliente": f"{fila.cliente_nombre} {fila.cliente_apellido}",
            "telefono": fila.telefono,
            "id_servicio": fila.id_servicio,
            "servicio": fila.servicio,
            "duracion": fila.duracion
        })

    finally:
        cursor.close()
        connection.close()


@turnos_bp.route("/api/turnos/<int:id_turno>", methods=["PUT"])
@login_requerido
def reprogramar_turno(id_turno):
    """RF-11: modificar fecha/hora de un turno reservado, liberando el
    horario anterior y verificando disponibilidad en el nuevo."""

    datos = request.get_json()

    fecha = datos.get("fecha")
    hora = datos.get("hora")

    if not fecha or not hora:
        return jsonify({
            "ok": False,
            "mensaje": "fecha y hora son obligatorios"
        }), 400

    try:
        fecha_hora_turno = datetime.strptime(f"{fecha} {hora}", "%Y-%m-%d %H:%M")
    except ValueError:
        return jsonify({
            "ok": False,
            "mensaje": "Formato de fecha u hora inválido (usar YYYY-MM-DD y HH:MM)"
        }), 400

    if fecha_hora_turno <= datetime.now():
        return jsonify({
            "ok": False,
            "mensaje": "El turno debe ser a futuro"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT t.id_turno, t.estado, s.duracion
            FROM turno t
            INNER JOIN servicio s ON t.id_servicio = s.id_servicio
            WHERE t.id_turno = ?
        """, (id_turno,))

        turno = cursor.fetchone()

        if not turno:
            return jsonify({
                "ok": False,
                "mensaje": "Turno no encontrado"
            }), 404

        if turno.estado != "Reservado":
            return jsonify({
                "ok": False,
                "mensaje": "Solo se pueden reprogramar turnos en estado Reservado"
            }), 400

        if _turno_en_conflicto(cursor, fecha, hora, turno.duracion, excluir_id_turno=id_turno):
            return jsonify({
                "ok": False,
                "mensaje": "Ese horario se superpone con otro turno"
            }), 409

        if _horario_bloqueado(cursor, fecha, hora, turno.duracion):
            return jsonify({
                "ok": False,
                "mensaje": "Ese horario está bloqueado"
            }), 409

        cursor.execute("""
            UPDATE turno
            SET fecha = ?, hora = ?
            WHERE id_turno = ?
        """, (fecha, hora, id_turno))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Turno reprogramado correctamente",
            "id_turno": id_turno,
            "fecha": fecha,
            "hora": hora
        })

    finally:
        cursor.close()
        connection.close()


@turnos_bp.route("/api/turnos/<int:id_turno>/estado", methods=["PUT"])
@login_requerido
def cambiar_estado_turno(id_turno):

    datos = request.get_json()
    nuevo_estado = datos.get("estado")

    if nuevo_estado not in ESTADOS_VALIDOS:
        return jsonify({
            "ok": False,
            "mensaje": f"Estado inválido. Valores permitidos: {ESTADOS_VALIDOS}"
        }), 400

    if nuevo_estado == "Realizado":
        return jsonify({
            "ok": False,
            "mensaje": "Para marcar un turno como Realizado, registrá la atención en /api/turnos/<id>/atencion"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_turno, estado FROM turno WHERE id_turno = ?
        """, (id_turno,))

        turno = cursor.fetchone()

        if not turno:
            return jsonify({
                "ok": False,
                "mensaje": "Turno no encontrado"
            }), 404

        cursor.execute("""
            UPDATE turno
            SET estado = ?
            WHERE id_turno = ?
        """, (nuevo_estado, id_turno))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Estado actualizado correctamente",
            "id_turno": id_turno,
            "estado_anterior": turno.estado,
            "estado_nuevo": nuevo_estado
        })

    finally:
        cursor.close()
        connection.close()


@turnos_bp.route("/api/turnos", methods=["GET"])
@login_requerido
def listar_turnos():
    """RF-15 (tablero diario) con 'fecha', y RF-16 (agenda semanal)
    con 'desde' + 'hasta'."""

    fecha = request.args.get("fecha")
    desde = request.args.get("desde")
    hasta = request.args.get("hasta")

    if not fecha and not (desde and hasta):
        return jsonify({
            "ok": False,
            "mensaje": "Debe indicar 'fecha' (YYYY-MM-DD) o 'desde' y 'hasta'"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        sql = """
            SELECT
                t.id_turno,
                t.fecha,
                t.hora,
                t.estado,
                t.precio_acordado,
                c.id_cliente,
                c.nombre AS cliente_nombre,
                c.apellido AS cliente_apellido,
                c.telefono,
                s.nombre AS servicio,
                s.duracion
            FROM turno t
            INNER JOIN cliente c ON t.id_cliente = c.id_cliente
            INNER JOIN servicio s ON t.id_servicio = s.id_servicio
        """

        if fecha:
            sql += " WHERE t.fecha = ? "
            parametros = (fecha,)
        else:
            sql += " WHERE t.fecha BETWEEN ? AND ? "
            parametros = (desde, hasta)

        sql += " ORDER BY t.fecha, t.hora"

        cursor.execute(sql, parametros)

        filas = cursor.fetchall()

        turnos = [{
            "id_turno": fila.id_turno,
            "fecha": str(fila.fecha),
            "hora": str(fila.hora),
            "estado": fila.estado,
            "precio_acordado": float(fila.precio_acordado),
            "cliente": f"{fila.cliente_nombre} {fila.cliente_apellido}",
            "telefono": fila.telefono,
            "servicio": fila.servicio,
            "duracion": fila.duracion
        } for fila in filas]

        return jsonify({
            "ok": True,
            "cantidad": len(turnos),
            "turnos": turnos
        })

    finally:
        cursor.close()
        connection.close()
