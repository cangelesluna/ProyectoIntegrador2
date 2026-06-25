# Directorio Digital de Negocios

Plataforma web inspirada en la experiencia de Mall Aventura para explorar negocios, productos y servicios sin necesidad de registrarse.

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore
- Firebase Storage

## Estructura del proyecto

- `src/components` - Componentes UI reutilizables
- `src/pages` - Páginas principales
- `src/layouts` - Layouts de app
- `src/routes` - Rutas de la aplicación
- `src/contexts` - Contextos de React
- `src/services` - Configuración de Firebase
- `src/types` - Tipos TypeScript
- `src/data` - Datos de ejemplo

## Instalación

1. Copia el archivo `.env.example` a `.env`.
2. Configura las variables de Firebase.
3. Instala dependencias:

```bash
npm install
```

4. Ejecuta la app en desarrollo:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Ejecutar en desarrollo
- `npm run build` - Generar producción
- `npm run preview` - Vista previa de producción
- `npm run deploy:gh` - Generar build y desplegar en GitHub Pages
- `npm run deploy:hostinger` - Generar build para Hostinger

## Configuración Firebase

Crea un proyecto en Firebase y habilita:

- Authentication > Correo y contraseña
- Firestore
- Storage

## Firestore Collections

- `users`
- `categories`
- `businesses`
- `products`
- `promotions`
- `gallery`
- `banners`
- `statistics`

## Futuras mejoras

- Calificaciones y reseñas
- Favoritos
- Planes premium
- Multi ciudad / sucursal
- Integración con WhatsApp Business
- SEO avanzado
