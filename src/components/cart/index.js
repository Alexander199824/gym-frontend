// src/components/cart/index.js
// FUNCIÓN: Barrel exports para componentes del carrito
// FACILITA: Importaciones limpias desde otros archivos

export { default as CartSidebar } from './CartSidebar';
export { default as GlobalCart } from './GlobalCart';

// Re-exportar el contexto del carrito también para conveniencia
export { useCart, CartProvider } from '../../contexts/CartContext';