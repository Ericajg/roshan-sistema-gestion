from werkzeug.security import generate_password_hash
from database import get_connection

usuario = input("Usuario a actualizar: ")
contraseña_en_claro = input("Nueva contraseña: ")

hash_contraseña = generate_password_hash(contraseña_en_claro)

connection = get_connection()
try:
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE usuario
        SET contraseña = ?
        WHERE usuario = ?
    """, (hash_contraseña, usuario))

    connection.commit()

    print(f"Filas actualizadas: {cursor.rowcount}")

finally:
    cursor.close()
    connection.close()