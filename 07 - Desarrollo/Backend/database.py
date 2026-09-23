import os
import psycopg2
from psycopg2.extras import NamedTupleCursor

# Connection string completa de PostgreSQL (la da Neon), ej:
# postgresql://usuario:contraseña@host/basededatos?sslmode=require
DATABASE_URL = os.environ.get("DATABASE_URL")


def get_connection():
    # cursor_factory=NamedTupleCursor: permite seguir usando fila.campo
    # en vez de fila["campo"], igual que hacía pyodbc.
    return psycopg2.connect(DATABASE_URL, cursor_factory=NamedTupleCursor)
