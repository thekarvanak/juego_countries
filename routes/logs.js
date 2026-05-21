'use strict';
const express          = require('express');
const router           = express.Router();
const pool             = require('../config/database');
const { registrarLog } = require('../utils/logger');

// ─── POST /api/logs/add ───────────────────────────────────────────────────────
/**
 * Recibe un evento de log desde el cliente (frontend) y lo persiste en BD.
 * No requiere autenticación para que los errores pre-login también se registren.
 * Body: { level, nickname, action, detail, result }
 */
router.post('/add', async (req, res) => {
    const { level, nickname, action, detail, result } = req.body;

    const VALID_LEVELS = ['INFO', 'WARN', 'ERROR'];
    const nivel = String(level || 'INFO').toUpperCase();

    if (!VALID_LEVELS.includes(nivel)) {
        return res.status(400).json({ ok: false, error: 'Nivel de log inválido' });
    }

    // registrarLog es no-bloqueante (captura sus propios errores internamente)
    registrarLog(nivel, nickname, action, detail, result);
    return res.json({ ok: true });
});

// ─── GET /api/logs ────────────────────────────────────────────────────────────
/**
 * Devuelve los últimos registros de log con filtros opcionales.
 * Disponible para mostrar en la interfaz de administración.
 *
 * Query params (todos opcionales):
 *   nivel    — INFO | WARN | ERROR
 *   nickname — filtro parcial (LIKE %nickname%)
 *   limit    — número de filas (default 50, máximo 200)
 */
router.get('/', async (req, res) => {
    const { nivel, nickname } = req.query;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    // Construir cláusula WHERE con parámetros (previene SQL injection)
    const conditions = [];
    const params     = [];

    if (nivel && ['INFO', 'WARN', 'ERROR'].includes(nivel.toUpperCase())) {
        conditions.push('nivel = ?');
        params.push(nivel.toUpperCase());
    }
    if (nickname && typeof nickname === 'string' && nickname.trim()) {
        conditions.push('nickname LIKE ?');
        params.push(`%${nickname.trim().substring(0, 50)}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    try {
        const [rows] = await pool.execute(
            `SELECT id, nivel, nickname, accion, detalle, resultado,
                    DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') AS fecha
             FROM logs
             ${where}
             ORDER BY fecha DESC
             LIMIT ?`,
            params
        );
        return res.json({ ok: true, logs: rows });
    } catch (err) {
        return res.status(500).json({ ok: false, error: 'Error al obtener logs' });
    }
});

module.exports = router;
