from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from database import get_connection
from routes.auth_middleware import login_requerido

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
                WHERE fecha = %s
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
            WHERE fecha = %s
              AND hora = %s
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
            WHERE t.fecha = %s
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
            VALUES (%s, %s)
            RETURNING id_bloqueo
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
            WHERE id_bloqueo = %s
        """, (id_bloqueo,))

        if not cursor.fetchone():
            return jsonify({
                "ok": False,
                "mensaje": "Bloqueo no encontrado"
            }), 404

        cursor.execute("""
            DELETE FROM bloqueo_horario
            WHERE id_bloqueo = %s
        """, (id_bloqueo,))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Bloqueo eliminado correctamente"
        })

    finally:
        cursor.close()
        connection.close()
