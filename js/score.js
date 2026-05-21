/**
 * score.js - Sistema de Puntuación con Persistencia (versión backend MySQL)
 *
 * Todos los métodos son async y se comunican con el servidor Express.
 * La interfaz externa es compatible con la versión localStorage, excepto
 * que ahora devuelven Promises — los callers usan await.
 *
 * Tabla de puntos por partida ganada (definida en routes/scores.js):
 *   Intento 1 → +100 pts
 *   Intento 2 →  +80 pts
 *   Intento 3 →  +60 pts
 *   Intento 4 →  +40 pts
 *   Intento 5 →  +20 pts
 *   Intento 6 →  +10 pts
 *   Derrota   →   +0 pts  (el puntaje nunca disminuye)
 *
 * Expone el objeto global window.Score.
 */
(function () {
    'use strict';

    // ─── API pública (async — todas devuelven Promises) ───────────────────────

    /**
     * Obtiene el puntaje del usuario autenticado desde el servidor.
     * @returns {Promise<number>}
     */
    async function getScore() {
        try {
            const resp = await fetch('/api/scores/me');
            if (!resp.ok) return 0;
            const data = await resp.json();
            return data.scores?.score ?? 0;
        } catch {
            return 0;
        }
    }

    /**
     * Registra el resultado de una partida en el servidor y actualiza estadísticas.
     *
     * @param {string}  nickname   - Nickname del jugador (el servidor usa la sesión)
     * @param {boolean} won        - true si ganó la partida
     * @param {number}  attempts   - Número de intentos usados (1-6)
     * @param {number}  wordLength - Longitud de la palabra (informativo)
     * @param {string}  word       - Palabra objetivo (nombre del país, para historial)
     * @returns {Promise<{delta, newScore, partidas_jugadas, partidas_ganadas, racha_actual}|null>}
     */
    async function recordGameResult(nickname, won, attempts, wordLength, word) {
        try {
            const resp = await fetch('/api/scores/record', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ won, attempts, word: word || 'DESCONOCIDA' })
            });
            if (!resp.ok) return null;
            const data = await resp.json();
            if (!data.ok) return null;

            // Actualizar caché local del usuario para reflejar el nuevo puntaje
            const currentUser = window.Auth?.getCurrentUser();
            if (currentUser) {
                currentUser.score            = data.newScore;
                currentUser.partidas_jugadas = data.partidas_jugadas;
                currentUser.partidas_ganadas = data.partidas_ganadas;
                currentUser.racha_actual     = data.racha_actual;
            }

            return data;
        } catch {
            return null;
        }
    }

    /**
     * Obtiene el Top 10 del leaderboard desde el servidor.
     * @returns {Promise<Array>}
     */
    async function getLeaderboard() {
        try {
            const resp = await fetch('/api/scores/leaderboard');
            if (!resp.ok) return [];
            const data = await resp.json();
            return data.leaderboard || [];
        } catch {
            return [];
        }
    }

    // ─── Exponer API global ───────────────────────────────────────────────────
    window.Score = { getScore, recordGameResult, getLeaderboard };

})();
