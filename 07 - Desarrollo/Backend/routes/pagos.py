from flask import Blueprint, jsonify, request
from database import get_connection
from routes.auth_middleware import login_requerido

pagos_bp = Blueprint("pagos", __name__)


# GET - Obtener todos los pagos
@pagos_bp.route("/api/pagos", methods=["GET"])
@login_requerido
def obtener_pagos():

    desde = request.args.get("desde")
    hasta = request.args.get("hasta")

    connection = get_connection()
    try:
        cursor = connection.cursor()

        sql = """
            SELECT
                p.id_pago,
                p.id_turno,
                c.nombre,
                c.apellido,
                s.nombre AS servicio,
                p.tipo_pago,
                p.medio_pago,
                p.fecha,
                p.monto
            FROM pago p
            INNER JOIN turno t
                ON p.id_turno = t.id_turno
            INNER JOIN cliente c
                ON t.id_cliente = c.id_cliente
            INNER JOIN servicio s
                ON t.id_servicio = s.id_servicio
        """

        parametros = []

        if desde and hasta:
            sql += """
                WHERE p.fecha BETWEEN ? AND ?
            """
            parametros = [desde, hasta]

        elif desde:
            sql += """
                WHERE p.fecha >= ?
            """
            parametros = [desde]

        elif hasta:
            sql += """
                WHERE p.fecha <= ?
            """
            parametros = [hasta]

        sql += """
            ORDER BY p.fecha DESC, p.id_pago DESC
        """

        cursor.execute(sql, parametros)

        filas = cursor.fetchall()

        pagos = []

        for fila in filas:
            pagos.append({
                "id_pago": fila.id_pago,
                "id_turno": fila.id_turno,
                "cliente": f"{fila.nombre} {fila.apellido}",
                "servicio": fila.servicio,
                "tipo_pago": fila.tipo_pago,
                "medio_pago": fila.medio_pago,
                "fecha": str(fila.fecha),
                "monto": float(fila.monto)
            })

        return jsonify(pagos)

    finally:
        cursor.close()
        connection.close()


# GET - Obtener un pago específico
@pagos_bp.route("/api/pagos/<int:id_pago>", methods=["GET"])
@login_requerido
def obtener_pago(id_pago):

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                p.id_pago,
                p.id_turno,
                c.nombre,
                c.apellido,
                s.nombre AS servicio,
                p.tipo_pago,
                p.medio_pago,
                p.fecha,
                p.monto
            FROM pago p
            INNER JOIN turno t
                ON p.id_turno = t.id_turno
            INNER JOIN cliente c
                ON t.id_cliente = c.id_cliente
            INNER JOIN servicio s
                ON t.id_servicio = s.id_servicio
            WHERE p.id_pago = ?
        """, (id_pago,))

        fila = cursor.fetchone()

        if not fila:
            return jsonify({
                "ok": False,
                "mensaje": "Pago no encontrado"
            }), 404

        pago = {
            "id_pago": fila.id_pago,
            "id_turno": fila.id_turno,
            "cliente": f"{fila.nombre} {fila.apellido}",
            "servicio": fila.servicio,
            "tipo_pago": fila.tipo_pago,
            "medio_pago": fila.medio_pago,
            "fecha": str(fila.fecha),
            "monto": float(fila.monto)
        }

        return jsonify(pago)

    finally:
        cursor.close()
        connection.close()


# GET - Obtener pagos de un turno
@pagos_bp.route("/api/turnos/<int:id_turno>/pagos", methods=["GET"])
@login_requerido
def obtener_pagos_turno(id_turno):

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id_turno
            FROM turno
            WHERE id_turno = ?
        """, (id_turno,))

        if not cursor.fetchone():
            return jsonify({
                "ok": False,
                "mensaje": "Turno no encontrado"
            }), 404

        cursor.execute("""
            SELECT
                id_pago,
                id_turno,
                tipo_pago,
                medio_pago,
                fecha,
                monto
            FROM pago
            WHERE id_turno = ?
            ORDER BY fecha, id_pago
        """, (id_turno,))

        filas = cursor.fetchall()

        pagos = []
        total_pagado = 0

        for fila in filas:

            monto = float(fila.monto)
            total_pagado += monto

            pagos.append({
                "id_pago": fila.id_pago,
                "id_turno": fila.id_turno,
                "tipo_pago": fila.tipo_pago,
                "medio_pago": fila.medio_pago,
                "fecha": str(fila.fecha),
                "monto": monto
            })

        return jsonify({
            "id_turno": id_turno,
            "pagos": pagos,
            "total_pagado": total_pagado
        })

    finally:
        cursor.close()
        connection.close()


# POST - Registrar pago
@pagos_bp.route("/api/pagos", methods=["POST"])
@login_requerido
def crear_pago():

    datos = request.get_json()

    id_turno = datos.get("id_turno")
    tipo_pago = datos.get("tipo_pago")
    medio_pago = datos.get("medio_pago")
    fecha = datos.get("fecha")
    monto = datos.get("monto")

    if not id_turno or not tipo_pago or not medio_pago or not fecha or monto is None:
        return jsonify({
            "ok": False,
            "mensaje": "Turno, tipo de pago, medio de pago, fecha y monto son obligatorios"
        }), 400

    tipos_validos = ["Seña", "Pago"]

    medios_validos = [
        "Efectivo",
        "Transferencia",
        "Débito",
        "Crédito"
    ]

    if tipo_pago not in tipos_validos:
        return jsonify({
            "ok": False,
            "mensaje": "Tipo de pago inválido"
        }), 400

    if medio_pago not in medios_validos:
        return jsonify({
            "ok": False,
            "mensaje": "Medio de pago inválido"
        }), 400

    try:
        monto = float(monto)
    except (ValueError, TypeError):
        return jsonify({
            "ok": False,
            "mensaje": "El monto debe ser numérico"
        }), 400

    if monto <= 0:
        return jsonify({
            "ok": False,
            "mensaje": "El monto debe ser mayor a cero"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        # Verificar turno
        cursor.execute("""
            SELECT id_turno, precio_acordado
            FROM turno
            WHERE id_turno = ?
        """, (id_turno,))

        turno = cursor.fetchone()

        if not turno:
            return jsonify({
                "ok": False,
                "mensaje": "Turno no encontrado"
            }), 404

        precio_acordado = float(turno.precio_acordado)

        # Obtener total pagado anteriormente
        cursor.execute("""
            SELECT COALESCE(SUM(monto), 0)
            FROM pago
            WHERE id_turno = ?
        """, (id_turno,))

        total_pagado = float(cursor.fetchone()[0])

        # No permitir pagar más que el precio acordado del turno
        if total_pagado + monto > precio_acordado:
            return jsonify({
                "ok": False,
                "mensaje": "El monto supera el saldo pendiente",
                "precio_acordado": precio_acordado,
                "total_pagado": total_pagado,
                "saldo_pendiente": precio_acordado - total_pagado
            }), 400

        # Registrar pago
        cursor.execute("""
            INSERT INTO pago
            (
                id_turno,
                tipo_pago,
                medio_pago,
                fecha,
                monto
            )
            OUTPUT INSERTED.id_pago
            VALUES (?, ?, ?, ?, ?)
        """, (
            id_turno,
            tipo_pago,
            medio_pago,
            fecha,
            monto
        ))

        id_pago = cursor.fetchone()[0]
        connection.commit()

        nuevo_total = total_pagado + monto
        saldo_pendiente = precio_acordado - nuevo_total

        return jsonify({
            "ok": True,
            "mensaje": "Pago registrado correctamente",
            "id_pago": int(id_pago),
            "id_turno": id_turno,
            "monto": monto,
            "total_pagado": nuevo_total,
            "saldo_pendiente": saldo_pendiente
        }), 201

    finally:
        cursor.close()
        connection.close()