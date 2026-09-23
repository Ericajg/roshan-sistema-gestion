"""
Script de migración ÚNICA de SQL Server (local) -> PostgreSQL (Neon).

Correr esto UNA sola vez, DESDE LA PC donde vive el SQL Server con los
datos reales (donde ya corre el backend hoy), después de:
  1. Haber creado el proyecto en Neon.
  2. Haber corrido schema_postgres.sql contra esa base de Neon
     (con el SQL Editor de Neon, por ejemplo).

Requiere tener instalado en el venv de esa PC, además de lo que ya
tiene el proyecto:
    pip install psycopg2-binary

Uso:
    python scripts_admin/migrar_datos.py
"""

import os
import pyodbc
import psycopg2
from psycopg2.extras import execute_values

# ---- Conexión de ORIGEN: el SQL Server local de siempre ----
SQLSERVER_CONNECTION_STRING = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=DESKTOP-F9AOBQE;"
    "DATABASE=ROSHAN;"
    "Trusted_Connection=yes;"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)

# ---- Conexión de DESTINO: Neon ----
# Pegá acá la "Connection string" que te da Neon (Dashboard -> Connect),
# o dejala como variable de entorno DATABASE_URL antes de correr el script.
NEON_DATABASE_URL = os.environ.get("DATABASE_URL", "PEGAR_ACA_LA_CONNECTION_STRING_DE_NEON")


TABLAS_EN_ORDEN = [
    # (tabla, columnas, columna_identity)
    ("cliente", ["id_cliente", "nombre", "apellido", "telefono", "email",
                 "fecha_nacimiento", "observaciones"], "id_cliente"),
    ("servicio", ["id_servicio", "nombre", "precio", "duracion",
                  "descripcion", "estado"], "id_servicio"),
    ("usuario", ["id_usuario", "usuario", "contraseña"], "id_usuario"),
    ("turno", ["id_turno", "id_cliente", "id_servicio", "fecha", "hora",
               "estado", "precio_acordado"], "id_turno"),
    ("pago", ["id_pago", "id_turno", "tipo_pago", "medio_pago", "fecha",
              "monto"], "id_pago"),
    ("atencion", ["id_atencion", "id_turno", "observaciones"], "id_atencion"),
    ("bloqueo_horario", ["id_bloqueo", "fecha", "hora"], "id_bloqueo"),
]


def migrar():
    origen = pyodbc.connect(SQLSERVER_CONNECTION_STRING)
    destino = psycopg2.connect(NEON_DATABASE_URL)

    try:
        cursor_origen = origen.cursor()
        cursor_destino = destino.cursor()

        for tabla, columnas, columna_identity in TABLAS_EN_ORDEN:
            columnas_sql = ", ".join(columnas)

            cursor_origen.execute(f"SELECT {columnas_sql} FROM {tabla}")
            filas = cursor_origen.fetchall()
            filas = [tuple(fila) for fila in filas]

            if not filas:
                print(f"{tabla}: no tiene filas, se salta.")
                continue

            placeholders = ", ".join(["%s"] * len(columnas))
            insert_sql = f"INSERT INTO {tabla} ({columnas_sql}) VALUES ({placeholders})"

            cursor_destino.executemany(insert_sql, filas)

            # Reacomodar la secuencia del identity para que el próximo
            # INSERT automático (sin id explícito) no choque con estos ids.
            cursor_destino.execute(f"""
                SELECT setval(
                    pg_get_serial_sequence('{tabla}', '{columna_identity}'),
                    COALESCE((SELECT MAX({columna_identity}) FROM {tabla}), 1)
                )
            """)

            destino.commit()
            print(f"{tabla}: {len(filas)} filas migradas.")

        print("Migración completa.")

    finally:
        origen.close()
        destino.close()


if __name__ == "__main__":
    if "PEGAR_ACA" in NEON_DATABASE_URL:
        print("Falta configurar NEON_DATABASE_URL (variable de entorno DATABASE_URL "
              "o editar el script) con la connection string de Neon.")
    else:
        migrar()
