# Este archivo quedó en desuso al migrar de SQL Server a PostgreSQL.
# La conexión ahora se arma directamente en database.py a partir de la
# variable de entorno DATABASE_URL (connection string que da Neon).
# Se deja el archivo para no romper si algo externo lo referencia,
# pero ya no se importa desde ningún lado del backend.
