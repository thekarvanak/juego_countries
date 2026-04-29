/**
 * main.js - Punto de Entrada de la Aplicación
 * 
 * Este archivo inicializa la aplicación, configura los event listeners
 * y coordina la interacción entre todos los módulos.
 */

// Estado global de la aplicación
const appState = {
    allCountries: [],
    filteredCountries: [],
    isLoading: false
};

// Referencias a elementos del DOM
let searchInput = null;
let regionFilter = null;
let sortFilter = null;
let resetButton = null;
let retryButton = null;
let countriesGrid = null;
let loadingIndicator = null;
let errorMessage = null;
let resultsInfo = null;

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * Inicializa todos los componentes de la aplicación
 */
async function initApp() {
    try {
        // Inicializar referencias del DOM
        initDOMReferences();

        // Inicializar modal
        initModal();

        // Configurar event listeners
        setupEventListeners();

        // Cargar datos iniciales
        await loadInitialData();

    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        handleError(error);
    }
}

/**
 * Inicializa las referencias a elementos del DOM
 */
function initDOMReferences() {
    searchInput = document.getElementById('searchInput');
    regionFilter = document.getElementById('regionFilter');
    sortFilter = document.getElementById('sortFilter');
    resetButton = document.getElementById('resetButton');
    retryButton = document.getElementById('retryButton');
    countriesGrid = document.getElementById('countriesGrid');
    loadingIndicator = document.getElementById('loadingIndicator');
    errorMessage = document.getElementById('errorMessage');
    resultsInfo = document.getElementById('resultsInfo');

    // Validar que todos los elementos existen
    const requiredElements = {
        searchInput,
        regionFilter,
        sortFilter,
        resetButton,
        retryButton,
        countriesGrid,
        loadingIndicator,
        errorMessage,
        resultsInfo
    };

    for (const [name, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(`Elemento requerido no encontrado: ${name}`);
        }
    }
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Búsqueda con debounce
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            updateSearchTerm(searchInput.value);
            applyFiltersAndRender();
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    }

    // Filtro de región
    if (regionFilter) {
        regionFilter.addEventListener('change', () => {
            updateRegion(regionFilter.value);
            applyFiltersAndRender();
        });
    }

    // Ordenamiento
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            updateSortBy(sortFilter.value);
            applyFiltersAndRender();
        });
    }

    // Botón de restablecer filtros
    if (resetButton) {
        resetButton.addEventListener('click', handleResetFilters);
    }

    // Botón de reintentar
    if (retryButton) {
        retryButton.addEventListener('click', handleRetry);
    }

    // Event listeners para las tarjetas de países (delegación de eventos)
    if (countriesGrid) {
        setupCountryCardsListeners(countriesGrid);
    }

    // Botón de Wordle
    const wordleButton = document.getElementById('btn-wordle');
    if (wordleButton && typeof window.initWordle === 'function') {
        wordleButton.addEventListener('click', window.initWordle);
    }
}

/**
 * Carga los datos iniciales de todos los países
 */
async function loadInitialData() {
    try {
        appState.isLoading = true;
        
        // Mostrar loading y ocultar error
        showLoading(loadingIndicator);
        hideError(errorMessage);
        hideResultsInfo(resultsInfo);

        // Obtener todos los países
        const countries = await getAllCountries();
        
        // Guardar en el estado
        appState.allCountries = countries;
        appState.filteredCountries = countries;

        // Renderizar países
        renderCountries(countries, countriesGrid);
        
        // Mostrar información de resultados
        showResultsInfo(resultsInfo, countries.length, countries.length);

        appState.isLoading = false;
        hideLoading(loadingIndicator);

    } catch (error) {
        appState.isLoading = false;
        hideLoading(loadingIndicator);
        handleError(error);
    }
}

/**
 * Aplica filtros y renderiza los resultados
 */
function applyFiltersAndRender() {
    if (appState.isLoading || appState.allCountries.length === 0) {
        return;
    }

    try {
        // Aplicar filtros
        const filtered = applyFilters(appState.allCountries);
        appState.filteredCountries = filtered;

        // Renderizar resultados
        renderCountries(filtered, countriesGrid);

        // Actualizar información de resultados
        showResultsInfo(resultsInfo, filtered.length, appState.allCountries.length);

        // Scroll suave al inicio de los resultados
        if (countriesGrid && filtered.length > 0) {
            countriesGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

    } catch (error) {
        console.error('Error al aplicar filtros:', error);
        handleError(error);
    }
}

/**
 * Maneja el restablecimiento de filtros
 */
function handleResetFilters() {
    // Restablecer el estado de filtros
    resetFilters();

    // Restablecer valores de los inputs
    if (searchInput) searchInput.value = '';
    if (regionFilter) regionFilter.value = '';
    if (sortFilter) sortFilter.value = 'name';

    // Renderizar todos los países
    appState.filteredCountries = appState.allCountries;
    renderCountries(appState.allCountries, countriesGrid);
    showResultsInfo(resultsInfo, appState.allCountries.length, appState.allCountries.length);

    // Enfocar en el input de búsqueda
    if (searchInput) {
        searchInput.focus();
    }
}

/**
 * Maneja el botón de reintentar cuando hay error
 */
async function handleRetry() {
    await loadInitialData();
}

/**
 * Maneja errores de la aplicación
 * @param {Error} error - Error a manejar
 */
function handleError(error) {
    console.error('Error en la aplicación:', error);

    // Ocultar loading y resultados
    hideLoading(loadingIndicator);
    hideResultsInfo(resultsInfo);

    // Determinar mensaje de error
    let errorMsg = 'Ha ocurrido un error al cargar los datos. Por favor, verifica tu conexión a Internet e intenta nuevamente.';

    if (error.message.includes('HTTP')) {
        errorMsg = `Error al conectar con la API: ${error.message}`;
    } else if (error.message.includes('Failed to fetch')) {
        errorMsg = 'No se pudo conectar con la API. Verifica tu conexión a Internet.';
    }

    // Mostrar mensaje de error
    showError(errorMessage, errorMsg);

    // Limpiar grid
    if (countriesGrid) {
        countriesGrid.innerHTML = '';
    }
}

/**
 * Obtiene estadísticas de los países cargados
 * @returns {Object} Objeto con estadísticas
 */
function getStats() {
    if (appState.allCountries.length === 0) {
        return null;
    }

    const stats = {
        total: appState.allCountries.length,
        filtered: appState.filteredCountries.length,
        regions: {},
        totalPopulation: 0
    };

    appState.allCountries.forEach(country => {
        // Contar por región
        if (country.region) {
            stats.regions[country.region] = (stats.regions[country.region] || 0) + 1;
        }

        // Sumar población total
        if (country.population) {
            stats.totalPopulation += country.population;
        }
    });

    return stats;
}

/**
 * Función de utilidad para logging de estado (para debug)
 */
function logAppState() {
    console.log('=== Estado de la Aplicación ===');
    console.log('Total de países:', appState.allCountries.length);
    console.log('Países filtrados:', appState.filteredCountries.length);
    console.log('Estado de filtros:', getFilterState());
    console.log('Cargando:', appState.isLoading);
    
    const stats = getStats();
    if (stats) {
        console.log('Estadísticas:', stats);
    }
}

// Hacer disponible logAppState globalmente para debug en consola
window.logAppState = logAppState;

/**
 * Log de inicio de la aplicación
 */
console.log('%c🌍 REST Countries Explorer', 'color: #3b82f6; font-size: 20px; font-weight: bold;');
console.log('%cAplicación inicializada correctamente', 'color: #10b981; font-size: 14px;');
console.log('%cPara ver el estado de la aplicación, ejecuta: logAppState()', 'color: #64748b; font-size: 12px;');
