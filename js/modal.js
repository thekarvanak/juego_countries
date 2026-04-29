/**
 * modal.js - Módulo de Modal
 * 
 * Este módulo maneja la lógica del modal de detalles de país,
 * incluyendo apertura, cierre y carga de contenido.
 */

/**
 * Referencias a elementos del DOM del modal
 */
let modalElement = null;
let modalOverlay = null;
let modalClose = null;
let modalBody = null;

/**
 * Inicializa las referencias del modal
 */
function initModal() {
    modalElement = document.getElementById('countryModal');
    modalOverlay = modalElement?.querySelector('.modal__overlay');
    modalClose = document.getElementById('modalClose');
    modalBody = document.getElementById('modalBody');

    // Configurar event listeners
    setupModalListeners();
}

/**
 * Configura los event listeners del modal
 */
function setupModalListeners() {
    // Cerrar al hacer clic en el botón de cerrar
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Cerrar al hacer clic en el overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // Cerrar con la tecla Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isModalOpen()) {
            closeModal();
        }
    });
}

/**
 * Abre el modal con el contenido de un país
 * @param {string} countryCode - Código del país (cca3)
 */
async function openModal(countryCode) {
    if (!modalElement || !modalBody) {
        console.error('Modal no está inicializado');
        return;
    }

    try {
        // Mostrar modal con loading
        showModalLoading();
        modalElement.style.display = 'flex';

        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';

        // Obtener datos del país
        const country = await getCountryByCode(countryCode);

        // Renderizar contenido del país
        modalBody.innerHTML = '';
        const detailElement = createCountryDetail(country);
        modalBody.appendChild(detailElement);

        // Enfocar en el modal para accesibilidad
        modalClose?.focus();

    } catch (error) {
        console.error('Error al cargar detalles del país:', error);
        showModalError('No se pudieron cargar los detalles del país');
    }
}

/**
 * Cierra el modal
 */
function closeModal() {
    if (!modalElement) return;

    // Ocultar modal
    modalElement.style.display = 'none';

    // Limpiar contenido
    if (modalBody) {
        modalBody.innerHTML = '';
    }

    // Restaurar scroll del body
    document.body.style.overflow = '';
}

/**
 * Verifica si el modal está abierto
 * @returns {boolean} true si el modal está abierto
 */
function isModalOpen() {
    return modalElement && modalElement.style.display === 'flex';
}

/**
 * Muestra un indicador de carga en el modal
 */
function showModalLoading() {
    if (!modalBody) return;

    modalBody.innerHTML = `
        <div class="loading">
            <div class="loading__spinner"></div>
            <p class="loading__text">Cargando detalles del país...</p>
        </div>
    `;
}

/**
 * Muestra un mensaje de error en el modal
 * @param {string} message - Mensaje de error
 */
function showModalError(message) {
    if (!modalBody) return;

    modalBody.innerHTML = `
        <div class="error-message">
            <p class="error-message__text">${message}</p>
            <button class="button button--primary" onclick="closeModal()">Cerrar</button>
        </div>
    `;
}

/**
 * Maneja el clic en una tarjeta de país para abrir el modal
 * @param {Event} event - Evento de clic
 */
function handleCountryCardClick(event) {
    // Buscar la tarjeta más cercana
    const card = event.target.closest('.country-card');
    
    if (!card) return;

    const countryCode = card.getAttribute('data-country-code');
    
    if (countryCode) {
        openModal(countryCode);
    }
}

/**
 * Maneja el evento de teclado en una tarjeta de país
 * @param {Event} event - Evento de teclado
 */
function handleCountryCardKeydown(event) {
    // Enter o Espacio
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCountryCardClick(event);
    }
}

/**
 * Configura los event listeners para las tarjetas de países
 * @param {HTMLElement} container - Contenedor de las tarjetas
 */
function setupCountryCardsListeners(container) {
    if (!container) return;

    // Usar delegación de eventos para mejor rendimiento
    container.addEventListener('click', handleCountryCardClick);
    container.addEventListener('keydown', handleCountryCardKeydown);
}
