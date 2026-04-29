/**
 * wordle-api.js - Obtención de países desde la API para el juego Wordle
 * 
 * Este módulo obtiene datos reales de la API REST Countries y selecciona
 * un país aleatorio válido para el juego.
 */

const API_BASE_URL = 'https://restcountries.com/v3.1';

/**
 * Obtiene todos los países con campos necesarios para Wordle
 * @returns {Promise<Array>} Array de países con nombres y banderas
 */
export async function fetchCountriesForWordle() {
    try {
        const url = `${API_BASE_URL}/all?fields=name,translations,flags`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('La API no devolvió países válidos.');
        }

        return data;
    } catch (error) {
        console.error('Error al obtener países para Wordle:', error);
        throw error;
    }
}

/**
 * Normaliza un string eliminando tildes y convirtiendo a mayúsculas
 * @param {string} s - String a normalizar
 * @returns {string} String normalizado
 */
function normalize(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

/**
 * Selecciona un país aleatorio válido para el juego
 * @param {Array} countries - Array de países obtenidos de la API
 * @param {number} minLength - Longitud mínima de la palabra (default: 4)
 * @param {number} maxLength - Longitud máxima de la palabra (default: 12)
 * @returns {Object} Objeto con nombreEs, nombreReal, bandera y palabra normalizada
 */
export function pickRandomCountry(countries, minLength = 4, maxLength = 12) {
    // Filtrar y transformar países válidos
    const filtered = countries
        .map(country => ({
            nombreEs: country.translations?.spa?.common || country.name?.common || '',
            nombreReal: country.translations?.spa?.common || country.name?.common || '',
            bandera: country.flags?.png || country.flags?.svg || ''
        }))
        .filter(country => {
            // Normalizar y eliminar espacios
            const word = normalize(country.nombreEs).replace(/\s/g, '');
            
            // Validar longitud y que solo contenga letras
            return word.length >= minLength && 
                   word.length <= maxLength && 
                   /^[A-Z]+$/.test(word);
        });

    if (filtered.length === 0) {
        throw new Error('No hay países válidos para el juego.');
    }

    // Seleccionar país aleatorio
    const randomIndex = Math.floor(Math.random() * filtered.length);
    const selected = filtered[randomIndex];

    // Retornar con palabra normalizada sin espacios
    return {
        nombreEs: selected.nombreEs,
        nombreReal: selected.nombreReal,
        bandera: selected.bandera,
        palabra: normalize(selected.nombreEs).replace(/\s/g, '')
    };
}

// ============================================
// PRUEBA MANUAL EN CONSOLA DEL NAVEGADOR
// ============================================
/*
import('./js/wordle-api.js').then(m => {
    m.fetchCountriesForWordle().then(data => {
        console.log('Países obtenidos:', data.length);
        const pais = m.pickRandomCountry(data);
        console.log('País seleccionado:', pais);
        console.log('Palabra secreta:', pais.palabra);
        console.log('Longitud:', pais.palabra.length);
    });
});
*/
