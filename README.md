# Cotizador

Sistema web de cotización para una empresa de prendas de vestir con estampado personalizado. Carga el inventario desde una hoja de Google publicada como CSV, permite seleccionar producto, talla y color, agregar logos (por ubicación y número de colores) y genera una cotización con el cálculo total.

## Características principales

- Carga de inventario desde Google Sheets (CSV) mediante Papaparse.
- Selección guiada de producto con filtros encadenados (tipo, fabricante, producto, talla, color).
- Configuración de precios de logos por ubicación y costo por color adicional.
- Cálculo automático de totales (productos + logos).
- Confirmación de pedido que descuenta el inventario local.
- Vista de inventario actual con stock disponible.
- Interfaz con Tailwind CSS.

## Tecnologías usadas

- React 19 (Create React App)
- JavaScript
- Papaparse (parseo de CSV)
- Tailwind CSS
- Jest + Testing Library (tests)

## Requisitos previos

- Node.js 18+ y npm
- Una Google Sheet publicada como CSV (configurar en `src/App.js`, variable `GOOGLE_SHEET_CSV_URL`)

## Cómo ejecutar

```bash
# Instalar dependencias
npm install

# Configurar la URL de la hoja de Google en src/App.js (GOOGLE_SHEET_CSV_URL)

# Servidor de desarrollo (http://localhost:3000)
npm start
```

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de producción en `build/` |
| `npm test` | Ejecuta los tests en modo watch |
| `npm run eject` | Expone la configuración de CRA (irreversible) |

## Estructura del proyecto

```
src/
├── App.js         # Lógica principal del sistema de cotización
├── index.js       # Punto de entrada
├── index.css      # Estilos globales
└── App.test.js    # Pruebas del componente
```