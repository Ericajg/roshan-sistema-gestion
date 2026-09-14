CREATE DATABASE ROSHAN;
GO

USE ROSHAN;
GO

SELECT name 
FROM sys.databases 
WHERE name = 'ROSHAN';
GO

----------------CREACION DE TABLAS--------------------------
--CLIENTE

CREATE TABLE cliente (
    id_cliente INT PRIMARY KEY IDENTITY(1,1),
    nombre VARCHAR(30) NOT NULL,
    apellido VARCHAR(30) NOT NULL,
    telefono VARCHAR(25) NOT NULL UNIQUE,
    email VARCHAR(50) NULL,
    fecha_nacimiento DATE NULL,
    observaciones VARCHAR(500) NULL
    );
GO

--SERVICIO
CREATE TABLE servicio (
    id_servicio INT PRIMARY KEY IDENTITY(1,1),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    precio DECIMAL(10,2) NOT NULL
       CHECK (precio >= 0),
    duracion INT NOT NULL
       CHECK (duracion > 0),
    descripcion VARCHAR(255) NULL,
    estado BIT DEFAULT 1 NOT NULL
    );
GO

--TURNO
CREATE TABLE turno (
    id_turno INT PRIMARY KEY IDENTIty(1,1),
    id_cliente INT NOT NULL,
    id_servicio INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(25) NOT NULL
    CHECK (estado IN ('Reservado', 'Realizado', 'Cancelado', 'No asistió')),
    FOREIGN KEY (id_cliente) 
       REFERENCES cliente(id_cliente),
    FOREIGN KEY (id_servicio)
       REFERENCES servicio(id_servicio)
    );
GO

--PAGO
CREATE TABLE pago (
   id_pago INT PRIMARY KEY IDENTITY(1,1),
   id_turno INT NOT NULL,
   tipo_pago VARCHAR(20) NOT NULL
    CHECK (tipo_pago IN ('Seña', 'Pago')),
   medio_pago VARCHAR(30) NOT NULL
    CHECK (medio_pago IN ('Efectivo', 'Transferencia', 'Débito', 'Crédito')),
   fecha DATE NOT NULL,
   monto DECIMAL(10,2) NOT NULL
    CHECK(monto > 0),
   FOREIGN KEY (id_turno) 
       REFERENCES turno(id_turno)
   );
GO

--ATENCION
CREATE TABLE atencion (
   id_atencion INT PRIMARY KEY IDENTITY(1,1),
   id_turno INT NOT NULL UNIQUE,
   observaciones VARCHAR(255) NULL,
   FOREIGN KEY (id_turno) 
       REFERENCES turno(id_turno)
   );
GO
--BLOQUEO_HORARIO
CREATE TABLE bloqueo_horario (
   id_bloqueo INT PRIMARY KEY IDENTITY(1,1),
   fecha DATE NOT NULL,
   hora TIME NOT NULL,
   CONSTRAINT UQ_bloqueo_fecha_hora 
        UNIQUE (fecha, hora)
   );
GO


--USUARIO
CREATE TABLE usuario (
   id_usuario INT PRIMARY KEY IDENTITY(1,1),
   usuario VARCHAR(50) NOT NULL UNIQUE,
   contraseña VARCHAR(20)NOT NULL
   );
GO

USE ROSHAN;
GO

SELECT 
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;


USE ROSHAN;
GO

USE ROSHAN;
GO

SELECT
    k.TABLE_NAME,
    k.COLUMN_NAME,
    k.CONSTRAINT_NAME,
    c.CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS k
INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS c
    ON k.CONSTRAINT_NAME = c.CONSTRAINT_NAME
    AND k.TABLE_NAME = c.TABLE_NAME
WHERE c.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY k.TABLE_NAME, c.CONSTRAINT_TYPE;


USE ROSHAN;
GO

SELECT
    fk.name AS nombre_fk,
    OBJECT_NAME(fk.parent_object_id) AS tabla,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS columna,
    OBJECT_NAME(fk.referenced_object_id) AS tabla_referenciada,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS columna_referenciada
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fkc
    ON fk.object_id = fkc.constraint_object_id
ORDER BY tabla;


USE ROSHAN;
GO

SELECT
    tc.CONSTRAINT_NAME,
    tc.TABLE_NAME,
    cc.CHECK_CLAUSE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
INNER JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS AS cc
    ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_TYPE = 'CHECK'
ORDER BY tc.TABLE_NAME;

USE ROSHAN;
GO

INSERT INTO cliente
    (nombre, apellido, telefono, email, fecha_nacimiento, observaciones)
VALUES
    ('María', 'Gómez', '1122334455', 'maria@gmail.com', '1990-05-15', 'Prefiere horarios de la mañana'),
    ('María', 'Gómez', '1166778899', 'maria.g@gmail.com', NULL, NULL),
    ('Juan', 'Pérez', '1155667788', NULL, '1985-10-20', 'Molestias en la zona lumbar'),
    ('Ana', 'Rodríguez', '1144556677', 'ana@gmail.com', '1995-03-08', NULL);
GO


SELECT *
FROM cliente;


INSERT INTO servicio
    (nombre, precio, duracion, descripcion)
VALUES
    ('Masaje relajante', 25000, 50, 'Masaje orientado a la relajación y reducción del estrés'),
    ('Masaje descontracturante', 25000, 50, 'Masaje para aliviar tensiones y contracturas musculares'),
    ('Masaje deportivo', 25000, 60, 'Masaje orientado a recuperación y preparación muscular'),
    ('Acupuntura', 25000, 45, 'Sesión de acupuntura');
GO

SELECT *
FROM servicio;

INSERT INTO servicio
    (nombre, precio, duracion)
VALUES
    ('Servicio incorrecto', -1000, 50);

SELECT *
FROM servicio;

INSERT INTO servicio
    (nombre, precio, duracion, descripcion)
VALUES
    ('Masaje relajante', 25000, 50, 'Masaje orientado a la relajación y reducción del estrés'),
    ('Masaje descontracturante', 25000, 50, 'Masaje para aliviar tensiones y contracturas musculares'),
    ('Masaje deportivo', 25000, 60, 'Masaje orientado a recuperación y preparación muscular'),
    ('Acupuntura', 25000, 45, 'Sesión de acupuntura');
GO

SELECT *
FROM cliente;

SELECT *
FROM servicio;

INSERT INTO turno
    (id_cliente, id_servicio, fecha, hora, estado)
VALUES
    (1, 1, '2026-09-01', '10:00', 'Reservado'),
    (2, 2, '2026-09-01', '11:00', 'Reservado'),
    (3, 3, '2026-09-01', '12:00', 'Realizado'),
    (4, 1, '2026-09-02', '10:00', 'Reservado');
GO

SELECT *
FROM turno;

INSERT INTO turno
    (id_cliente, id_servicio, fecha, hora, estado)
VALUES
    (999, 1, '2026-09-03', '10:00', 'Reservado');


    SELECT id_cliente, nombre, apellido, telefono
FROM cliente;

SELECT id_servicio, nombre
FROM servicio;

SELECT * 
FROM turno;

INSERT INTO pago
    (id_turno, tipo_pago, medio_pago, fecha, monto)
VALUES
    (1, 'Seña', 'Transferencia', '2026-08-31', 12500),
    (1, 'Pago', 'Efectivo', '2026-09-01', 12500),
    (2, 'Pago', 'Transferencia', '2026-09-01', 25000);
GO

SELECT * FROM pago;

INSERT INTO atencion
    (id_turno, observaciones)
VALUES
    (3, 'El cliente manifestó molestias leves en la zona lumbar.');
GO

INSERT INTO bloqueo_horario
    (fecha, hora)
VALUES
    ('2026-09-01', '13:00'),
    ('2026-09-01', '14:00'),
    ('2026-09-03', '10:00');
GO

INSERT INTO usuario
    (usuario, contraseña)
VALUES
    ('riki', 'prueba123');
GO

SELECT
    t.id_turno,
    c.nombre + ' ' + c.apellido AS cliente,
    s.nombre AS servicio,
    t.fecha,
    t.hora,
    t.estado
FROM turno AS t
INNER JOIN cliente AS c
    ON t.id_cliente = c.id_cliente
INNER JOIN servicio AS s
    ON t.id_servicio = s.id_servicio
ORDER BY t.fecha, t.hora;

SELECT
    c.nombre + ' ' + c.apellido AS cliente,
    t.fecha,
    t.hora,
    s.nombre AS servicio,
    t.estado,
    a.observaciones
FROM cliente AS c
INNER JOIN turno AS t
    ON c.id_cliente = t.id_cliente
INNER JOIN servicio AS s
    ON t.id_servicio = s.id_servicio
LEFT JOIN atencion AS a
    ON t.id_turno = a.id_turno
WHERE c.id_cliente = 1
ORDER BY t.fecha DESC, t.hora DESC;

SELECT
    t.hora,
    c.nombre + ' ' + c.apellido AS cliente,
    s.nombre AS servicio,
    s.duracion,
    t.estado
FROM turno AS t
INNER JOIN cliente AS c
    ON t.id_cliente = c.id_cliente
INNER JOIN servicio AS s
    ON t.id_servicio = s.id_servicio
WHERE t.fecha = '2026-09-01'
ORDER BY t.hora;


--Buscar cliente por nombre o apellido
SELECT
    id_cliente,
    nombre,
    apellido,
    telefono,
    email
FROM cliente
WHERE nombre LIKE '%María%'
   OR apellido LIKE '%María%';

SELECT nombre, apellido
FROM cliente;

--Buscar cliente por teléfono
SELECT *
FROM cliente
WHERE telefono = '1122334455';

-- Ficha del cliente
SELECT
    id_cliente,
    nombre,
    apellido,
    telefono,
    email,
    fecha_nacimiento,
    observaciones
FROM cliente
WHERE id_cliente = 1;

SELECT *
FROM cliente

-- Historial del cliente
SELECT
    t.id_turno,
    t.fecha,
    t.hora,
    s.nombre AS servicio,
    s.precio,
    s.duracion,
    t.estado,
    a.observaciones
FROM turno AS t
INNER JOIN servicio AS s
    ON t.id_servicio = s.id_servicio
LEFT JOIN atencion AS a
    ON t.id_turno = a.id_turno
WHERE t.id_cliente = 1
ORDER BY t.fecha DESC, t.hora DESC;

--Agenda diaria
SELECT
    t.id_turno,
    t.hora,
    c.nombre + ' ' + c.apellido AS cliente,
    s.nombre AS servicio,
    s.duracion,
    t.estado
FROM turno AS t
INNER JOIN cliente AS c
    ON t.id_cliente = c.id_cliente
INNER JOIN servicio AS s
    ON t.id_servicio = s.id_servicio
WHERE t.fecha = '2026-09-01'
ORDER BY t.hora;

-- Agenda semanal
SELECT
    t.fecha,
    t.hora,
    c.nombre + ' ' + c.apellido AS cliente,
    s.nombre AS servicio,
    t.estado
FROM turno AS t
INNER JOIN cliente AS c
    ON t.id_cliente = c.id_cliente
INNER JOIN servicio AS s
    ON t.id_servicio = s.id_servicio
WHERE t.fecha BETWEEN '2026-09-01' AND '2026-09-07'
ORDER BY t.fecha, t.hora;


-- Servicios activos
SELECT
    id_servicio,
    nombre,
    precio,
    duracion,
    descripcion
FROM servicio
WHERE estado = 1
ORDER BY nombre;

--Pagos de un turno
SELECT
    p.id_pago,
    p.tipo_pago,
    p.medio_pago,
    p.fecha,
    p.monto
FROM pago AS p
WHERE p.id_turno = 1
ORDER BY p.fecha;

-- Bloqueos de una fecha
SELECT
    fecha,
    hora
FROM bloqueo_horario
WHERE fecha = '2026-09-01'
ORDER BY hora;

--Turnos de un día incluyendo bloqueos
SELECT
    'Turno' AS tipo,
    t.hora,
    c.nombre + ' ' + c.apellido AS cliente,
    s.nombre AS servicio,
    t.estado
FROM turno AS t
INNER JOIN cliente AS c
    ON t.id_cliente = c.id_cliente
INNER JOIN servicio AS s
    ON t.id_servicio = s.id_servicio
WHERE t.fecha = '2026-09-01'

UNION ALL

SELECT
    'Bloqueado' AS tipo,
    b.hora,
    NULL AS cliente,
    NULL AS servicio,
    'Bloqueado' AS estado
FROM bloqueo_horario AS b
WHERE b.fecha = '2026-09-01'

ORDER BY hora;

--Verificar si una hora está bloqueada
SELECT COUNT(*) AS bloqueado
FROM bloqueo_horario
WHERE fecha = '2026-09-01'
  AND hora = '13:00';

--Verificar si ya existe un turno en una hora
SELECT COUNT(*) AS cantidad
FROM turno
WHERE fecha = '2026-09-01'
  AND hora = '10:00'
  AND estado <> 'Cancelado';

SELECT t.id_turno
FROM turno AS t
INNER JOIN servicio AS s
    ON t.id_servicio = s.id_servicio
WHERE t.fecha = '2026-09-01'
  AND t.estado <> 'Cancelado'
  AND '10:00' < DATEADD(MINUTE, s.duracion, CAST(t.hora AS DATETIME))
  AND DATEADD(MINUTE, 50, CAST('10:00' AS DATETIME))
      > CAST(t.hora AS DATETIME);

ALTER TABLE usuario
ALTER COLUMN contraseña VARCHAR(255) NOT NULL;
GO

----------------------------------------------------------------
-- MIGRACIÓN: precio acordado por turno (RF-20 / RN-06)
-- El precio del servicio puede cambiar con el tiempo; el turno debe
-- conservar el precio vigente al momento de la reserva, sin que se
-- vea afectado por cambios posteriores en servicio.precio.
----------------------------------------------------------------
ALTER TABLE turno
    ADD precio_acordado DECIMAL(10,2) NULL;
GO

UPDATE turno
SET precio_acordado = s.precio
FROM turno t
INNER JOIN servicio s ON t.id_servicio = s.id_servicio
WHERE t.precio_acordado IS NULL;
GO

ALTER TABLE turno
    ALTER COLUMN precio_acordado DECIMAL(10,2) NOT NULL;
GO














