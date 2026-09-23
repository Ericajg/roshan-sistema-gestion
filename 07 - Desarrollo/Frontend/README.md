# Roshan Spa Dashboard

# Interfaz — Panel de escritorio "Roshan" (gestión de turnos para masajes)

## 🎯 Intención

Construir el front-end funcional (solo interfaz visual, sin backend ni base de datos real) del panel de escritorio para "Roshan", un emprendimiento de masajes, con navegación por barra lateral fija donde cada botón lleva a una función específica.

## 📋 Detalles

- Plataforma: web, pero pensada y optimizada exclusivamente para uso de escritorio (no priorizar mobile-first).

- Usuario único: el dueño del emprendimiento — sin login real todavía, sin roles ni permisos.

- Identidad de marca (aproximación visual, sin archivo vectorial del logo):

  - Isotipo: loto dorado con detalles ornamentales sobre fondo azul marino profundo.

  - Tipografía tipo serif elegante en dorado para títulos/logo, sans-serif legible para el resto.

  - Paleta: azul marino oscuro (#0A1A3C) como fondo base, dorado (#D4AF37 / #F0C674) como acento principal, blanco/crema para texto sobre fondo oscuro.

  - Tono visual: lujo, elegancia, spa premium — nada de estilo dashboard corporativo genérico.

- Todos los datos deben ser **mock data** (datos de ejemplo hardcodeados en el frontend), sin conexión a base de datos ni backend por ahora.

- Estructura de navegación (sidebar): Agenda, Clientes, Servicios, Pagos.

- Vista semanal de agenda en columnas (un día por columna, horarios en filas).

## 💡 Ejemplos

Layout de referencia (sidebar + panel central tipo dashboard, adaptado a paleta navy+gold):

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/09e87789-e086-41fa-8ebd-8c767c7b9990).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
