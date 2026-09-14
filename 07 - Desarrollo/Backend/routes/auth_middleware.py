import os
import jwt
from functools import wraps
from flask import request, jsonify

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "cambiar-esta-clave-en-produccion")


def login_requerido(f):
    @wraps(f)
    def decorada(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "ok": False,
                "mensaje": "Token no proporcionado"
            }), 401

        token = auth_header.split(" ")[1]

        try:
            jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({
                "ok": False,
                "mensaje": "El token expiró, iniciá sesión de nuevo"
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "ok": False,
                "mensaje": "Token inválido"
            }), 401

        return f(*args, **kwargs)

    return decorada