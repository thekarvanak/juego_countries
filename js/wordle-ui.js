/**
 * wordle-ui.js - Interfaz de usuario del juego Wordle de Países
 * 
 * Este módulo construye y maneja toda la interfaz del juego Wordle,
 * incluyendo el modal, grilla, teclado y animaciones.
 */

import { fetchCountriesForWordle, pickRandomCountry } from './wordle-api.js';
import { WordleGame } from './wordle-game.js';

// Estado del juego
let game = null;
let currentCountry = null;
let allCountries = null;
let currentRow = 0;
let currentCol = 0;
let selectedMinLength = 4;
let selectedMaxLength = 12;

// Referencias del DOM
let modalElement = null;
let gridContainer = null;
let keyboardContainer = null;
let messageArea = null;
let loadingArea = null;
let gameArea = null;
let configArea = null;

// Layout del teclado español (3 filas)
const KEYBOARD_LAYOUT = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

/**
 * Inicializa el juego Wordle (función exportada llamada desde main.js)
 */
export async function initWordle() {
    try {
        // Crear modal si no existe
        if (!modalElement) {
            createModal();
        }

        // Mostrar modal
        showModal();

        // Cargar países si no están cargados
        if (!allCountries) {
            showLoading();
            allCountries = await fetchCountriesForWordle();
            hideLoading();
        }

        // Mostrar pantalla de configuración
        showConfig();

    } catch (error) {
        console.error('Error al inicializar Wordle:', error);
        showError('No se pudo conectar con la API. Verifica tu conexión e intenta nuevamente.');
    }
}

/**
 * Crea el modal del juego
 */
function createModal() {
    modalElement = document.createElement('div');
    modalElement.id = 'wordle-modal';
    modalElement.className = 'wordle-modal';
    modalElement.style.display = 'none';

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'wordle-modal__overlay';
    overlay.addEventListener('click', closeModal);

    // Contenido del modal
    const content = document.createElement('div');
    content.className = 'wordle-modal__content';

    // Header
    const header = document.createElement('div');
    header.className = 'wordle-header';

    const title = document.createElement('h2');
    title.className = 'wordle-header__title';
    title.textContent = 'Wordle de Países';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'wordle-header__close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Cerrar juego');
    closeBtn.addEventListener('click', closeModal);

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Loading area
    loadingArea = document.createElement('div');
    loadingArea.className = 'wordle-loading';
    loadingArea.innerHTML = `
        <div class="loading__spinner"></div>
        <p class="loading__text">Cargando países...</p>
    `;

    // Config area (selección de dificultad)
    configArea = document.createElement('div');
    configArea.className = 'wordle-config';
    configArea.style.display = 'none';

    // Game area
    gameArea = document.createElement('div');
    gameArea.className = 'wordle-game';
    gameArea.style.display = 'none';

    // Grid container
    gridContainer = document.createElement('div');
    gridContainer.className = 'wordle-grid';

    // Keyboard container
    keyboardContainer = document.createElement('div');
    keyboardContainer.className = 'wordle-keyboard';

    // Message area
    messageArea = document.createElement('div');
    messageArea.className = 'wordle-message';

    // Ensamblar game area
    gameArea.appendChild(gridContainer);
    gameArea.appendChild(messageArea);
    gameArea.appendChild(keyboardContainer);

    // Ensamblar content
    content.appendChild(header);
    content.appendChild(loadingArea);
    content.appendChild(configArea);
    content.appendChild(gameArea);

    // Ensamblar modal
    modalElement.appendChild(overlay);
    modalElement.appendChild(content);

    // Agregar al body
    document.body.appendChild(modalElement);

    // Event listener para teclado físico
    document.addEventListener('keydown', handlePhysicalKeyboard);
}

/**
 * Muestra la pantalla de configuración
 */
function showConfig() {
    configArea.innerHTML = `
        <div class="wordle-config__content">
            <h3 class="wordle-config__title">Selecciona la dificultad</h3>
            <p class="wordle-config__description">Elige el número de letras del país a adivinar</p>
            
            <div class="wordle-config__options">
                <label class="wordle-config__label">Número de letras:</label>
                <div class="wordle-config__length-selector">
                    <button class="wordle-config__btn" data-length="4">4 letras</button>
                    <button class="wordle-config__btn" data-length="5">5 letras</button>
                    <button class="wordle-config__btn" data-length="6">6 letras</button>
                    <button class="wordle-config__btn" data-length="7">7 letras</button>
                    <button class="wordle-config__btn" data-length="8">8 letras</button>
                    <button class="wordle-config__btn" data-length="9-12">9-12 letras</button>
                </div>
            </div>
            
            <div class="wordle-config__range-section">
                <label class="wordle-config__label">O elige un rango personalizado:</label>
                <div class="wordle-config__range-inputs">
                    <div class="wordle-config__input-group">
                        <label for="min-length">Mínimo:</label>
                        <input type="number" id="min-length" min="4" max="12" value="4" />
                    </div>
                    <span class="wordle-config__separator">-</span>
                    <div class="wordle-config__input-group">
                        <label for="max-length">Máximo:</label>
                        <input type="number" id="max-length" min="4" max="12" value="12" />
                    </div>
                </div>
                <button class="button button--primary wordle-config__start" id="start-custom-game">
                    Iniciar Juego Personalizado
                </button>
            </div>
        </div>
    `;

    configArea.style.display = 'block';
    gameArea.style.display = 'none';

    // Event listeners para botones de longitud fija
    configArea.querySelectorAll('.wordle-config__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lengthOption = btn.getAttribute('data-length');
            if (lengthOption === '9-12') {
                selectedMinLength = 9;
                selectedMaxLength = 12;
            } else {
                const length = parseInt(lengthOption);
                selectedMinLength = length;
                selectedMaxLength = length;
            }
            startNewGame();
        });
    });

    // Event listener para juego personalizado
    document.getElementById('start-custom-game').addEventListener('click', () => {
        const minInput = document.getElementById('min-length');
        const maxInput = document.getElementById('max-length');
        
        selectedMinLength = Math.max(4, Math.min(12, parseInt(minInput.value) || 4));
        selectedMaxLength = Math.max(selectedMinLength, Math.min(12, parseInt(maxInput.value) || 12));
        
        startNewGame();
    });
}

/**
 * Inicia un nuevo juego
 */
async function startNewGame() {
    try {
        // Seleccionar país aleatorio con la longitud especificada
        currentCountry = pickRandomCountry(allCountries, selectedMinLength, selectedMaxLength);
        console.log('🎮 País seleccionado:', currentCountry.nombreReal, '| Palabra:', currentCountry.palabra, '| Longitud:', currentCountry.palabra.length);

        // Crear instancia del juego
        game = new WordleGame(currentCountry.palabra);

        // Reiniciar estado
        currentRow = 0;
        currentCol = 0;

        // Construir interfaz
        buildGrid();
        buildKeyboard();

        // Limpiar mensaje
        messageArea.innerHTML = '';

        // Ocultar config, mostrar juego
        configArea.style.display = 'none';
        gameArea.style.display = 'flex';
        
        // Ajustar ancho dinámico del modal
        adjustModalWidth();

    } catch (error) {
        console.error('Error al iniciar nuevo juego:', error);
        showError('No se pudo iniciar el juego. Intenta nuevamente.');
    }
}

/**
 * Ajusta el ancho del modal según el número de columnas
 */
function adjustModalWidth() {
    const content = modalElement.querySelector('.wordle-modal__content');
    if (content) {
        content.style.setProperty('--grid-cols', game.longitudPalabra);
    }
}

/**
 * Construye la grilla del juego
 */
function buildGrid() {
    gridContainer.innerHTML = '';
    gridContainer.style.setProperty('--grid-cols', game.longitudPalabra);

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < game.longitudPalabra; col++) {
            const cell = document.createElement('div');
            cell.className = 'wordle-cell';
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);
            gridContainer.appendChild(cell);
        }
    }
}

/**
 * Construye el teclado virtual
 */
function buildKeyboard() {
    keyboardContainer.innerHTML = '';

    KEYBOARD_LAYOUT.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.className = 'wordle-keyboard__row';

        row.forEach(letter => {
            const key = document.createElement('button');
            key.className = 'wordle-key';
            key.textContent = letter;
            key.setAttribute('data-key', letter);
            key.addEventListener('click', () => handleKeyPress(letter));
            rowElement.appendChild(key);
        });

        keyboardContainer.appendChild(rowElement);
    });

    // Botones especiales
    const specialRow = document.createElement('div');
    specialRow.className = 'wordle-keyboard__row';

    const enterBtn = document.createElement('button');
    enterBtn.className = 'wordle-key wordle-key--special';
    enterBtn.textContent = 'ENVIAR';
    enterBtn.addEventListener('click', () => handleSubmit());

    const backspaceBtn = document.createElement('button');
    backspaceBtn.className = 'wordle-key wordle-key--special';
    backspaceBtn.textContent = 'BORRAR';
    backspaceBtn.addEventListener('click', () => handleBackspace());

    specialRow.appendChild(backspaceBtn);
    specialRow.appendChild(enterBtn);
    keyboardContainer.appendChild(specialRow);
}

/**
 * Maneja la presión de una tecla
 * @param {string} letter - Letra presionada
 */
function handleKeyPress(letter) {
    if (game.terminado) return;
    if (currentCol >= game.longitudPalabra) return;

    const cell = getCell(currentRow, currentCol);
    if (cell) {
        cell.textContent = letter;
        cell.classList.add('wordle-cell--filled');
        currentCol++;
    }
}

/**
 * Maneja la tecla Backspace
 */
function handleBackspace() {
    if (game.terminado) return;
    if (currentCol === 0) return;

    currentCol--;
    const cell = getCell(currentRow, currentCol);
    if (cell) {
        cell.textContent = '';
        cell.classList.remove('wordle-cell--filled');
    }
}

/**
 * Maneja el envío del intento
 */
async function handleSubmit() {
    if (game.terminado) return;

    // Obtener palabra del intento actual
    const guess = getCurrentGuess();

    // Validar longitud
    if (guess.length !== game.longitudPalabra) {
        showTemporaryMessage('Completa todas las letras', 'error');
        shakeRow(currentRow);
        return;
    }

    try {
        // Procesar intento
        const resultado = game.submitIntento(guess);

        // Animar revelación
        await revealRow(currentRow, resultado);

        // Actualizar estado del teclado
        updateKeyboard();

        // Verificar si terminó
        if (game.terminado) {
            setTimeout(() => showGameOver(), 500);
        } else {
            // Pasar a la siguiente fila
            currentRow++;
            currentCol = 0;
        }

    } catch (error) {
        console.error('Error al procesar intento:', error);
        showTemporaryMessage(error.message, 'error');
        shakeRow(currentRow);
    }
}

/**
 * Obtiene la palabra del intento actual
 * @returns {string} Palabra ingresada
 */
function getCurrentGuess() {
    let guess = '';
    for (let col = 0; col < game.longitudPalabra; col++) {
        const cell = getCell(currentRow, col);
        if (cell) {
            guess += cell.textContent;
        }
    }
    return guess;
}

/**
 * Obtiene una celda específica
 * @param {number} row - Fila
 * @param {number} col - Columna
 * @returns {HTMLElement} Elemento de la celda
 */
function getCell(row, col) {
    return gridContainer.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

/**
 * Anima la revelación de una fila con efecto flip
 * @param {number} row - Fila a animar
 * @param {Array} resultado - Resultado del intento
 */
async function revealRow(row, resultado) {
    const delays = resultado.map((_, i) => i * 150); // 150ms de delay por celda

    for (let col = 0; col < resultado.length; col++) {
        await new Promise(resolve => setTimeout(resolve, delays[col]));
        
        const cell = getCell(row, col);
        const { estado } = resultado[col];

        cell.classList.add('wordle-cell--flip');
        
        setTimeout(() => {
            cell.classList.add(`wordle-cell--${estado}`);
        }, 250); // Mitad de la animación flip (500ms / 2)
    }

    // Esperar a que termine la última animación
    await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Agita una fila (animación de error)
 * @param {number} row - Fila a agitar
 */
function shakeRow(row) {
    for (let col = 0; col < game.longitudPalabra; col++) {
        const cell = getCell(row, col);
        if (cell) {
            cell.classList.add('wordle-cell--shake');
            setTimeout(() => {
                cell.classList.remove('wordle-cell--shake');
            }, 500);
        }
    }
}

/**
 * Actualiza el estado visual del teclado
 */
function updateKeyboard() {
    const estadoLetras = game.getEstadoTeclado();

    Object.entries(estadoLetras).forEach(([letra, estado]) => {
        const key = keyboardContainer.querySelector(`[data-key="${letra}"]`);
        if (key) {
            // Eliminar estados anteriores
            key.classList.remove('wordle-key--correct', 'wordle-key--present', 'wordle-key--absent');
            // Agregar nuevo estado
            key.classList.add(`wordle-key--${estado}`);
        }
    });
}

/**
 * Muestra el mensaje final del juego
 */
function showGameOver() {
    const container = document.createElement('div');
    container.className = 'wordle-result';

    if (game.gano) {
        container.innerHTML = `
            <div class="wordle-result__content">
                <h3 class="wordle-result__title">¡Felicidades! 🎉</h3>
                <p class="wordle-result__text">Has adivinado el país en ${6 - game.intentosRestantes} intentos</p>
                <div class="wordle-result__country">
                    <img src="${currentCountry.bandera}" alt="Bandera de ${currentCountry.nombreReal}" class="wordle-result__flag">
                    <p class="wordle-result__name">${currentCountry.nombreReal}</p>
                </div>
                <button class="button button--primary wordle-result__button" id="wordle-play-again">
                    Jugar de nuevo
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="wordle-result__content">
                <h3 class="wordle-result__title">Game Over</h3>
                <p class="wordle-result__text">La palabra correcta era:</p>
                <div class="wordle-result__country">
                    <img src="${currentCountry.bandera}" alt="Bandera de ${currentCountry.nombreReal}" class="wordle-result__flag">
                    <p class="wordle-result__name">${currentCountry.nombreReal}</p>
                </div>
                <button class="button button--primary wordle-result__button" id="wordle-play-again">
                    Jugar de nuevo
                </button>
            </div>
        `;
    }

    messageArea.innerHTML = '';
    messageArea.appendChild(container);

    // Event listener para jugar de nuevo
    document.getElementById('wordle-play-again').addEventListener('click', () => {
        showConfig();
    });
}

/**
 * Maneja el teclado físico
 * @param {KeyboardEvent} event - Evento de teclado
 */
function handlePhysicalKeyboard(event) {
    // Solo procesar si el modal está visible y el juego no ha terminado
    if (modalElement.style.display !== 'flex') return;
    if (game?.terminado) return;

    const key = event.key.toUpperCase();

    // Letras A-Z y Ñ
    if (/^[A-ZÑ]$/.test(key)) {
        event.preventDefault();
        handleKeyPress(key);
    }
    // Enter
    else if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
    }
    // Backspace
    else if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
    }
}

/**
 * Muestra un mensaje temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (error, success, info)
 */
function showTemporaryMessage(message, type = 'info') {
    const msgElement = document.createElement('div');
    msgElement.className = `wordle-toast wordle-toast--${type}`;
    msgElement.textContent = message;

    messageArea.innerHTML = '';
    messageArea.appendChild(msgElement);

    setTimeout(() => {
        msgElement.remove();
    }, 2000);
}

/**
 * Muestra el indicador de carga
 */
function showLoading() {
    loadingArea.style.display = 'flex';
    gameArea.style.display = 'none';
}

/**
 * Oculta el indicador de carga
 */
function hideLoading() {
    loadingArea.style.display = 'none';
}

/**
 * Muestra un mensaje de error persistente
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    hideLoading();
    gameArea.style.display = 'flex';
    gridContainer.style.display = 'none';
    keyboardContainer.style.display = 'none';

    messageArea.innerHTML = `
        <div class="wordle-error">
            <p class="wordle-error__text">${message}</p>
            <button class="button button--primary" id="wordle-retry">Reintentar</button>
        </div>
    `;

    document.getElementById('wordle-retry').addEventListener('click', () => {
        gridContainer.style.display = 'grid';
        keyboardContainer.style.display = 'flex';
        initWordle();
    });
}

/**
 * Muestra el modal
 */
function showModal() {
    modalElement.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal
 */
function closeModal() {
    modalElement.style.display = 'none';
    document.body.style.overflow = '';
}

// Exponer initWordle globalmente para que main.js pueda acceder
window.initWordle = initWordle;
