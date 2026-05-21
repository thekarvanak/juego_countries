'use strict';
const express          = require('express');
const router           = express.Router();
const pool             = require('../config/database');
const { registrarLog } = require('../utils/logger');

// ─── Tabla de puntos por partida ganada ───────────────────────────────────────
/**
 * Calcula los puntos otorgados al ganar según el número de intentos usados.
 * Tabla definida en el enunciado:
 *   1 intento  → 100 pts
 *   2 intentos →  80 pts
 *   3 intentos →  60 pts
 *   4 intentos →  40 pts
 *   5 intentos →  20 pts
 *   6 intentos →  10 pts
 *   Derrota    →   0 pts (sin penalización)
 * @param {number} intentos
 * @returns {number}
 */
function calcularPuntos(intentos) {
    const tabla = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20, 6: 10 };
    return tabla[intentos] ?? 10;
}

/** Middleware: verifica que haya sesión activa */
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ ok: false, reason: 'no_session' });
    }
    next();
}

// ─── GET /api/scores/me ───────────────────────────────────────────────────────
/**
 * Devuelve el perfil de puntaje completo del usuario autenticado.
 */
router.get('/me', requireAuth, async (req, res) => {
    const { userId } = req.session.user;
    try {
        const [rows] = await pool.execute(
            `SELECT score, partidas_jugadas, partidas_ganadas, racha_actual, mejor_racha
             FROM puntajes WHERE usuario_id = ?`,
            [userId]
        );
        return res.json({ ok: true, scores: rows[0] || {} });
    } catch (err) {
        return res.status(500).json({ ok: false, error: 'Error al obtener puntaje' });
    }
});

// ─── GET /api/scores/leaderboard ─────────────────────────────────────────────
/**
 * Devuelve el Top 10 de jugadores ordenados por score descendente.
 * No requiere autenticación (es pública).
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT nickname, score, partidas_jugadas, partidas_ganadas, mejor_racha
             FROM puntajes
             ORDER BY score DESC
             LIMIT 10`
        );
        return res.json({ ok: true, leaderboard: rows });
    } catch (err) {
        return res.status(500).json({ ok: false, error: 'Error al obtener leaderboard' });
    }
});

// ─── POST /api/scores/record ──────────────────────────────────────────────────
/**
 * Registra el resultado de una partida terminada.
 * Actualiza estadísticas en `puntajes` e inserta una fila en `partidas`.
 * Usa transacción para garantizar consistencia.
 *
 * Body:
 *   won:      boolean  — true si ganó
 *   attempts: number   — intentos usados (1-6)
 *   word:     string   — palabra objetivo (nombre del país)
 */
router.post('/record', requireAuth, async (req, res) => {
    const { userId, nickname } = req.session.user;
    const { won, attempts, word } = req.body;

    // Validar input antes de tocar la BD
    if (typeof won !== 'boolean' ||
        !Number.isInteger(attempts) || attempts < 1 || attempts > 6 ||
        !word || typeof word !== 'string') {
        return res.status(400).json({ ok: false, error: 'Datos de partida inválidos' });
    }

    const puntos = won ? calcularPuntos(attempts) : 0;
    const conn   = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Bloquear la fila para actualización atómica (evita race conditions)
        const [scoreRows] = await conn.execute(
            `SELECT score, partidas_jugadas, partidas_ganadas, racha_actual, mejor_racha
             FROM puntajes WHERE usuario_id = ? FOR UPDATE`,
            [userId]
        );
        const cur = scoreRows[0];

        const newScore       = cur.score + puntos;
        const newJugadas     = cur.partidas_jugadas  + 1;
        const newGanadas     = won ? cur.partidas_ganadas + 1 : cur.partidas_ganadas;
        const newRacha       = won ? cur.racha_actual + 1 : 0;
        const newMejorRacha  = Math.max(cur.mejor_racha, newRacha);

        // Actualizar fila de puntaje
        await conn.execute(
            `UPDATE puntajes
             SET score = ?, partidas_jugadas = ?, partidas_ganadas = ?,
                 racha_actual = ?, mejor_racha = ?
             WHERE usuario_id = ?`,
            [newScore, newJugadas, newGanadas, newRacha, newMejorRacha, userId]
        );

        // Insertar historial de la partida
        await conn.execute(
            `INSERT INTO partidas
                (usuario_id, nickname, palabra_objetivo, intentos_usados, resultado, puntos_obtenidos)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, nickname, word.toUpperCase().substring(0, 10), attempts,
             won ? 'ganada' : 'perdida', puntos]
        );

        await conn.commit();

        // Registrar en logs (fuera de la transacción para no alargarla)
        registrarLog('INFO', nickname, won ? 'PARTIDA_GANADA' : 'PARTIDA_PERDIDA',
            `País: ${word.toUpperCase()} | Intentos: ${attempts}`,
            won ? `+${puntos} pts` : 'Sin puntos'
        );
        registrarLog('INFO', nickname, 'SCORE_ACTUALIZADO',
            `Score anterior: ${cur.score} | Delta: +${puntos}`,
            `Nuevo score: ${newScore}`
        );

        return res.json({
            ok:               true,
            delta:            puntos,
            newScore,
            partidas_jugadas: newJugadas,
            partidas_ganadas: newGanadas,
            racha_actual:     newRacha,
            mejor_racha:      newMejorRacha
        });

    } catch (err) {
        await conn.rollback();
        registrarLog('ERROR', nickname, 'ERROR_BD',
            `Error al registrar partida: ${err.message}`, 'FAIL');
        return res.status(500).json({ ok: false, error: 'Error al registrar la partida' });
    } finally {
        conn.release();
    }
});

module.exports = router;
