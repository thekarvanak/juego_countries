/**
 * logger.js - Sistema de Logs del Juego (versión backend MySQL)
 *
 * Envía eventos al servidor Express para que los persista en la tabla `logs`.
 * La interfaz es idéntica a la versión localStorage para que el resto
 * del código no requiera cambios.
 *
 * Formato de cada línea en BD:
 *   [YYYY-MM-DD HH:MM:SS] | NIVEL | NICKNAME | ACCIÓN | DETALLE | RESULTADO
 *
 * Expone el objeto global window.Logger.
 */
(function () {
    'use strict';

    // ─── API pública ──────────────────────────────────────────────────────────

    /**
     * Envía un evento de log al servidor de forma asíncrona y no-bloqueante.
     * Usa Promise.resolve().then() para diferir al siguiente microtask
     * y no retardar el hilo principal.
     *
     * @param {string} level    - INFO | WARN | ERROR
     * @param {string} nickname - Nickname del usuario (o 'SISTEMA')
     * @param {string} action   - Código de acción (LOGIN_EXITOSO, GAME_END, etc.)
     * @param {string} detail   - Descripción legible del evento
     * @param {string} result   - Resultado: OK, FAIL, etc.
     */
    function log(level, nickname, action, detail, result) {
        Promise.resolve().then(async () => {
            try {
                await fetch('/api/logs/add', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ level, nickname, action, detail, result })
                });
            } catch (err) {
                // El logger nunca debe romper la app
                console.warn('[Logger] Error al enviar log al servidor:', err.message);
            }
        });
    }

    /**
     * Consulta los logs al servidor y los descarga como archivo .log
     */
    async function downloadLogs() {
        try {
            const resp = await fetch('/api/logs?limit=200');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();

            if (!data.logs || data.logs.length === 0) {
                alert('No hay registros de log para descargar.');
                return;
            }

            const header = [
                '# REST Countries Explorer - Game Logs',
                `# Generado: ${new Date().toISOString()}`,
                `# Entradas: ${data.logs.length}`,
                '# Formato: [FECHA] | NIVEL | NICKNAME             | ACCIÓN               | DETALLE | RESULTADO',
                '='.repeat(110),
                ''
            ].join('\n');

            const lines = data.logs.map(l =>
                `[${l.fecha}] | ${String(l.nivel).padEnd(5)} | ${String(l.nickname).padEnd(20)} | ` +
                `${String(l.accion).padEnd(20)} | ${l.detalle} | ${l.resultado}`
            );

            const blob = new Blob([header + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `game-log-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.log`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('[Logger] Error al descargar logs:', err.message);
            alert('No se pudieron descargar los logs. Intenta nuevamente.');
        }
    }

    /**
     * Obtiene los logs del servidor (devuelve Promise<Array>).
     * @param {Object} filters - { nivel?, nickname?, limit? }
     * @returns {Promise<Array>}
     */
    async function getLogs(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const resp   = await fetch(`/api/logs${params ? '?' + params : ''}`);
            const data   = await resp.json();
            return data.logs || [];
        } catch {
            return [];
        }
    }

    /**
     * No aplica en la versión MySQL (los logs se gestionan desde el servidor).
     */
    function clearLogs() {
        console.warn('[Logger] clearLogs no disponible en la versión MySQL.');
    }

    // Atajos para los niveles más comunes
    const info  = (nick, action, detail, result = 'OK')    => log('INFO',  nick, action, detail, result);
    const warn  = (nick, action, detail, result = 'WARN')  => log('WARN',  nick, action, detail, result);
    const error = (nick, action, detail, result = 'ERROR') => log('ERROR', nick, action, detail, result);

    // ─── Exponer API global ───────────────────────────────────────────────────
    window.Logger = { log, info, warn, error, downloadLogs, clearLogs, getLogs };

})();
