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

        // Configurar event listeners de la app principal
        setupEventListeners();

        // Configurar event listeners de autenticación
        setupAuthEventListeners();

        // Verificar sesión activa con el servidor (NUEVO: await async init)
        const currentUser = await window.Auth.init();
        if (!currentUser) {
            // Sin sesión: mostrar pantalla de login (datos se cargan en paralelo)
            showLoginOverlay();
        } else {
            // Sesión activa: ocultar overlay y actualizar barra de usuario
            hideLoginOverlay();
            await updateUserInfoBar(currentUser.nickname);
            window.Logger?.info(currentUser.nickname, 'APP_INIT', 'Sesión activa detectada al iniciar la app', 'OK');
        }

        // Cargar datos de países (funciona en paralelo con el login si aplica)
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

// ─── Autenticación ────────────────────────────────────────────────────────

/**
 * Muestra el overlay de login.
 */
function showLoginOverlay() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) {
        overlay.classList.remove('login-overlay--exit');
        overlay.style.display = 'flex';
    }
}

/**
 * Oculta el overlay de login con animación de salida.
 */
function hideLoginOverlay() {
    const overlay = document.getElementById('login-overlay');
    if (!overlay || overlay.style.display === 'none') return;

    overlay.classList.add('login-overlay--exit');
    // Esperar a que termine la animación antes de ocultar
    overlay.addEventListener('animationend', () => {
        overlay.style.display = 'none';
        overlay.classList.remove('login-overlay--exit');
    }, { once: true });
}

/**
 * Actualiza la barra de usuario en el header con el nickname y puntaje.
 * @param {string|null} nickname - null para ocultar la barra
 */
async function updateUserInfoBar(nickname) {
    const userInfo     = document.getElementById('user-info');
    const nickDisplay  = document.getElementById('user-nickname-display');
    const scoreDisplay = document.getElementById('user-score-display');

    if (!nickname) {
        if (userInfo) userInfo.style.display = 'none';
        return;
    }

    if (userInfo)    userInfo.style.display  = 'flex';
    if (nickDisplay) nickDisplay.textContent = nickname;

    // Mostrar puntaje acumulado (NUEVO: await — getScore ahora es async)
    const score = await window.Score?.getScore() ?? 0;
    if (scoreDisplay) scoreDisplay.textContent = `⭐ ${score} pts`;
}

/**
 * Configura los event listeners del sistema de autenticación.
 */
function setupAuthEventListeners() {
    // Formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Botón de registrarse
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
    }

    // Botón de cancelar registro
    const registerCancelBtn = document.getElementById('register-cancel-btn');
    if (registerCancelBtn) {
        registerCancelBtn.addEventListener('click', hideRegisterPrompt);
    }
}

/**
 * Maneja el envío del formulario de login.
 * @param {Event} e
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    const input    = document.getElementById('nickname-input');
    const nickname = (input?.value || '').trim();

    hideLoginError();
    hideRegisterPrompt();

    if (!nickname) {
        showLoginError('Por favor ingresa un nickname.');
        return;
    }

    // Deshabilitar botón mientras se procesa la petición
    const submitBtn = document.querySelector('.login-form__submit');
    if (submitBtn) submitBtn.disabled = true;

    // NUEVO: await — login ahora es async (llama al servidor)
    const result = await window.Auth.login(nickname);

    if (submitBtn) submitBtn.disabled = false;

    if (result.ok) {
        const nick = result.user.nickname;
        hideLoginOverlay();
        await updateUserInfoBar(nick);
        if (result.isNew) {
            window.Logger?.info(nick, 'LOGIN_NUEVO_USUARIO', 'Cuenta creada automáticamente', 'OK');
        }
    } else if (result.reason === 'invalid_format') {
        showLoginError('Formato inválido: usa letras minúsculas, números o _ (3–20 caracteres).');
    } else if (result.reason === 'network_error') {
        showLoginError(result.message || 'Error de conexión con el servidor.');
    } else {
        showLoginError('Error al iniciar sesión. Inténtalo de nuevo.');
    }
}

/**
 * Maneja el registro de un nuevo nickname.
 */
// handleRegister ya no aplica: el backend auto-registra si el nickname no existe.
// El botón #register-btn dispara handleLoginSubmit directamente.
function handleRegister() {
    handleLoginSubmit(new Event('submit'));
}

/**
 * Maneja el cierre de sesión.
 */
async function handleLogout() {
    const user = window.Auth?.getCurrentUser();
    if (user) {
        window.Logger?.warn(user.nickname, 'LOGOUT', 'Cierre de sesión solicitado por el usuario', 'OK');
    }
    // NUEVO: await — logout ahora es async (llama al servidor)
    await window.Auth?.logout();
    updateUserInfoBar(null);
    // Limpiar campo de nickname para la próxima sesión
    const input = document.getElementById('nickname-input');
    if (input) input.value = '';
    hideRegisterPrompt();
    hideLoginError();
    showLoginOverlay();
}

/**
 * Muestra un mensaje de error en el formulario de login.
 * @param {string} msg
 */
function showLoginError(msg) {
    const errorEl = document.getElementById('login-error-msg');
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }
}

/**
 * Oculta el mensaje de error del formulario de login.
 */
function hideLoginError() {
    const errorEl = document.getElementById('login-error-msg');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

/**
 * Muestra el prompt de registro con el nickname ingresado.
 * @param {string} nickname
 */
function showRegisterPrompt(nickname) {
    const prompt  = document.getElementById('register-prompt');
    const display = document.getElementById('register-nickname-display');
    if (display) display.textContent = nickname;
    if (prompt)  prompt.style.display = 'block';
}

/**
 * Oculta el prompt de registro.
 */
function hideRegisterPrompt() {
    const prompt = document.getElementById('register-prompt');
    if (prompt) prompt.style.display = 'none';
}

// ─── Estadísticas ─────────────────────────────────────────────────────────

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
