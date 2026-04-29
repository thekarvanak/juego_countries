/**
 * render.js - Módulo de Renderización del DOM
 * 
 * Este módulo contiene todas las funciones para construir y manipular el DOM.
 * Crea elementos HTML de forma dinámica y los inserta en el documento.
 */

/**
 * Formatea un número con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
function formatNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Obtiene el nombre común del país de forma segura
 * @param {Object} country - Objeto país de la API
 * @returns {string} Nombre común del país
 */
function getCountryName(country) {
    return country?.name?.common || 'Nombre no disponible';
}

/**
 * Obtiene la capital del país de forma segura
 * @param {Object} country - Objeto país de la API
 * @returns {string} Capital del país
 */
function getCapital(country) {
    if (country?.capital && Array.isArray(country.capital) && country.capital.length > 0) {
        return country.capital[0];
    }
    return 'N/A';
}

/**
 * Crea una tarjeta de país (country card)
 * @param {Object} country - Objeto país de la API
 * @returns {HTMLElement} Elemento DOM de la tarjeta
 */
function createCountryCard(country) {
    const card = document.createElement('article');
    card.className = 'country-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('data-country-code', country.cca3);
    card.setAttribute('aria-label', `Ver detalles de ${getCountryName(country)}`);

    // Imagen de bandera
    const flag = document.createElement('img');
    flag.className = 'country-card__flag';
    flag.src = country.flags?.png || country.flags?.svg || '';
    flag.alt = `Bandera de ${getCountryName(country)}`;
    flag.loading = 'lazy';
    
    // Manejo de error de carga de imagen
    flag.onerror = function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e2e8f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="sans-serif"%3E?%3C/text%3E%3C/svg%3E';
    };

    // Contenido
    const content = document.createElement('div');
    content.className = 'country-card__content';

    // Nombre
    const name = document.createElement('h2');
    name.className = 'country-card__name';
    name.textContent = getCountryName(country);

    // Detalles
    const details = document.createElement('div');
    details.className = 'country-card__details';

    // Población
    const population = document.createElement('p');
    population.className = 'country-card__detail';
    population.innerHTML = `<span class="country-card__detail-label">Población:</span> ${formatNumber(country.population)}`;

    // Región
    const region = document.createElement('p');
    region.className = 'country-card__detail';
    region.innerHTML = `<span class="country-card__detail-label">Región:</span> ${country.region || 'N/A'}`;

    // Capital
    const capital = document.createElement('p');
    capital.className = 'country-card__detail';
    capital.innerHTML = `<span class="country-card__detail-label">Capital:</span> ${getCapital(country)}`;

    details.appendChild(population);
    details.appendChild(region);
    details.appendChild(capital);

    // Footer con badges
    const footer = document.createElement('div');
    footer.className = 'country-card__footer';

    if (country.region) {
        const regionBadge = document.createElement('span');
        regionBadge.className = 'badge badge--region';
        regionBadge.textContent = country.region;
        footer.appendChild(regionBadge);
    }

    if (country.subregion) {
        const subregionBadge = document.createElement('span');
        subregionBadge.className = 'badge badge--subregion';
        subregionBadge.textContent = country.subregion;
        footer.appendChild(subregionBadge);
    }

    // Ensamblar la tarjeta
    content.appendChild(name);
    content.appendChild(details);
    content.appendChild(footer);
    card.appendChild(flag);
    card.appendChild(content);

    return card;
}

/**
 * Renderiza la lista de países en el grid
 * @param {Array} countries - Array de países a renderizar
 * @param {HTMLElement} container - Contenedor donde renderizar
 */
function renderCountries(countries, container) {
    // Limpiar contenedor
    container.innerHTML = '';

    if (!countries || countries.length === 0) {
        renderEmptyState(container, 'No se encontraron países', 'Intenta ajustar los filtros de búsqueda');
        return;
    }

    // Crear fragment para mejor rendimiento
    const fragment = document.createDocumentFragment();

    countries.forEach(country => {
        const card = createCountryCard(country);
        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

/**
 * Renderiza un estado vacío (sin resultados)
 * @param {HTMLElement} container - Contenedor donde renderizar
 * @param {string} title - Título del mensaje
 * @param {string} description - Descripción del mensaje
 */
function renderEmptyState(container, title, description) {
    container.innerHTML = '';

    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const icon = document.createElement('div');
    icon.className = 'empty-state__icon';
    icon.textContent = '🔍';

    const titleElement = document.createElement('h3');
    titleElement.className = 'empty-state__title';
    titleElement.textContent = title;

    const descElement = document.createElement('p');
    descElement.className = 'empty-state__description';
    descElement.textContent = description;

    emptyState.appendChild(icon);
    emptyState.appendChild(titleElement);
    emptyState.appendChild(descElement);
    container.appendChild(emptyState);
}

/**
 * Muestra el indicador de carga
 * @param {HTMLElement} loadingElement - Elemento de loading
 */
function showLoading(loadingElement) {
    if (loadingElement) {
        loadingElement.style.display = 'flex';
    }
}

/**
 * Oculta el indicador de carga
 * @param {HTMLElement} loadingElement - Elemento de loading
 */
function hideLoading(loadingElement) {
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Muestra un mensaje de error
 * @param {HTMLElement} errorElement - Elemento de error
 * @param {string} message - Mensaje de error a mostrar
 */
function showError(errorElement, message) {
    if (!errorElement) return;

    const textElement = errorElement.querySelector('.error-message__text');
    if (textElement) {
        textElement.textContent = message || 'Ha ocurrido un error al cargar los datos';
    }
    
    errorElement.style.display = 'block';
}

/**
 * Oculta el mensaje de error
 * @param {HTMLElement} errorElement - Elemento de error
 */
function hideError(errorElement) {
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Muestra información de resultados
 * @param {HTMLElement} resultsElement - Elemento de resultados
 * @param {number} count - Cantidad de resultados
 * @param {number} total - Total de países disponibles
 */
function showResultsInfo(resultsElement, count, total) {
    if (!resultsElement) return;

    const countElement = resultsElement.querySelector('#resultsCount');
    if (countElement) {
        if (count === total) {
            countElement.textContent = `Mostrando ${formatNumber(count)} países`;
        } else {
            countElement.textContent = `Mostrando ${formatNumber(count)} de ${formatNumber(total)} países`;
        }
    }

    resultsElement.style.display = 'block';
}

/**
 * Oculta información de resultados
 * @param {HTMLElement} resultsElement - Elemento de resultados
 */
function hideResultsInfo(resultsElement) {
    if (resultsElement) {
        resultsElement.style.display = 'none';
    }
}

/**
 * Crea el contenido detallado de un país para el modal
 * @param {Object} country - Objeto país con información detallada
 * @returns {HTMLElement} Elemento DOM con los detalles
 */
function createCountryDetail(country) {
    const detail = document.createElement('div');
    detail.className = 'country-detail';

    // Header con bandera e información básica
    const header = document.createElement('div');
    header.className = 'country-detail__header';

    // Contenedor de bandera
    const flagContainer = document.createElement('div');
    flagContainer.className = 'country-detail__flag-container';

    const flag = document.createElement('img');
    flag.className = 'country-detail__flag';
    flag.src = country.flags?.svg || country.flags?.png || '';
    flag.alt = `Bandera de ${getCountryName(country)}`;

    flagContainer.appendChild(flag);

    // Información básica
    const info = document.createElement('div');
    info.className = 'country-detail__info';

    const name = document.createElement('h2');
    name.className = 'country-detail__name';
    name.id = 'modalTitle';
    name.textContent = getCountryName(country);

    const officialName = document.createElement('p');
    officialName.className = 'country-detail__official-name';
    officialName.textContent = country.name?.official || '';

    const badges = document.createElement('div');
    badges.className = 'country-detail__badges';

    if (country.region) {
        const regionBadge = document.createElement('span');
        regionBadge.className = 'badge badge--region';
        regionBadge.textContent = country.region;
        badges.appendChild(regionBadge);
    }

    if (country.subregion) {
        const subregionBadge = document.createElement('span');
        subregionBadge.className = 'badge badge--subregion';
        subregionBadge.textContent = country.subregion;
        badges.appendChild(subregionBadge);
    }

    if (country.capital && country.capital.length > 0) {
        const capitalBadge = document.createElement('span');
        capitalBadge.className = 'badge badge--capital';
        capitalBadge.textContent = `Capital: ${country.capital[0]}`;
        badges.appendChild(capitalBadge);
    }

    info.appendChild(name);
    info.appendChild(officialName);
    info.appendChild(badges);

    header.appendChild(flagContainer);
    header.appendChild(info);

    // Body con secciones de información
    const body = document.createElement('div');
    body.className = 'country-detail__body';

    // Sección: Información General
    const generalSection = createDetailSection('Información General', [
        { label: 'Población', value: formatNumber(country.population) },
        { label: 'Área', value: country.area ? `${formatNumber(country.area)} km²` : 'N/A' },
        { label: 'Independiente', value: country.independent ? 'Sí' : 'No' },
        { label: 'Miembro de la ONU', value: country.unMember ? 'Sí' : 'No' },
        { label: 'Código FIFA', value: country.fifa || 'N/A' }
    ]);

    // Sección: Idiomas
    const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
    const languagesSection = createDetailSection('Idiomas', [
        { label: 'Idiomas oficiales', value: languages }
    ]);

    // Sección: Monedas
    let currenciesText = 'N/A';
    if (country.currencies) {
        currenciesText = Object.values(country.currencies)
            .map(curr => `${curr.name} (${curr.symbol || 'N/A'})`)
            .join(', ');
    }
    const currenciesSection = createDetailSection('Monedas', [
        { label: 'Monedas', value: currenciesText }
    ]);

    // Sección: Zona Horaria
    const timezones = country.timezones ? country.timezones.join(', ') : 'N/A';
    const timezoneSection = createDetailSection('Zona Horaria', [
        { label: 'Zonas horarias', value: timezones }
    ]);

    body.appendChild(generalSection);
    body.appendChild(languagesSection);
    body.appendChild(currenciesSection);
    body.appendChild(timezoneSection);

    // Mapa
    if (country.maps?.googleMaps) {
        const mapSection = document.createElement('div');
        mapSection.className = 'country-detail__map';

        const mapTitle = document.createElement('h3');
        mapTitle.className = 'country-detail__map-title';
        mapTitle.textContent = 'Ver en el Mapa';

        const mapLink = document.createElement('a');
        mapLink.className = 'country-detail__map-link';
        mapLink.href = country.maps.googleMaps;
        mapLink.target = '_blank';
        mapLink.rel = 'noopener noreferrer';
        mapLink.textContent = '🗺️ Abrir en Google Maps';

        mapSection.appendChild(mapTitle);
        mapSection.appendChild(mapLink);
        detail.appendChild(header);
        detail.appendChild(body);
        detail.appendChild(mapSection);
    } else {
        detail.appendChild(header);
        detail.appendChild(body);
    }

    return detail;
}

/**
 * Crea una sección de detalle con una lista de datos
 * @param {string} title - Título de la sección
 * @param {Array} items - Array de objetos {label, value}
 * @returns {HTMLElement} Elemento DOM de la sección
 */
function createDetailSection(title, items) {
    const section = document.createElement('div');
    section.className = 'country-detail__section';

    const sectionTitle = document.createElement('h3');
    sectionTitle.className = 'country-detail__section-title';
    sectionTitle.textContent = title;

    const list = document.createElement('ul');
    list.className = 'country-detail__list';

    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'country-detail__list-item';
        listItem.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
        list.appendChild(listItem);
    });

    section.appendChild(sectionTitle);
    section.appendChild(list);

    return section;
}
