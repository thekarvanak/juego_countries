/**
 * filters.js - Módulo de Filtrado y Búsqueda
 * 
 * Este módulo contiene la lógica para filtrar y ordenar países según
 * los criterios de búsqueda y selección del usuario.
 */

/**
 * Estado de filtros de la aplicación
 */
const filterState = {
    searchTerm: '',
    region: '',
    sortBy: 'name'
};

/**
 * Actualiza el estado de búsqueda
 * @param {string} term - Término de búsqueda
 */
function updateSearchTerm(term) {
    filterState.searchTerm = term.toLowerCase().trim();
}

/**
 * Actualiza el estado de región
 * @param {string} region - Región seleccionada
 */
function updateRegion(region) {
    filterState.region = region;
}

/**
 * Actualiza el criterio de ordenamiento
 * @param {string} sortBy - Criterio de ordenamiento (name, population, area)
 */
function updateSortBy(sortBy) {
    filterState.sortBy = sortBy;
}

/**
 * Restablece todos los filtros a sus valores por defecto
 */
function resetFilters() {
    filterState.searchTerm = '';
    filterState.region = '';
    filterState.sortBy = 'name';
}

/**
 * Obtiene el estado actual de los filtros
 * @returns {Object} Estado actual de filtros
 */
function getFilterState() {
    return { ...filterState };
}

/**
 * Filtra países por término de búsqueda
 * @param {Array} countries - Array de países
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Array} Países filtrados
 */
function filterBySearch(countries, searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return countries;
    }

    const term = searchTerm.toLowerCase().trim();

    return countries.filter(country => {
        const commonName = country.name?.common?.toLowerCase() || '';
        const officialName = country.name?.official?.toLowerCase() || '';
        const capital = country.capital?.[0]?.toLowerCase() || '';

        return commonName.includes(term) || 
               officialName.includes(term) || 
               capital.includes(term);
    });
}

/**
 * Filtra países por región
 * @param {Array} countries - Array de países
 * @param {string} region - Región a filtrar
 * @returns {Array} Países filtrados
 */
function filterByRegion(countries, region) {
    if (!region || region.trim().length === 0) {
        return countries;
    }

    const filtered = countries.filter(country => country.region === region);
    
    return filtered;
}

/**
 * Ordena países según el criterio especificado
 * @param {Array} countries - Array de países
 * @param {string} sortBy - Criterio de ordenamiento
 * @returns {Array} Países ordenados
 */
function sortCountries(countries, sortBy) {
    // Crear una copia para no mutar el array original
    const sorted = [...countries];

    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => {
                const nameA = a.name?.common || '';
                const nameB = b.name?.common || '';
                return nameA.localeCompare(nameB);
            });
            break;

        case 'population':
            sorted.sort((a, b) => {
                const popA = a.population || 0;
                const popB = b.population || 0;
                return popB - popA; // Mayor a menor
            });
            break;

        case 'area':
            sorted.sort((a, b) => {
                const areaA = a.area || 0;
                const areaB = b.area || 0;
                return areaB - areaA; // Mayor a menor
            });
            break;

        default:
            // Por defecto, ordenar por nombre
            sorted.sort((a, b) => {
                const nameA = a.name?.common || '';
                const nameB = b.name?.common || '';
                return nameA.localeCompare(nameB);
            });
    }

    return sorted;
}

/**
 * Aplica todos los filtros y ordenamiento a un array de países
 * @param {Array} countries - Array de países
 * @returns {Array} Países filtrados y ordenados
 */
function applyFilters(countries) {
    if (!countries || !Array.isArray(countries)) {
        return [];
    }

    let filtered = countries;

    // Aplicar filtro de búsqueda
    if (filterState.searchTerm) {
        filtered = filterBySearch(filtered, filterState.searchTerm);
    }

    // Aplicar filtro de región
    if (filterState.region) {
        filtered = filterByRegion(filtered, filterState.region);
    }

    // Aplicar ordenamiento
    filtered = sortCountries(filtered, filterState.sortBy);

    return filtered;
}

/**
 * Valida si hay algún filtro activo
 * @returns {boolean} true si hay filtros activos
 */
function hasActiveFilters() {
    return filterState.searchTerm.length > 0 || 
           filterState.region.length > 0 || 
           filterState.sortBy !== 'name';
}

/**
 * Crea un debounce para optimizar búsquedas
 * @param {Function} func - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {Function} Función debounced
 */
function debounce(func, delay = 300) {
    let timeoutId;
    
    return function(...args) {
        // Limpiar timeout anterior
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Crear nuevo timeout
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}
