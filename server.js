'use strict';
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');

const authRoutes   = require('./routes/auth');
const gameRoutes   = require('./routes/game');
const scoresRoutes = require('./routes/scores');
const logsRoutes   = require('./routes/logs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sesiones del lado del servidor
// MemoryStore es adecuado para desarrollo local con XAMPP
app.use(session({
    secret:            process.env.SESSION_SECRET || 'rce_dev_secret_changeme',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure:   false,   // cambiar a true en producción con HTTPS
        maxAge:   7 * 24 * 60 * 60 * 1000  // 7 días
    }
}));

// ─── Archivos estáticos del frontend ─────────────────────────────────────────
// Solo se exponen los directorios públicos del cliente.
// server.js, config/, routes/ y utils/ NO son accesibles desde el navegador.
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js',  express.static(path.join(__dirname, 'js')));

// Página principal — index.html se sirve en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Rutas de la API REST ─────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/game',   gameRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/logs',   logsRoutes);

// ─── Manejador de errores global ──────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err.stack || err.message);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
});

// ─── Arrancar servidor ────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅  Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋  MySQL debe estar activo en ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
    console.log(`    Base de datos: ${process.env.DB_NAME || 'wordle_db'}\n`);
});
