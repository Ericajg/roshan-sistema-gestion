import os
from dotenv import load_dotenv
load_dotenv()
from flask import Flask
from flask_cors import CORS
from database import get_connection
from routes.clientes import clientes_bp
from routes.servicios import servicios_bp
from routes.turnos import turnos_bp
from routes.bloqueos import bloqueos_bp
from routes.pagos import pagos_bp
from routes.atencion import atencion_bp
from routes.dashboard import dashboard_bp
from routes.auth import auth_bp

app = Flask(__name__)

CORS(app)

app.register_blueprint(clientes_bp)
app.register_blueprint(servicios_bp)
app.register_blueprint(turnos_bp)
app.register_blueprint(bloqueos_bp)
app.register_blueprint(pagos_bp)
app.register_blueprint(atencion_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(auth_bp)


@app.route("/")
def inicio():
    return "API ROSHAN funcionando"


@app.route("/test-db")
def test_db():
    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT current_database()")

        database = cursor.fetchone()[0]

        cursor.close()
        connection.close()

        return {
            "ok": True,
            "database": database
        }

    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }, 500


if __name__ == "__main__":
    modo_debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=5000, debug=modo_debug)
