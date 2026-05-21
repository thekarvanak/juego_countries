'use strict';
const pool = require('../config/database');

/**
 * utils/logger.js — Módulo de logging a la base de datos MySQL
 *
 * Inserta eventos en la tabla `logs`. Diseñado para ser no-bloqueante:
 * los errores del propio logger nunca interrumpen el flujo de la aplicación.
 *
 * Uso:
 *   const { registrarLog } = require('./utils/logger');
 *   await registrarLog('INFO', 'juan123', 'LOGIN_EXITOSO', 'Inicio de sesión', 'OK');
 *
 * Eventos obligatorios definidos en el enunciado:
 *   LOGIN_EXITOSO       - Usuario inició sesión (nick ya existía)
 *   LOGIN_NUEVO_USUARIO - Nickname nuevo registrado automáticamente
 *   LOGOUT              - Usuario cerró sesión
 *   PARTIDA_INICIADA    - Se comenzó una nueva partida (wordLength)
 *   INTENTO_REALIZADO   - Cada palabra ingresada por el jugador
 *   PARTIDA_GANADA      - Partida terminada con victoria + puntos obtenidos
 *   PARTIDA_PERDIDA     - Partida terminada sin adivinar la palabra
 *   SCORE_ACTUALIZADO   - Actualización de puntaje en BD
 *   ERROR_BD            - Fallo de conexión o query a la BD
 *   ERROR_GENERAL       - Excepción no controlada
 *
 * @param {string} nivel     - 'INFO' | 'WARN' | 'ERROR'
 * @param {string} nickname  - Nickname del usuario o 'SISTEMA'
 * @param {string} accion    - Código de la acción (ver lista arriba)
 * @param {string} detalle   - Descripción legible del evento
 * @param {string} resultado - 'OK', 'FAIL', o descripción breve del resultado
 */
async function registrarLog(nivel, nickname, accion, detalle, resultado) {
    try {
        await pool.execute(
            `INSERT INTO logs (nivel, nickname, accion, detalle, resultado)
             VALUES (?, ?, ?, ?, ?)`,
            [
                nivel,
                String(nickname  || 'SISTEMA').substring(0, 50),
                String(accion    || '').substring(0, 100),
                String(detalle   || ''),
                String(resultado || '').substring(0, 50)
            ]
        );
    } catch (err) {
        // El logger nunca debe romper la aplicación principal
        console.error('[LOGGER ERROR] No se pudo insertar log en BD:', err.message);
    }
}

module.exports = { registrarLog };
