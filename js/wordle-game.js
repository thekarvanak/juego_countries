/**
 * wordle-game.js - Lógica del juego Wordle de Países
 * 
 * Este módulo contiene la clase WordleGame que maneja toda la lógica
 * del juego, incluyendo validación de intentos y asignación de colores.
 */

/**
 * Clase que representa el estado y lógica del juego Wordle
 */
export class WordleGame {
    /**
     * Constructor del juego
     * @param {string} palabra - Palabra secreta normalizada en mayúsculas
     */
    constructor(palabra) {
        if (!palabra || typeof palabra !== 'string' || palabra.length < 4) {
            throw new Error('Palabra inválida para el juego');
        }

        this.palabra = palabra.toUpperCase();
        this.historial = []; // Array de intentos realizados
        this.maxIntentos = 6;
    }

    /**
     * Obtiene la longitud de la palabra secreta
     * @returns {number} Longitud de la palabra
     */
    get longitudPalabra() {
        return this.palabra.length;
    }

    /**
     * Obtiene el número de intentos restantes
     * @returns {number} Intentos restantes
     */
    get intentosRestantes() {
        return this.maxIntentos - this.historial.length;
    }

    /**
     * Verifica si el juego ha terminado
     * @returns {boolean} true si el juego terminó
     */
    get terminado() {
        return this.gano || this.intentosRestantes === 0;
    }

    /**
     * Verifica si el jugador ganó
     * @returns {boolean} true si el jugador ganó
     */
    get gano() {
        if (this.historial.length === 0) return false;
        
        const ultimoIntento = this.historial[this.historial.length - 1];
        return ultimoIntento.every(celda => celda.estado === 'correct');
    }

    /**
     * Procesa un intento del jugador
     * @param {string} intento - Palabra ingresada por el jugador
     * @returns {Array} Array de objetos {letra, estado}
     */
    submitIntento(intento) {
        const intentoNormalizado = intento.toUpperCase().trim();

        // Validar longitud
        if (intentoNormalizado.length !== this.palabra.length) {
            throw new Error(`El intento debe tener exactamente ${this.palabra.length} letras`);
        }

        // Validar que no se exceda el límite de intentos
        if (this.terminado) {
            throw new Error('El juego ya ha terminado');
        }

        // Calcular resultado del intento
        const resultado = this.evaluarIntento(intentoNormalizado);

        // Guardar en historial
        this.historial.push(resultado);

        return resultado;
    }

    /**
     * Evalúa un intento y asigna colores según las reglas de Wordle
     * @param {string} intento - Palabra a evaluar
     * @returns {Array} Array de {letra, estado: 'correct' | 'present' | 'absent'}
     */
    evaluarIntento(intento) {
        const resultado = [];
        const letrasIntento = intento.split('');
        const letrasPalabra = this.palabra.split('');
        
        // Crear un mapa de frecuencia de letras en la palabra secreta
        const frecuenciaDisponible = {};
        letrasPalabra.forEach(letra => {
            frecuenciaDisponible[letra] = (frecuenciaDisponible[letra] || 0) + 1;
        });

        // Inicializar resultado con todas las letras en estado 'absent'
        letrasIntento.forEach(letra => {
            resultado.push({ letra, estado: 'absent' });
        });

        // PASO 1: Marcar letras correctas (verdes)
        // Estas tienen prioridad y reducen la frecuencia disponible
        for (let i = 0; i < letrasIntento.length; i++) {
            if (letrasIntento[i] === letrasPalabra[i]) {
                resultado[i].estado = 'correct';
                frecuenciaDisponible[letrasIntento[i]]--;
            }
        }

        // PASO 2: Marcar letras presentes (amarillas)
        // Solo si la letra existe en la palabra y aún hay frecuencia disponible
        for (let i = 0; i < letrasIntento.length; i++) {
            const letra = letrasIntento[i];
            
            // Saltar si ya fue marcada como correcta
            if (resultado[i].estado === 'correct') {
                continue;
            }

            // Verificar si la letra existe en la palabra y hay frecuencia disponible
            if (letrasPalabra.includes(letra) && frecuenciaDisponible[letra] > 0) {
                resultado[i].estado = 'present';
                frecuenciaDisponible[letra]--;
            }
        }

        // PASO 3: El resto ya está marcado como 'absent'

        return resultado;
    }

    /**
     * Obtiene el historial de intentos
     * @returns {Array} Historial de intentos
     */
    getHistorial() {
        return [...this.historial];
    }

    /**
     * Obtiene estadísticas del teclado (mejor estado de cada letra)
     * @returns {Object} Objeto con letras como claves y estados como valores
     */
    getEstadoTeclado() {
        const estadoLetras = {};

        // Prioridad: correct > present > absent
        const prioridad = { correct: 3, present: 2, absent: 1 };

        this.historial.forEach(intento => {
            intento.forEach(({ letra, estado }) => {
                const estadoActual = estadoLetras[letra];
                
                if (!estadoActual || prioridad[estado] > prioridad[estadoActual]) {
                    estadoLetras[letra] = estado;
                }
            });
        });

        return estadoLetras;
    }

    /**
     * Reinicia el juego con una nueva palabra
     * @param {string} nuevaPalabra - Nueva palabra secreta
     */
    reiniciar(nuevaPalabra) {
        if (!nuevaPalabra || typeof nuevaPalabra !== 'string') {
            throw new Error('Palabra inválida');
        }

        this.palabra = nuevaPalabra.toUpperCase();
        this.historial = [];
    }
}
