// src/components/cart/GlobalCart.js
// FUNCIÓN: Wrapper global MEJORADO - Sin duplicación de iconos + Solo CartSidebar
// CAMBIOS: ✅ Elimina icono flotante ✅ Solo el sidebar ✅ Sin duplicación

import React from 'react';
import CartSidebar from './CartSidebar'; // ✅ Solo usa el CartSidebar existente

const GlobalCart = () => {
  return (
    <>
      {/* ✅ SOLO CartSidebar - Sin icono flotante duplicado */}
      <CartSidebar />
      
      {/* ❌ REMOVIDO: FloatingCartIcon para evitar duplicación */}
      {/* Los botones de carrito están en los headers de las páginas */}
    </>
  );
};

export default GlobalCart;

// 📝 CAMBIOS REALIZADOS:
// 
// ✅ ELIMINACIÓN DE DUPLICACIÓN:
// - Removido FloatingCartIcon completamente
// - Solo mantiene CartSidebar global
// - Los botones de carrito quedan en los headers
// 
// ✅ INTERFAZ LIMPIA:
// - Un solo punto de acceso al carrito por página
// - No más iconos flotantes confusos
// - Mejor UX sin elementos duplicados