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
let leaderboardArea = null; // Panel del leaderboard (nuevo)

/** Última vista activa antes de abrir el leaderboard ('config' | 'game') */
let previousView = 'config';

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

        // Actualizar el panel de puntaje si hay usuario autenticado
        updateWordleScoreDisplay();

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

    // Panel izquierdo del header (título)
    const headerLeft = document.createElement('div');
    headerLeft.className = 'wordle-header__left';
    headerLeft.appendChild(title);

    // Puntaje del usuario autenticado (visible solo si hay sesión)
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'wordle-score-display';
    scoreDisplay.className = 'wordle-score-display';
    scoreDisplay.style.display = 'none';

    // Botón para abrir el leaderboard
    const leaderboardBtn = document.createElement('button');
    leaderboardBtn.className = 'wordle-header__btn';
    leaderboardBtn.id = 'wordle-leaderboard-btn';
    leaderboardBtn.innerHTML = '🏆';
    leaderboardBtn.setAttribute('aria-label', 'Ver tabla de líderes');
    leaderboardBtn.addEventListener('click', showLeaderboard);

    // Panel derecho del header (puntaje + leaderboard + cerrar)
    const headerRight = document.createElement('div');
    headerRight.className = 'wordle-header__right';
    headerRight.appendChild(scoreDisplay);
    headerRight.appendChild(leaderboardBtn);
    headerRight.appendChild(closeBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerRight);

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

    // Leaderboard area (nuevo)
    leaderboardArea = document.createElement('div');
    leaderboardArea.className = 'wordle-leaderboard';
    leaderboardArea.id = 'wordle-leaderboard-area';
    leaderboardArea.style.display = 'none';

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
    content.appendChild(leaderboardArea);
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
    if (leaderboardArea) leaderboardArea.style.display = 'none';

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
        leaderboardArea.style.display = 'none';
        gameArea.style.display = 'flex';
        
        // Ajustar ancho dinámico del modal
        adjustModalWidth();

        // Notificar al servidor del inicio de partida (no-bloqueante)
        fetch('/api/game/start', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ wordLength: currentCountry.palabra.length })
        }).catch(() => {});

        // Registrar inicio de partida y actualizar display de puntaje
        const user = window.Auth?.getCurrentUser();
        if (user) {
            window.Logger?.info(
                user.nickname,
                'GAME_START',
                `Partida iniciada. País de ${game.longitudPalabra} letras`,
                'OK'
            );
            updateWordleScoreDisplay();
        }

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

        // Notificar intento al servidor (no-bloqueante)
        fetch('/api/game/attempt', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ attempt: guess })
        }).catch(() => {});

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
 * Muestra el mensaje final del juego, registra el resultado en el log
 * y actualiza el puntaje del usuario autenticado.
 */
function showGameOver() {
    const attempts    = 6 - game.intentosRestantes;
    const currentUser = window.Auth?.getCurrentUser();

    // ── Registrar resultado de la partida y actualizar puntaje ──────────────
    // Se lanza de forma asíncrona sin bloquear la UI
    if (currentUser) {
        (async () => {
            const scoreResult = await window.Score?.recordGameResult(
                currentUser.nickname,
                game.gano,
                attempts,
                game.longitudPalabra,
                currentCountry.palabra
            );

            if (scoreResult) {
                window.Logger?.info(
                    currentUser.nickname,
                    'GAME_END',
                    `${game.gano ? 'Victoria' : 'Derrota'} en ${attempts} intento(s). País: ${currentCountry.nombreReal}`,
                    `Puntos: ${scoreResult.delta >= 0 ? '+' : ''}${scoreResult.delta} | Total: ${scoreResult.newScore}`
                );
                await updateWordleScoreDisplay();
                const headerScore = document.getElementById('user-score-display');
                if (headerScore) headerScore.textContent = `⭐ ${scoreResult.newScore} pts`;

                // Actualizar los bloques de puntaje en el HTML ya renderizado
                const deltaEl = document.querySelector('.wordle-score-earned__delta');
                const totalEl = document.querySelector('.wordle-score-earned__total');
                if (deltaEl) deltaEl.textContent = scoreResult.delta > 0 ? `+${scoreResult.delta} pts` : 'Sin puntos';
                if (totalEl) totalEl.textContent = `Total acumulado: ${scoreResult.newScore} pts`;

                const earnedDiv = document.querySelector('.wordle-score-earned');
                if (earnedDiv) {
                    earnedDiv.classList.toggle('wordle-score-earned--positive', scoreResult.delta > 0);
                    earnedDiv.classList.toggle('wordle-score-earned--zero', scoreResult.delta === 0);
                }
            }
        })();
    }

    // ── Construir bloque de puntaje ganado ───────────────────────────────────
    const scoreHtml = (scoreResult && currentUser) ? `
        <div class="wordle-result__score-info">
            <div class="wordle-score-earned ${scoreResult.delta > 0 ? 'wordle-score-earned--positive' : 'wordle-score-earned--zero'}">
                <span class="wordle-score-earned__delta">
                    ${scoreResult.delta > 0 ? '+' + scoreResult.delta + ' pts' : 'Sin puntos'}
                </span>
                <span class="wordle-score-earned__total">Total acumulado: ${scoreResult.newScore} pts</span>
            </div>
        </div>
    ` : '';

    // ── Construir pantalla de resultado ──────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'wordle-result';

    if (game.gano) {
        container.innerHTML = `
            <div class="wordle-result__content">
                <h3 class="wordle-result__title">¡Felicidades! 🎉</h3>
                <p class="wordle-result__text">Has adivinado el país en ${attempts} intentos</p>
                <div class="wordle-result__country">
                    <img src="${currentCountry.bandera}" alt="Bandera de ${currentCountry.nombreReal}" class="wordle-result__flag">
                    <p class="wordle-result__name">${currentCountry.nombreReal}</p>
                </div>
                ${scoreHtml}
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
                ${scoreHtml}
                <button class="button button--primary wordle-result__button" id="wordle-play-again">
                    Jugar de nuevo
                </button>
            </div>
        `;
    }

    messageArea.innerHTML = '';
    messageArea.appendChild(container);

    // Volver a la pantalla de configuración al hacer clic en "Jugar de nuevo"
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

// ─── Puntaje y Leaderboard ────────────────────────────────────────────────────

/**
 * Actualiza el panel de puntaje en el header del modal Wordle.
 * Muestra el nickname y el puntaje acumulado del usuario autenticado.
 */
async function updateWordleScoreDisplay() {
    const scoreDisplay = document.getElementById('wordle-score-display');
    if (!scoreDisplay) return;

    const user = window.Auth?.getCurrentUser();
    if (!user) {
        scoreDisplay.style.display = 'none';
        return;
    }

    // NUEVO: await — getScore ahora es async
    const score = await window.Score?.getScore() ?? 0;
    scoreDisplay.style.display = 'flex';
    scoreDisplay.innerHTML = `
        <span class="wordle-score-display__nickname">${user.nickname}</span>
        <span class="wordle-score-display__points">⭐ ${score}</span>
    `;
}

/**
 * Muestra el panel de leaderboard dentro del modal Wordle.
 * Guarda la vista activa para poder restaurarla al cerrar.
 */
async function showLeaderboard() {
    // Guardar qué vista estaba activa para restaurarla después
    previousView = configArea.style.display !== 'none' ? 'config' : 'game';

    // Ocultar otras vistas
    configArea.style.display    = 'none';
    gameArea.style.display      = 'none';
    loadingArea.style.display   = 'none';

    // Estado de carga antes de la llamada al servidor
    leaderboardArea.innerHTML = '<div class="wordle-leaderboard__content"><p style="text-align:center;padding:2rem">Cargando...</p></div>';
    leaderboardArea.style.display = 'block';

    // NUEVO: await — getLeaderboard ahora es async
    const players     = await window.Score?.getLeaderboard() ?? [];
    const currentUser = window.Auth?.getCurrentUser();

    const rowsHtml = players.length === 0
        ? '<p class="wordle-leaderboard__empty">Aún no hay puntuaciones registradas. ¡Juega y sé el primero!</p>'
        : `<div class="wordle-leaderboard__list">
            ${players.slice(0, 20).map((p, i) => `
                <div class="wordle-leaderboard__item ${p.nickname === currentUser?.nickname ? 'wordle-leaderboard__item--current' : ''}">
                    <span class="wordle-leaderboard__rank">${i + 1}</span>
                    <span class="wordle-leaderboard__nickname">
                        ${p.nickname}${p.nickname === currentUser?.nickname ? ' <em style="opacity:.6;font-style:normal;">(tú)</em>' : ''}
                    </span>
                    <span class="wordle-leaderboard__score">⭐ ${p.score}</span>
                    <span class="wordle-leaderboard__games">${p.partidas_ganadas}/${p.partidas_jugadas} ganados</span>
                </div>
            `).join('')}
        </div>`;

    leaderboardArea.innerHTML = `
        <div class="wordle-leaderboard__content">
            <h3 class="wordle-leaderboard__title">🏆 Tabla de Líderes</h3>
            ${rowsHtml}
            <div class="wordle-leaderboard__actions">
                <button class="button button--secondary" id="close-leaderboard">← Volver</button>
                <button class="wordle-download-logs__btn" id="download-logs-btn">📥 Descargar logs</button>
            </div>
        </div>
    `;

    leaderboardArea.style.display = 'block';

    // Botón: volver a la vista anterior
    document.getElementById('close-leaderboard')?.addEventListener('click', () => {
        leaderboardArea.style.display = 'none';
        if (previousView === 'game') {
            gameArea.style.display = 'flex';
        } else {
            showConfig();
        }
    });

    // Botón: descargar el archivo de log
    document.getElementById('download-logs-btn')?.addEventListener('click', () => {
        window.Logger?.downloadLogs();
    });
}

// ─── Exponer initWordle globalmente para que main.js pueda acceder ────────────
window.initWordle = initWordle;
