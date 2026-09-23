import os
import jwt
import datetime
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash
from database import get_connection

auth_bp = Blueprint("auth", __name__)

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "cambiar-esta-clave-en-produccion")


@auth_bp.route("/api/login", methods=["POST"])
def login():

    datos = request.get_json()

    usuario = datos.get("usuario")
    contraseña = datos.get("contraseña")

    if not usuario or not contraseña:
        return jsonify({
            "ok": False,
            "mensaje": "Usuario y contraseña son obligatorios"
        }), 400

    connection = get_connection()
    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                id_usuario,
                usuario,
                contraseña
            FROM usuario
            WHERE usuario = %s
        """, (usuario,))

        fila = cursor.fetchone()

        if not fila:
            return jsonify({
                "ok": False,
                "mensaje": "Usuario o contraseña incorrectos"
            }), 401

        if not check_password_hash(fila.contraseña, contraseña):
            return jsonify({
                "ok": False,
                "mensaje": "Usuario o contraseña incorrectos"
            }), 401

        # Generar el token
        payload = {
            "id_usuario": fila.id_usuario,
            "usuario": fila.usuario,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return jsonify({
            "ok": True,
            "mensaje": "Inicio de sesión correcto",
            "token": token,
            "usuario": {
                "id_usuario": fila.id_usuario,
                "usuario": fila.usuario
            }
        })

    finally:
        cursor.close()
        connection.close()
