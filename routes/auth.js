'use strict';
const express          = require('express');
const router           = express.Router();
const pool             = require('../config/database');
const { registrarLog } = require('../utils/logger');

/** Nickname válido: 3-20 caracteres alfanuméricos o guión bajo, minúsculas */
const NICKNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
/**
 * Inicia sesión o registra el usuario automáticamente.
 * Body: { nickname: string }
 *
 * Flujo:
 *   1. Valida el formato del nickname (previene caracteres peligrosos).
 *   2. Busca el usuario en `usuarios`.
 *   3. Si existe  → login directo.
 *   4. Si no existe → INSERT en `usuarios` + INSERT en `puntajes` (registro automático).
 *   5. Guarda userId y nickname en req.session.
 *   6. Retorna datos del usuario + perfil de puntaje.
 */
router.post('/login', async (req, res) => {
    const nickname = String(req.body.nickname || '').trim().toLowerCase();

    // Validar formato (barrera principal contra SQL injection y XSS)
    if (!NICKNAME_REGEX.test(nickname)) {
        return res.status(400).json({
            ok:      false,
            reason:  'invalid_format',
            message: 'El nickname debe tener entre 3 y 20 caracteres (letras minúsculas, números o _)'
        });
    }

    try {
        // Buscar usuario existente (query parametrizada)
        const [rows] = await pool.execute(
            'SELECT id FROM usuarios WHERE nickname = ?',
            [nickname]
        );

        let userId;
        let isNew = false;

        if (rows.length > 0) {
            // Usuario existente → login directo
            userId = rows[0].id;
        } else {
            // Usuario nuevo → registrar automáticamente
            const [ins] = await pool.execute(
                'INSERT INTO usuarios (nickname) VALUES (?)',
                [nickname]
            );
            userId = ins.insertId;
            isNew  = true;

            // Crear fila de puntaje inicial
            await pool.execute(
                'INSERT INTO puntajes (usuario_id, nickname) VALUES (?, ?)',
                [userId, nickname]
            );
        }

        // Obtener perfil de puntaje actual
        const [scoreRows] = await pool.execute(
            `SELECT score, partidas_jugadas, partidas_ganadas, racha_actual, mejor_racha
             FROM puntajes WHERE usuario_id = ?`,
            [userId]
        );
        const scoreData = scoreRows[0] || {
            score: 0, partidas_jugadas: 0, partidas_ganadas: 0,
            racha_actual: 0, mejor_racha: 0
        };

        // Guardar sesión en el servidor
        req.session.user = { userId, nickname };

        // Cookie no-httponly para detección de flash en el cliente (previene
        // que se muestre el overlay de login a usuarios ya autenticados)
        res.cookie('rce_has_session', '1', {
            maxAge:   7 * 24 * 60 * 60 * 1000,
            httpOnly: false,
            sameSite: 'lax'
        });

        // Registrar evento en logs
        const accion = isNew ? 'LOGIN_NUEVO_USUARIO' : 'LOGIN_EXITOSO';
        registrarLog('INFO', nickname, accion,
            isNew ? 'Nuevo usuario registrado automáticamente' : 'Inicio de sesión exitoso',
            'OK'
        );

        return res.json({
            ok:   true,
            isNew,
            user: { userId, nickname, ...scoreData }
        });

    } catch (err) {
        registrarLog('ERROR', nickname, 'ERROR_BD', `Error en login: ${err.message}`, 'FAIL');
        return res.status(500).json({ ok: false, error: 'Error al procesar el login' });
    }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
/**
 * Destruye la sesión del servidor y borra la cookie de flash.
 */
router.post('/logout', async (req, res) => {
    const nickname = req.session.user?.nickname || 'SISTEMA';
    registrarLog('WARN', nickname, 'LOGOUT', 'El usuario cerró sesión', 'OK');

    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ ok: false, error: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid');
        res.clearCookie('rce_has_session');
        return res.json({ ok: true });
    });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
/**
 * Devuelve el usuario autenticado y su perfil de puntaje.
 * Retorna 401 si no hay sesión activa.
 */
router.get('/me', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ ok: false, reason: 'no_session' });
    }

    const { userId, nickname } = req.session.user;

    try {
        const [rows] = await pool.execute(
            `SELECT score, partidas_jugadas, partidas_ganadas, racha_actual, mejor_racha
             FROM puntajes WHERE usuario_id = ?`,
            [userId]
        );
        const scoreData = rows[0] || {
            score: 0, partidas_jugadas: 0, partidas_ganadas: 0,
            racha_actual: 0, mejor_racha: 0
        };
        return res.json({ ok: true, user: { userId, nickname, ...scoreData } });
    } catch (err) {
        return res.status(500).json({ ok: false, error: 'Error al obtener sesión' });
    }
});

module.exports = router;
