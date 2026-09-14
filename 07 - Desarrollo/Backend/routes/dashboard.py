from flask import Blueprint, jsonify, request
from database import get_connection
from routes.auth_middleware import login_requerido




dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
@login_requerido
def obtener_dashboard():

    desde = request.args.get("desde")
    hasta = request.args.get("hasta")

    connection = get_connection()
    try:
        cursor = connection.cursor()

        # Turnos de hoy
        cursor.execute("""
            SELECT COUNT(*)
            FROM turno
            WHERE fecha = CAST(GETDATE() AS DATE)
        """)
        turnos_hoy = cursor.fetchone()[0]

        # Turnos reservados
        cursor.execute("""
            SELECT COUNT(*)
            FROM turno
            WHERE estado = 'Reservado'
        """)
        turnos_reservados = cursor.fetchone()[0]

        # Turnos realizados
        cursor.execute("""
            SELECT COUNT(*)
            FROM turno
            WHERE estado = 'Realizado'
        """)
        turnos_realizados = cursor.fetchone()[0]

        # Turnos cancelados
        cursor.execute("""
            SELECT COUNT(*)
            FROM turno
            WHERE estado = 'Cancelado'
        """)
        turnos_cancelados = cursor.fetchone()[0]

        # Ingresos cobrados (con filtro opcional de fechas)
        sql_ingresos = "SELECT COALESCE(SUM(monto), 0) FROM pago"
        parametros = []

        if desde and hasta:
            sql_ingresos += " WHERE fecha BETWEEN ? AND ?"
            parametros = [desde, hasta]
        elif desde:
            sql_ingresos += " WHERE fecha >= ?"
            parametros = [desde]
        elif hasta:
            sql_ingresos += " WHERE fecha <= ?"
            parametros = [hasta]

        cursor.execute(sql_ingresos, parametros)
        ingresos = float(cursor.fetchone()[0])

        # Dinero pendiente de cobrar (turnos no cancelados)
        cursor.execute("""
            SELECT COALESCE(SUM(
                t.precio_acordado - COALESCE(p.total_pagado, 0)
            ), 0)
            FROM turno t
            LEFT JOIN (
                SELECT
                    id_turno,
                    SUM(monto) AS total_pagado
                FROM pago
                GROUP BY id_turno
            ) p
                ON t.id_turno = p.id_turno
            WHERE t.estado <> 'Cancelado'
        """)
        pendiente = float(cursor.fetchone()[0])

        # Clientes registrados
        cursor.execute("""
            SELECT COUNT(*)
            FROM cliente
        """)
        clientes = cursor.fetchone()[0]

        # Servicios activos
        cursor.execute("""
            SELECT COUNT(*)
            FROM servicio
            WHERE estado = 1
        """)
        servicios = cursor.fetchone()[0]

        return jsonify({
            "turnos_hoy": turnos_hoy,
            "turnos_reservados": turnos_reservados,
            "turnos_realizados": turnos_realizados,
            "turnos_cancelados": turnos_cancelados,
            "clientes": clientes,
            "servicios": servicios,
            "ingresos": ingresos,
            "pendiente": pendiente
        })

    finally:
        cursor.close()
        connection.close()