'use strict';
const express          = require('express');
const router           = express.Router();
const { registrarLog } = require('../utils/logger');

/** Middleware: verifica que haya sesión activa */
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ ok: false, reason: 'no_session' });
    }
    next();
}

// ─── POST /api/game/start ─────────────────────────────────────────────────────
/**
 * Registra el inicio de una nueva partida en los logs.
 * La lógica del juego (selección de palabra, validación) permanece en el cliente.
 * Body: { wordLength: number }
 */
router.post('/start', requireAuth, async (req, res) => {
    const { nickname } = req.session.user;
    const wordLength   = parseInt(req.body.wordLength, 10) || 0;

    registrarLog('INFO', nickname, 'PARTIDA_INICIADA',
        `Nueva partida iniciada. Longitud de la palabra: ${wordLength} letras`, 'OK');

    return res.json({ ok: true });
});

// ─── POST /api/game/attempt ───────────────────────────────────────────────────
/**
 * Registra cada intento del jugador en los logs.
 * Body: { attempt: string }
 */
router.post('/attempt', requireAuth, async (req, res) => {
    const { nickname } = req.session.user;
    const attempt = String(req.body.attempt || '').toUpperCase().trim();

    // Validar que el intento solo contenga letras (A-Z, Ñ)
    if (!attempt || !/^[A-ZÁÉÍÓÚÑÜ]+$/.test(attempt)) {
        return res.status(400).json({ ok: false, error: 'Intento inválido' });
    }

    registrarLog('INFO', nickname, 'INTENTO_REALIZADO',
        `Palabra ingresada: ${attempt}`, 'OK');

    return res.json({ ok: true });
});

module.exports = router;
