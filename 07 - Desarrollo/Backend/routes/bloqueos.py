from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from database import get_connection
from routes.auth_middleware import login_requerido

atencion_bp = Blueprint("atencion", __name__)


# GET - Obtener la atención de un turno
@atencion_bp.route("/api/turnos/<int:id_turno>/atencion", methods=["GET"])
@login_requerido
def obtener_atencion(id_turno):

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                a.id_atencion,
                a.id_turno,
                a.observaciones,
                t.fecha,
                t.hora,
                c.nombre,
                c.apellido,
                s.nombre AS servicio
            FROM atencion a
            INNER JOIN turno t
                ON a.id_turno = t.id_turno
            INNER JOIN cliente c
                ON t.id_cliente = c.id_cliente
            INNER JOIN servicio s
                ON t.id_servicio = s.id_servicio
            WHERE a.id_turno = ?
        """, (id_turno,))

        fila = cursor.fetchone()

        if not fila:
            return jsonify({
                "ok": False,
                "mensaje": "Atención no encontrada"
            }), 404

        return jsonify({
            "id_atencion": fila.id_atencion,
            "id_turno": fila.id_turno,
            "cliente": f"{fila.nombre} {fila.apellido}",
            "servicio": fila.servicio,
            "fecha": str(fila.fecha),
            "hora": str(fila.hora),
            "observaciones": fila.observaciones
        })

    finally:
        cursor.close()
        connection.close()


# POST - Registrar atención
@atencion_bp.route("/api/turnos/<int:id_turno>/atencion", methods=["POST"])
@login_requerido
def crear_atencion(id_turno):

    datos = request.get_json()

    observaciones = datos.get("observaciones")

    connection = get_connection()
    try:
        cursor = connection.cursor()

        # Verificar turno
        cursor.execute("""
            SELECT id_turno, estado
            FROM turno
            WHERE id_turno = ?
        """, (id_turno,))

        turno = cursor.fetchone()

        if not turno:
            return jsonify({
                "ok": False,
                "mensaje": "Turno no encontrado"
            }), 404

        # No permitir atención de turnos cancelados o no asistidos
        if turno.estado in ("Cancelado", "No asistió"):
            return jsonify({
                "ok": False,
                "mensaje": "No se puede registrar una atención para un turno cancelado o no asistido"
            }), 400

        # Verificar que no exista una atención
        cursor.execute("""
            SELECT id_atencion
            FROM atencion
            WHERE id_turno = ?
        """, (id_turno,))

        if cursor.fetchone():
            return jsonify({
                "ok": False,
                "mensaje": "El turno ya tiene una atención registrada"
            }), 409

        # Crear atención y obtener su ID
        cursor.execute("""
            INSERT INTO atencion
            (
                id_turno,
                observaciones
            )
            OUTPUT INSERTED.id_atencion
            VALUES (?, ?)
        """, (
            id_turno,
            observaciones
        ))

        id_atencion = cursor.fetchone()[0]

        # Marcar turno como realizado
        cursor.execute("""
            UPDATE turno
            SET estado = 'Realizado'
            WHERE id_turno = ?
        """, (id_turno,))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Atención registrada correctamente",
            "id_atencion": int(id_atencion),
            "id_turno": id_turno,
            "estado_turno": "Realizado"
        }), 201

    finally:
        cursor.close()
        connection.close()


# PUT - Actualizar observaciones de una atención
@atencion_bp.route("/api/turnos/<int:id_turno>/atencion", methods=["PUT"])
@login_requerido
def actualizar_atencion(id_turno):

    datos = request.get_json()

    observaciones = datos.get("observaciones")

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_atencion
            FROM atencion
            WHERE id_turno = ?
        """, (id_turno,))

        atencion = cursor.fetchone()

        if not atencion:
            return jsonify({
                "ok": False,
                "mensaje": "Atención no encontrada"
            }), 404

        cursor.execute("""
            UPDATE atencion
            SET observaciones = ?
            WHERE id_turno = ?
        """, (
            observaciones,
            id_turno
        ))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Atención actualizada correctamente",
            "id_turno": id_turno
        })

    finally:
        cursor.close()
        connection.close()
bloqueos_bp = Blueprint("bloqueos", __name__)


# GET - Obtener todos los bloqueos
@bloqueos_bp.route("/api/bloqueos", methods=["GET"])
@login_requerido
def obtener_bloqueos():

    fecha = request.args.get("fecha")

    connection = get_connection()
    try:
        cursor = connection.cursor()

        if fecha:
            cursor.execute("""
                SELECT
                    id_bloqueo,
                    fecha,
                    hora
                FROM bloqueo_horario
                WHERE fecha = ?
                ORDER BY fecha, hora
            """, (fecha,))
        else:
            cursor.execute("""
                SELECT
                    id_bloqueo,
                    fecha,
                    hora
                FROM bloqueo_horario
                ORDER BY fecha, hora
            """)

        filas = cursor.fetchall()

        bloqueos = []

        for fila in filas:
            bloqueos.append({
                "id_bloqueo": fila.id_bloqueo,
                "fecha": str(fila.fecha),
                "hora": str(fila.hora)
            })

        return jsonify(bloqueos)

    finally:
        cursor.close()
        connection.close()


# POST - Crear bloqueo
@bloqueos_bp.route("/api/bloqueos", methods=["POST"])
@login_requerido
def crear_bloqueo():

    datos = request.get_json()

    fecha = datos.get("fecha")
    hora = datos.get("hora")

    if not fecha or not hora:
        return jsonify({
            "ok": False,
            "mensaje": "Fecha y hora son obligatorias"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        # Verificar si ya existe el bloqueo
        cursor.execute("""
            SELECT id_bloqueo
            FROM bloqueo_horario
            WHERE fecha = ?
              AND hora = ?
        """, (fecha, hora))

        if cursor.fetchone():
            return jsonify({
                "ok": False,
                "mensaje": "Ese horario ya está bloqueado"
            }), 409

        # Verificar si el horario está ocupado por un turno
        cursor.execute("""
            SELECT
                t.hora,
                s.duracion
            FROM turno t
            INNER JOIN servicio s
                ON t.id_servicio = s.id_servicio
            WHERE t.fecha = ?
              AND t.estado NOT IN ('Cancelado', 'No asistió')
        """, (fecha,))

        turnos_existentes = cursor.fetchall()

        try:
            hora_bloqueo = datetime.strptime(
                f"{fecha} {hora}",
                "%Y-%m-%d %H:%M"
            )
        except ValueError:
            return jsonify({
                "ok": False,
                "mensaje": "Fecha u hora inválida"
            }), 400

        # Verificar si el bloqueo cae dentro de algún turno
        for turno in turnos_existentes:

            inicio_turno = datetime.combine(
                hora_bloqueo.date(),
                turno.hora
            )

            fin_turno = inicio_turno + timedelta(
                minutes=turno.duracion
            )

            if inicio_turno <= hora_bloqueo < fin_turno:
                return jsonify({
                    "ok": False,
                    "mensaje": "No se puede bloquear un horario ocupado por un turno"
                }), 409

        # Crear bloqueo
        cursor.execute("""
            INSERT INTO bloqueo_horario
            (
                fecha,
                hora
            )
            OUTPUT INSERTED.id_bloqueo
            VALUES (?, ?)
        """, (fecha, hora))

        id_bloqueo = cursor.fetchone()[0]

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Horario bloqueado correctamente",
            "id_bloqueo": int(id_bloqueo)
        }), 201

    finally:
        cursor.close()
        connection.close()


# DELETE - Eliminar bloqueo
@bloqueos_bp.route("/api/bloqueos/<int:id_bloqueo>", methods=["DELETE"])
@login_requerido
def eliminar_bloqueo(id_bloqueo):

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_bloqueo
            FROM bloqueo_horario
            WHERE id_bloqueo = ?
        """, (id_bloqueo,))

        if not cursor.fetchone():
            return jsonify({
                "ok": False,
                "mensaje": "Bloqueo no encontrado"
            }), 404

        cursor.execute("""
            DELETE FROM bloqueo_horario
            WHERE id_bloqueo = ?
        """, (id_bloqueo,))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Bloqueo eliminado correctamente"
        })

    finally:
        cursor.close()
        connection.close()