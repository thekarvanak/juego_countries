'use strict';
const mysql = require('mysql2/promise');

/**
 * Pool de conexiones MySQL.
 * Usa las variables de entorno definidas en .env (cargadas por dotenv en server.js).
 *
 * connectionLimit: número máximo de conexiones simultáneas al pool.
 * waitForConnections: encola peticiones en lugar de fallar cuando el pool está lleno.
 */
const pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT || '3306', 10),
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'wordle_db',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           '+00:00'   // almacenar fechas en UTC
});

module.exports = pool;
