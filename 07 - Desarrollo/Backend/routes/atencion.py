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