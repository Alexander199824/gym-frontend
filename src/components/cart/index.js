// Autor: Alexander Echeverria
// src/components/cart/index.js


export { default as CartSidebar } from './CartSidebar';
export { default as GlobalCart } from './GlobalCart';

// Re-exportar el contexto del carrito también para conveniencia
export { useCart, CartProvider } from '../../contexts/CartContext';

/*
DOCUMENTACIÓN DEL ARCHIVO INDEX CART

PROPÓSITO:
Este archivo actúa como un punto de entrada centralizado (barrel export) para todos los
componentes relacionados con el carrito de compras, facilitando las importaciones desde
otros archivos de la aplicación.

FUNCIONALIDADES:
- Exporta todos los componentes del carrito desde un solo lugar
- Re-exporta el contexto del carrito para conveniencia
- Simplifica las rutas de importación en otros archivos

COMPONENTES EXPORTADOS:
- CartSidebar: Componente del sidebar deslizable del carrito
- GlobalCart: Wrapper global que maneja carrito flotante y sidebar

CONTEXTOS RE-EXPORTADOS:
- useCart: Hook para acceder al estado del carrito
- CartProvider: Proveedor del contexto del carrito

ARCHIVOS CONECTADOS:

COMPONENTES LOCALES:
- ./CartSidebar.js: Sidebar del carrito con lista de productos
- ./GlobalCart.js: Carrito flotante y manejo global

CONTEXTOS EXTERNOS:
- ../../contexts/CartContext.js: Contexto global del carrito

USO EN LA APLICACIÓN:
Permite importar componentes del carrito de forma limpia:

EJEMPLO DE USO:
```javascript
// En lugar de múltiples imports:
import CartSidebar from './components/cart/CartSidebar';
import GlobalCart from './components/cart/GlobalCart';
import { useCart } from './contexts/CartContext';

// Se puede hacer un solo import:
import { CartSidebar, GlobalCart, useCart } from './components/cart';
```

BENEFICIOS:
- Importaciones más limpias y organizadas
- Punto único de entrada para componentes del carrito
- Facilita el mantenimiento y refactoring
- Mejora la legibilidad del código en archivos que usan el carrito

ARCHIVOS QUE IMPORTAN DESDE AQUÍ:
- Layout principal de la aplicación
- Páginas que necesitan componentes del carrito
- Otros componentes que interactúan con el carrito
- Tests y archivos de configuración
*/