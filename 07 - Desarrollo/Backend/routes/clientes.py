from flask import Blueprint, jsonify, request
from database import get_connection
from routes.auth_middleware import login_requerido

clientes_bp = Blueprint("clientes", __name__)


@clientes_bp.route("/api/clientes", methods=["GET"])
@login_requerido
def listar_clientes():

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                c.id_cliente,
                c.nombre,
                c.apellido,
                c.telefono,
                c.email,
                c.fecha_nacimiento,
                c.observaciones,
                (SELECT COUNT(*)
                    FROM turno t
                    WHERE t.id_cliente = c.id_cliente
                      AND t.estado = 'Realizado') AS sesiones_realizadas,
                (SELECT MAX(t.fecha)
                    FROM turno t
                    WHERE t.id_cliente = c.id_cliente
                      AND t.estado = 'Realizado') AS ultima_sesion
            FROM cliente c
            ORDER BY c.apellido, c.nombre
        """)

        filas = cursor.fetchall()

        clientes = [{
            "id_cliente": fila.id_cliente,
            "nombre": fila.nombre,
            "apellido": fila.apellido,
            "telefono": fila.telefono,
            "email": fila.email,
            "fecha_nacimiento": str(fila.fecha_nacimiento)
                if fila.fecha_nacimiento else None,
            "observaciones": fila.observaciones,
            "sesiones_realizadas": fila.sesiones_realizadas,
            "ultima_sesion": str(fila.ultima_sesion) if fila.ultima_sesion else None
        } for fila in filas]

        return jsonify(clientes)

    finally:
        cursor.close()
        connection.close()


@clientes_bp.route("/api/clientes/<int:id_cliente>", methods=["GET"])
@login_requerido
def obtener_cliente(id_cliente):

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id_cliente,
                nombre,
                apellido,
                telefono,
                email,
                fecha_nacimiento,
                observaciones
            FROM cliente
            WHERE id_cliente = %s
        """, (id_cliente,))

        fila = cursor.fetchone()

        if not fila:
            return jsonify({
                "ok": False,
                "mensaje": "Cliente no encontrado"
            }), 404

        cliente = {
            "id_cliente": fila.id_cliente,
            "nombre": fila.nombre,
            "apellido": fila.apellido,
            "telefono": fila.telefono,
            "email": fila.email,
            "fecha_nacimiento": str(fila.fecha_nacimiento)
                if fila.fecha_nacimiento else None,
            "observaciones": fila.observaciones
        }

        return jsonify(cliente)

    finally:
        cursor.close()
        connection.close()


@clientes_bp.route("/api/clientes/<int:id_cliente>", methods=["PUT"])
@login_requerido
def actualizar_cliente(id_cliente):

    datos = request.get_json()

    nombre = datos.get("nombre")
    apellido = datos.get("apellido")
    telefono = datos.get("telefono")
    email = datos.get("email")
    fecha_nacimiento = datos.get("fecha_nacimiento")
    observaciones = datos.get("observaciones")

    if not nombre or not apellido or not telefono:
        return jsonify({
            "ok": False,
            "mensaje": "Nombre, apellido y teléfono son obligatorios"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_cliente
            FROM cliente
            WHERE id_cliente = %s
        """, (id_cliente,))

        cliente = cursor.fetchone()

        if not cliente:
            return jsonify({
                "ok": False,
                "mensaje": "Cliente no encontrado"
            }), 404

        cursor.execute("""
            SELECT id_cliente
            FROM cliente
            WHERE telefono = %s
              AND id_cliente <> %s
        """, (telefono, id_cliente))

        telefono_existente = cursor.fetchone()

        if telefono_existente:
            return jsonify({
                "ok": False,
                "mensaje": "El teléfono ya pertenece a otro cliente"
            }), 409

        cursor.execute("""
            UPDATE cliente
            SET
                nombre = %s,
                apellido = %s,
                telefono = %s,
                email = %s,
                fecha_nacimiento = %s,
                observaciones = %s
            WHERE id_cliente = %s
        """, (
            nombre,
            apellido,
            telefono,
            email,
            fecha_nacimiento,
            observaciones,
            id_cliente
        ))

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Cliente actualizado correctamente",
            "id_cliente": id_cliente
        })

    finally:
        cursor.close()
        connection.close()


@clientes_bp.route("/api/clientes/<int:id_cliente>/historial", methods=["GET"])
@login_requerido
def obtener_historial_cliente(id_cliente):

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id_cliente,
                nombre,
                apellido,
                telefono
            FROM cliente
            WHERE id_cliente = %s
        """, (id_cliente,))

        cliente = cursor.fetchone()

        if not cliente:
            return jsonify({
                "ok": False,
                "mensaje": "Cliente no encontrado"
            }), 404

        cursor.execute("""
            SELECT
                t.id_turno,
                t.fecha,
                t.hora,
                t.estado,
                t.precio_acordado,
                s.id_servicio,
                s.nombre AS servicio,
                s.duracion
            FROM turno t
            INNER JOIN servicio s
                ON t.id_servicio = s.id_servicio
            WHERE t.id_cliente = %s
            ORDER BY t.fecha DESC, t.hora DESC
        """, (id_cliente,))

        filas = cursor.fetchall()

        historial = []

        for fila in filas:

            cursor.execute("""
                SELECT COALESCE(SUM(monto), 0)
                FROM pago
                WHERE id_turno = %s
            """, (fila.id_turno,))

            total_pagado = float(cursor.fetchone()[0])

            cursor.execute("""
                SELECT observaciones
                FROM atencion
                WHERE id_turno = %s
            """, (fila.id_turno,))

            atencion = cursor.fetchone()

            precio_acordado = float(fila.precio_acordado)

            historial.append({
                "id_turno": fila.id_turno,
                "fecha": str(fila.fecha),
                "hora": str(fila.hora),
                "estado": fila.estado,
                "servicio": fila.servicio,
                "precio_acordado": precio_acordado,
                "duracion": fila.duracion,
                "total_pagado": total_pagado,
                "saldo_pendiente": precio_acordado - total_pagado,
                "observaciones": atencion.observaciones if atencion else None
            })

        return jsonify({
            "cliente": {
                "id_cliente": cliente.id_cliente,
                "nombre": cliente.nombre,
                "apellido": cliente.apellido,
                "telefono": cliente.telefono
            },
            "historial": historial
        })

    finally:
        cursor.close()
        connection.close()



@clientes_bp.route("/api/clientes", methods=["POST"])
@login_requerido
def crear_cliente():

    datos = request.get_json()

    nombre = datos.get("nombre")
    apellido = datos.get("apellido")
    telefono = datos.get("telefono")
    email = datos.get("email")
    fecha_nacimiento = datos.get("fecha_nacimiento")
    observaciones = datos.get("observaciones")

    if not nombre or not apellido or not telefono:
        return jsonify({
            "ok": False,
            "mensaje": "Nombre, apellido y teléfono son obligatorios"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_cliente
            FROM cliente
            WHERE telefono = %s
        """, (telefono,))

        telefono_existente = cursor.fetchone()

        if telefono_existente:
            return jsonify({
                "ok": False,
                "mensaje": "El teléfono ya pertenece a otro cliente"
            }), 409

        cursor.execute("""
            INSERT INTO cliente
                (nombre, apellido, telefono, email, fecha_nacimiento, observaciones)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id_cliente
        """, (
            nombre,
            apellido,
            telefono,
            email,
            fecha_nacimiento,
            observaciones
        ))

        nuevo_id = cursor.fetchone()[0]

        connection.commit()

        return jsonify({
            "ok": True,
            "mensaje": "Cliente creado correctamente",
            "id_cliente": nuevo_id
        }), 201

    finally:
        cursor.close()
        connection.close()


@clientes_bp.route("/api/clientes/buscar", methods=["GET"])
@login_requerido
def buscar_clientes():

    query = request.args.get("q", "").strip()

    if not query:
        return jsonify({
            "ok": False,
            "mensaje": "Debe indicar un parámetro de búsqueda 'q'"
        }), 400

    patron = f"%{query}%"

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id_cliente,
                nombre,
                apellido,
                telefono,
                email
            FROM cliente
            WHERE nombre ILIKE %s
               OR apellido ILIKE %s
               OR telefono ILIKE %s
            ORDER BY apellido, nombre
        """, (patron, patron, patron))

        filas = cursor.fetchall()

        resultados = [{
            "id_cliente": fila.id_cliente,
            "nombre": fila.nombre,
            "apellido": fila.apellido,
            "telefono": fila.telefono,
            "email": fila.email
        } for fila in filas]

        return jsonify({
            "ok": True,
            "cantidad": len(resultados),
            "resultados": resultados
        })

    finally:
        cursor.close()
        connection.close()
