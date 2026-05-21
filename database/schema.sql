-- ============================================================
-- REST Countries Explorer — Wordle DB Schema
-- Motor: MySQL 5.7+ / MariaDB 10.3+
-- Ejecutar en phpMyAdmin o en el cliente MySQL de XAMPP
-- ============================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS wordle_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE wordle_db;

-- ─── Tabla de usuarios ────────────────────────────────────────────────────────
-- Almacena cada nickname único registrado en la aplicación.
CREATE TABLE IF NOT EXISTS usuarios (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nickname       VARCHAR(50) NOT NULL UNIQUE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Tabla de puntajes ────────────────────────────────────────────────────────
-- Una fila por usuario; se actualiza en cada partida terminada.
CREATE TABLE IF NOT EXISTS puntajes (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id          INT         NOT NULL,
    nickname            VARCHAR(50) NOT NULL,
    score               INT         DEFAULT 0,
    partidas_jugadas    INT         DEFAULT 0,
    partidas_ganadas    INT         DEFAULT 0,
    mejor_racha         INT         DEFAULT 0,
    racha_actual        INT         DEFAULT 0,
    fecha_actualizacion DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ─── Tabla de historial de partidas ──────────────────────────────────────────
-- Registra el detalle de cada partida individual (ganada o perdida).
CREATE TABLE IF NOT EXISTS partidas (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT          NOT NULL,
    nickname         VARCHAR(50)  NOT NULL,
    palabra_objetivo VARCHAR(10)  NOT NULL,
    intentos_usados  INT          NOT NULL,
    resultado        ENUM('ganada', 'perdida') NOT NULL,
    puntos_obtenidos INT          DEFAULT 0,
    fecha            DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ─── Tabla de logs del sistema ────────────────────────────────────────────────
-- Registra todos los eventos relevantes de la aplicación.
-- Formato de cada fila equivale a:
--   [YYYY-MM-DD HH:MM:SS] | NIVEL | NICKNAME | ACCIÓN | DETALLE | RESULTADO
CREATE TABLE IF NOT EXISTS logs (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    nivel     ENUM('INFO', 'WARN', 'ERROR') NOT NULL,
    nickname  VARCHAR(50)  DEFAULT 'SISTEMA',
    accion    VARCHAR(100) NOT NULL,
    detalle   TEXT,
    resultado VARCHAR(50),
    fecha     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índice para acelerar consultas frecuentes de logs por fecha
CREATE INDEX IF NOT EXISTS idx_logs_fecha    ON logs (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_logs_nickname ON logs (nickname);
