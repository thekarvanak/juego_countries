# 🌍 REST Countries Explorer

Una aplicación web moderna y funcional que consume la API pública REST Countries para mostrar información detallada de países de todo el mundo.

## 🎯 Características

- ✅ **Búsqueda en tiempo real** - Busca países por nombre o capital con debouncing
- ✅ **Filtrado por región** - Filtra países por continente (África, América, Asia, Europa, Oceanía)
- ✅ **Ordenamiento múltiple** - Ordena por nombre, población o área
- ✅ **Vista detallada** - Modal con información completa de cada país
- ✅ **🎮 Wordle de Países** - Juego interactivo para adivinar países (NUEVO)
- ✅ **Diseño responsive** - Adaptado para móviles, tablets y desktop
- ✅ **Accesibilidad** - Navegación por teclado y ARIA labels
- ✅ **JavaScript puro** - Sin frameworks ni librerías externas

## 🚀 Tecnologías

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con variables CSS, Grid y Flexbox
- **JavaScript ES2022+** - Lógica modular con async/await
- **REST Countries API v3.1** - Fuente de datos

## 📁 Estructura del Proyecto

```
rest-countries-app/
│
├── index.html                 # Estructura HTML principal
│
├── css/
│   ├── main.css              # Variables, layout y estilos base
│   ├── components.css        # Estilos de componentes (cards, modal, badges)
│   ├── responsive.css        # Media queries y diseño adaptativo
│   └── wordle.css            # Estilos del juego Wordle
│
└── js/
    ├── api.js                # Funciones de comunicación con la API
    ├── render.js             # Funciones de renderización del DOM
    ├── filters.js            # Lógica de filtrado y búsqueda
    ├── modal.js              # Gestión del modal de detalles
    ├── main.js               # Punto de entrada y coordinación
    ├── wordle-api.js         # API del juego Wordle
    ├── wordle-game.js        # Lógica del juego Wordle
    └── wordle-ui.js          # Interfaz del juego Wordle (módulo ES6)
```

## 🔧 Instalación y Uso

### Opción 1: Abrir directamente en el navegador

1. Descarga o clona este repositorio
2. Abre el archivo `index.html` en tu navegador web moderno (Chrome, Firefox, Edge, Safari)
3. ¡Listo! La aplicación cargará automáticamente todos los países

### Opción 2: Servidor local (recomendado)

Para evitar posibles problemas con CORS, es recomendable usar un servidor local:

**Con Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Con Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Con PHP:**
```bash
php -S localhost:8000
```

**Con VS Code:**
- Instala la extensión "Live Server"
- Click derecho en `index.html` → "Open with Live Server"

Luego abre tu navegador en `http://localhost:8000`

## 📖 Uso de la Aplicación

### Búsqueda
- Escribe en el campo de búsqueda para filtrar países por nombre o capital
- La búsqueda se actualiza automáticamente mientras escribes

### Filtros
- **Región**: Selecciona un continente para ver solo países de esa región
- **Ordenar**: Ordena los resultados por nombre, población o área

### Ver Detalles
- Click en cualquier tarjeta de país para ver información detallada
- También puedes usar Tab + Enter para navegar con el teclado

### Restablecer
- Click en "Restablecer filtros" para volver a mostrar todos los países

### 🎮 Wordle de Países (NUEVO)
- Click en el botón "🎮 Jugar Wordle de Países" en el header
- Adivina el nombre del país en español en 6 intentos
- Cada letra se colorea según su estado:
  - **Verde**: Letra correcta en la posición correcta
  - **Amarillo**: Letra correcta pero en posición incorrecta
  - **Gris**: Letra no está en la palabra
- Usa el teclado virtual o el teclado físico para jugar
- Al terminar, verás el nombre real del país y su bandera
- Click en "Jugar de nuevo" para obtener un nuevo país aleatorio

## 🔍 Funcionalidades Técnicas

### API Endpoints Utilizados

```javascript
// Obtener todos los países
GET https://restcountries.com/v3.1/all?fields=name,capital,region,subregion,population,area,flags,cca3

// Buscar por nombre
GET https://restcountries.com/v3.1/name/{name}?fields=...

// Filtrar por región
GET https://restcountries.com/v3.1/region/{region}?fields=...

// Obtener detalles por código
GET https://restcountries.com/v3.1/alpha/{code}?fields=...
```

### Validaciones Implementadas

Cada petición a la API incluye:
- ✅ Validación de `response.ok` antes de parsear
- ✅ Manejo de errores con try/catch
- ✅ Verificación de arrays no vacíos
- ✅ Headers adecuados (`Accept: application/json`)
- ✅ Parámetro `fields` para optimizar payloads

### Testing de API

Los archivos incluyen ejemplos de uso comentados. Para probarlos:

1. Abre la consola del navegador (F12)
2. Copia y ejecuta los ejemplos de `js/api.js`

```javascript
// Ejemplo: Obtener todos los países
getAllCountries()
    .then(countries => console.log('Países:', countries))
    .catch(error => console.error('Error:', error));
```

## 🎨 Personalización

### Variables CSS

Todas las variables de diseño están en `css/main.css`:

```css
:root {
    --color-primary: #3b82f6;
    --color-background: #f8fafc;
    --spacing-md: 1rem;
    /* ... más variables */
}
```

### Agregar Nuevos Filtros

Para agregar filtros adicionales:

1. Actualiza `js/filters.js` con la nueva lógica
2. Agrega el control en `index.html`
3. Conecta el evento en `js/main.js`

## 🌐 Compatibilidad

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 Notas Importantes

- La aplicación requiere conexión a Internet para funcionar
- Todos los datos provienen de la API REST Countries
- No se usan datos simulados ni cacheados
- La aplicación es completamente estática (sin backend)

## 🐛 Troubleshooting

**Problema: No cargan los países**
- Verifica tu conexión a Internet
- Abre la consola del navegador para ver errores
- Comprueba que la API esté disponible: https://restcountries.com/v3.1/all

**Problema: Errores CORS**
- Usa un servidor local en lugar de abrir el archivo directamente
- Verifica que todos los archivos estén en las rutas correctas

**Problema: Estilos no se aplican**
- Verifica que los archivos CSS estén en la carpeta `css/`
- Comprueba las rutas en las etiquetas `<link>` del HTML

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👏 Créditos

- Datos: [REST Countries API](https://restcountries.com)
- Desarrollado con JavaScript puro
- Sin dependencias externas

---

**¿Tienes sugerencias o encontraste un bug?** 
¡Las contribuciones son bienvenidas!
