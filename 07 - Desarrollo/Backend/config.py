import os

SERVER = os.environ.get("DB_SERVER", "DESKTOP-F9AOBQE")
DATABASE = os.environ.get("DB_NAME", "ROSHAN")

CONNECTION_STRING = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)