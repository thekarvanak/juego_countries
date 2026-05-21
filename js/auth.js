/**
 * auth.js - Sistema de Autenticación por Nickname (versión backend MySQL)
 *
 * Comunica con el servidor Express en lugar de usar localStorage.
 * La sesión es gestionada por express-session en el servidor.
 *
 * API pública (interfaz idéntica a la versión localStorage):
 *   window.Auth.init()           → Promise<user|null>  — llamar con await al iniciar
 *   window.Auth.getCurrentUser() → user|null           — síncrono, usa caché
 *   window.Auth.login(nickname)  → Promise<{ok, isNew?, user?, reason?, message?>}
 *   window.Auth.logout()         → Promise<void>
 *   window.Auth.refresh()        → Promise<user|null>
 *
 * Expone el objeto global window.Auth.
 */
(function () {
    'use strict';

    /** Caché de la sesión activa; se llena mediante init() */
    let _currentUser = null;

    // ─── API pública ──────────────────────────────────────────────────────────

    /**
     * Inicializa el módulo verificando la sesión activa con el servidor.
     * DEBE llamarse con `await` en initApp() antes de usar getCurrentUser().
     * @returns {Promise<Object|null>} Usuario autenticado o null
     */
    async function init() {
        try {
            const resp = await fetch('/api/auth/me');
            if (resp.ok) {
                const data = await resp.json();
                if (data.ok) {
                    _currentUser = data.user;
                    return _currentUser;
                }
            }
        } catch (err) {
            console.warn('[Auth] No se pudo verificar la sesión:', err.message);
        }
        _currentUser = null;
        return null;
    }

    /**
     * Retorna el usuario en caché (válido solo después de await init()).
     * Mantiene la misma firma síncrona que la versión localStorage.
     * @returns {Object|null}
     */
    function getCurrentUser() {
        return _currentUser;
    }

    /**
     * Inicia sesión o registra automáticamente el usuario en el servidor.
     * @param {string} nickname
     * @returns {Promise<{ok: boolean, isNew?: boolean, user?: Object, reason?: string, message?: string}>}
     */
    async function login(nickname) {
        try {
            const resp = await fetch('/api/auth/login', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ nickname: String(nickname || '').trim().toLowerCase() })
            });
            const data = await resp.json();
            if (data.ok) {
                _currentUser = data.user;
            }
            return data;
        } catch (err) {
            return {
                ok:      false,
                reason:  'network_error',
                message: 'Error de conexión. Verifica que el servidor esté corriendo en http://localhost:3000'
            };
        }
    }

    /**
     * Cierra la sesión en el servidor y limpia el caché local.
     * @returns {Promise<void>}
     */
    async function logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
            console.warn('[Auth] Error al cerrar sesión:', err.message);
        }
        _currentUser = null;
    }

    /**
     * Refresca los datos del usuario desde el servidor.
     * Útil después de que el puntaje haya cambiado.
     * @returns {Promise<Object|null>}
     */
    async function refresh() {
        return init();
    }

    // ─── Exponer API global ───────────────────────────────────────────────────
    window.Auth = { init, getCurrentUser, login, logout, refresh };

})();
