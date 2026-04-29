/**
 * api.js - Módulo de Comunicación con REST Countries API
 * 
 * Este módulo contiene todas las funciones para interactuar con la API REST Countries.
 * Todas las peticiones usan async/await con manejo de errores try/catch.
 * Se valida response.ok antes de parsear y se usan parámetros fields para optimizar.
 */

// Constante base de la API
const API_BASE_URL = 'https://restcountries.com/v3.1';

/**
 * Obtiene todos los países con los campos esenciales
 * @returns {Promise<Array>} Array de países
 */
async function getAllCountries() {
    try {
        const fields = 'name,capital,region,subregion,population,area,flags,cca3';
        const url = `${API_BASE_URL}/all?fields=${fields}`;
        
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

        // Validar que sea un array no vacío
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('La respuesta de la API no contiene países');
        }

        return data;
    } catch (error) {
        console.error('Error al obtener todos los países:', error);
        throw error;
    }
}

/**
 * Busca países por nombre (común u oficial)
 * @param {string} name - Nombre del país a buscar
 * @returns {Promise<Array>} Array de países que coinciden con la búsqueda
 */
async function searchCountriesByName(name) {
    try {
        if (!name || name.trim().length === 0) {
            throw new Error('El nombre del país no puede estar vacío');
        }

        const fields = 'name,capital,region,subregion,population,area,flags,cca3';
        const url = `${API_BASE_URL}/name/${encodeURIComponent(name.trim())}?fields=${fields}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return []; // No se encontraron países
            }
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Formato de respuesta inválido');
        }

        return data;
    } catch (error) {
        console.error('Error al buscar países por nombre:', error);
        throw error;
    }
}

/**
 * Obtiene países por región
 * @param {string} region - Región a filtrar (Africa, Americas, Asia, Europe, Oceania)
 * @returns {Promise<Array>} Array de países de la región especificada
 */
async function getCountriesByRegion(region) {
    try {
        if (!region || region.trim().length === 0) {
            throw new Error('La región no puede estar vacía');
        }

        const fields = 'name,capital,region,subregion,population,area,flags,cca3';
        const url = `${API_BASE_URL}/region/${encodeURIComponent(region.trim())}?fields=${fields}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return []; // No se encontraron países en esa región
            }
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        return data;
    } catch (error) {
        console.error('Error al obtener países por región:', error);
        throw error;
    }
}

/**
 * Obtiene información detallada de un país específico por código
 * @param {string} code - Código del país (cca3, cca2, o ccn3)
 * @returns {Promise<Object>} Objeto con toda la información del país
 */
async function getCountryByCode(code) {
    try {
        if (!code || code.trim().length === 0) {
            throw new Error('El código del país no puede estar vacío');
        }

        // Para detalles, solicitamos más campos
        const fields = 'name,capital,region,subregion,population,area,flags,cca3,languages,currencies,timezones,borders,latlng,maps,independent,unMember,fifa';
        const url = `${API_BASE_URL}/alpha/${encodeURIComponent(code.trim())}?fields=${fields}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('País no encontrado');
            }
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || typeof data !== 'object') {
            throw new Error('Formato de respuesta inválido');
        }

        return data;
    } catch (error) {
        console.error('Error al obtener país por código:', error);
        throw error;
    }
}

/**
 * Obtiene múltiples países por sus códigos
 * @param {Array<string>} codes - Array de códigos de países
 * @returns {Promise<Array>} Array de países
 */
async function getCountriesByCodes(codes) {
    try {
        if (!Array.isArray(codes) || codes.length === 0) {
            return [];
        }

        // Filtrar códigos válidos
        const validCodes = codes.filter(code => code && code.trim().length > 0);
        
        if (validCodes.length === 0) {
            return [];
        }

        const fields = 'name,flags,cca3';
        const codesParam = validCodes.map(c => c.trim()).join(',');
        const url = `${API_BASE_URL}/alpha?codes=${encodeURIComponent(codesParam)}&fields=${fields}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            return [];
        }

        return data;
    } catch (error) {
        console.error('Error al obtener países por códigos:', error);
        // No lanzamos el error aquí para no romper la app si falla la carga de fronteras
        return [];
    }
}

// ============================================
// EJEMPLOS DE USO (para pruebas en consola)
// ============================================

/*
// Ejemplo 1: Obtener todos los países
getAllCountries()
    .then(countries => {
        console.log('Total de países:', countries.length);
        console.log('Primer país:', countries[0]);
    })
    .catch(error => console.error('Error:', error));

// Ejemplo 2: Buscar países por nombre
searchCountriesByName('spain')
    .then(countries => {
        console.log('Países encontrados:', countries.length);
        console.log('Resultados:', countries);
    })
    .catch(error => console.error('Error:', error));

// Ejemplo 3: Obtener países de Europa
getCountriesByRegion('Europe')
    .then(countries => {
        console.log('Países en Europa:', countries.length);
        console.log('Primeros 3:', countries.slice(0, 3));
    })
    .catch(error => console.error('Error:', error));

// Ejemplo 4: Obtener detalles de España
getCountryByCode('ESP')
    .then(country => {
        console.log('País:', country.name.common);
        console.log('Capital:', country.capital);
        console.log('Población:', country.population);
        console.log('Idiomas:', country.languages);
    })
    .catch(error => console.error('Error:', error));

// Ejemplo 5: Obtener múltiples países por códigos
getCountriesByCodes(['ESP', 'FRA', 'ITA'])
    .then(countries => {
        console.log('Países obtenidos:', countries.length);
        countries.forEach(c => console.log(c.name.common));
    })
    .catch(error => console.error('Error:', error));
*/
