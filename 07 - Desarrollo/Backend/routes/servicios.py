from flask import Blueprint, jsonify, request
from database import get_connection
from routes.auth_middleware import login_requerido

servicios_bp = Blueprint("servicios", __name__)


# GET - Obtener servicios
@servicios_bp.route("/api/servicios", methods=["GET"])
@login_requerido
def obtener_servicios():

    activos = request.args.get("activos")

    connection = get_connection()
    try:
        cursor = connection.cursor()

        if activos == "true":
            cursor.execute("""
                SELECT
                    id_servicio,
                    nombre,
                    precio,
                    duracion,
                    descripcion,
                    estado
                FROM servicio
                WHERE estado = 1
                ORDER BY nombre
            """)
        else:
            cursor.execute("""
                SELECT
                    id_servicio,
                    nombre,
                    precio,
                    duracion,
                    descripcion,
                    estado
                FROM servicio
                ORDER BY nombre
            """)

        filas = cursor.fetchall()

        servicios = []

        for fila in filas:
            servicios.append({
                "id_servicio": fila.id_servicio,
                "nombre": fila.nombre,
                "precio": float(fila.precio),
                "duracion": fila.duracion,
                "descripcion": fila.descripcion,
                "estado": bool(fila.estado)
            })

        return jsonify(servicios)

    finally:
        cursor.close()
        connection.close()


# GET - Obtener un servicio por ID
@servicios_bp.route("/api/servicios/<int:id_servicio>", methods=["GET"])
@login_requerido
def obtener_servicio(id_servicio):

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id_servicio,
                nombre,
                precio,
                duracion,
                descripcion,
                estado
            FROM servicio
            WHERE id_servicio = ?
        """, (id_servicio,))

        fila = cursor.fetchone()

        if not fila:
            return jsonify({
                "ok": False,
                "mensaje": "Servicio no encontrado"
            }), 404

        servicio = {
            "id_servicio": fila.id_servicio,
            "nombre": fila.nombre,
            "precio": float(fila.precio),
            "duracion": fila.duracion,
            "descripcion": fila.descripcion,
            "estado": bool(fila.estado)
        }

        return jsonify(servicio)

    finally:
        cursor.close()
        connection.close()


# POST - Crear servicio
@servicios_bp.route("/api/servicios", methods=["POST"])
@login_requerido
def crear_servicio():

    datos = request.get_json()

    nombre = datos.get("nombre")
    precio = datos.get("precio")
    duracion = datos.get("duracion")
    descripcion = datos.get("descripcion")

    if not nombre or precio is None or duracion is None:
        return jsonify({
            "ok": False,
            "mensaje": "Nombre, precio y duración son obligatorios"
        }), 400

    if precio <= 0 or duracion <= 0:
        return jsonify({
            "ok": False,
            "mensaje": "El precio y la duración deben ser mayores a 0"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        # Verificar que no exista otro servicio con el mismo nombre
        cursor.execute("""
            SELECT id_servicio
            FROM servicio
            WHERE nombre COLLATE Modern_Spanish_CI_AI = ?
        """, (nombre,))

        servicio_existente = cursor.fetchone()

        if servicio_existente:
            return jsonify({
                "ok": False,
                "mensaje": "Ya existe un servicio con ese nombre"
            }), 409

        cursor.execute("""
            INSERT INTO servicio
            (
                nombre,
                precio,
                duracion,
                descripcion
            )
            VALUES (?, ?, ?, ?)
        """, (
            nombre,
            precio,
            duracion,
            descripcion
        ))

        id_servicio = cursor.execute(
            "SELECT SCOPE_IDENTITY()"
        ).fetchone()[0]

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Servicio creado correctamente",
            "id_servicio": int(id_servicio)
        }), 201

    finally:
        cursor.close()
        connection.close()


# PUT - Actualizar servicio
@servicios_bp.route("/api/servicios/<int:id_servicio>", methods=["PUT"])
@login_requerido
def actualizar_servicio(id_servicio):

    datos = request.get_json()

    nombre = datos.get("nombre")
    precio = datos.get("precio")
    duracion = datos.get("duracion")
    descripcion = datos.get("descripcion")

    if not nombre or precio is None or duracion is None:
        return jsonify({
            "ok": False,
            "mensaje": "Nombre, precio y duración son obligatorios"
        }), 400

    if precio <= 0 or duracion <= 0:
        return jsonify({
            "ok": False,
            "mensaje": "El precio y la duración deben ser mayores a 0"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_servicio
            FROM servicio
            WHERE id_servicio = ?
        """, (id_servicio,))

        servicio = cursor.fetchone()

        if not servicio:
            return jsonify({
                "ok": False,
                "mensaje": "Servicio no encontrado"
            }), 404

        cursor.execute("""
            SELECT id_servicio
            FROM servicio
            WHERE nombre COLLATE Modern_Spanish_CI_AI = ?
              AND id_servicio <> ?
        """, (nombre, id_servicio))

        nombre_existente = cursor.fetchone()

        if nombre_existente:
            return jsonify({
                "ok": False,
                "mensaje": "Ya existe otro servicio con ese nombre"
            }), 409

        cursor.execute("""
            UPDATE servicio
            SET
                nombre = ?,
                precio = ?,
                duracion = ?,
                descripcion = ?
            WHERE id_servicio = ?
        """, (
            nombre,
            precio,
            duracion,
            descripcion,
            id_servicio
        ))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Servicio actualizado correctamente",
            "id_servicio": id_servicio
        })

    finally:
        cursor.close()
        connection.close()


# PATCH - Activar / desactivar servicio
@servicios_bp.route("/api/servicios/<int:id_servicio>/estado", methods=["PATCH"])
@login_requerido
def cambiar_estado_servicio(id_servicio):

    datos = request.get_json()

    estado = datos.get("estado")

    if estado is None:
        return jsonify({
            "ok": False,
            "mensaje": "El estado es obligatorio"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_servicio
            FROM servicio
            WHERE id_servicio = ?
        """, (id_servicio,))

        servicio = cursor.fetchone()

        if not servicio:
            return jsonify({
                "ok": False,
                "mensaje": "Servicio no encontrado"
            }), 404

        cursor.execute("""
            UPDATE servicio
            SET estado = ?
            WHERE id_servicio = ?
        """, (estado, id_servicio))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Estado del servicio actualizado correctamente",
            "id_servicio": id_servicio,
            "estado": bool(estado)
        })

    finally:
        cursor.close()
        connection.close()