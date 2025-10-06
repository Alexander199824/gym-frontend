// src/pages/dashboard/landing/LandingStore.js
// SECCIÓN DE TIENDA CON PRODUCTOS - VERSIÓN LIMPIA SIN BADGES

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, ArrowRight, 
  ChevronLeft, ChevronRight, Loader2 
} from 'lucide-react';

const LandingStore = ({ 
  products, 
  isMobile, 
  currencySymbol,
  onAddToCart,
  currentProductIndex,
  setCurrentProductIndex
}) => {
  // Si no hay productos, no renderizar nada
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <section id="tienda" className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la sección */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full mb-4">
            <ShoppingCart className="w-4 h-4 text-primary-600 mr-2" />
            <span className="text-sm font-semibold text-primary-700">
              Tienda Elite Fitness
            </span>
          </div>
          <h2 className={`font-bold text-gray-900 mb-4 ${
            isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
          }`}>
            Productos{' '}
            <span className="text-primary-600">premium</span>
          </h2>
          <p className={`text-gray-600 max-w-3xl mx-auto ${
            isMobile ? 'text-base' : 'text-xl'
          }`}>
            Descubre nuestra selección de productos de alta calidad
          </p>
        </div>

        {/* Productos - Carousel en móvil, Grid en desktop */}
        {isMobile ? (
          // Móvil: Carousel automático
          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentProductIndex * 100}%)` }}
              >
                {products.map((product) => (
                  <div key={product.id} className="w-full flex-shrink-0 px-4">
                    <MobileProductCard 
                      product={product} 
                      onAddToCart={onAddToCart}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Indicadores de carousel */}
            <div className="flex justify-center mt-6 space-x-2">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentProductIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentProductIndex 
                      ? 'bg-primary-500 scale-125' 
                      : 'bg-gray-300'
                  }`}
                  aria-label={`Ver producto ${index + 1}`}
                />
              ))}
            </div>

            {/* Controles de navegación */}
            <button
              onClick={() => setCurrentProductIndex(prev => 
                prev === 0 ? products.length - 1 : prev - 1
              )}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Producto anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={() => setCurrentProductIndex(prev => 
                prev === products.length - 1 ? 0 : prev + 1
              )}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Producto siguiente"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        ) : (
          // Desktop: Grid normal
          <div className={`grid gap-8 mb-12 ${
            products.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            products.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {products.slice(0, 3).map((product) => (
              <ProductPreviewCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart}
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        )}

        {/* CTA para ver tienda completa */}
        <div className="text-center mt-8">
          <Link 
            to="/store"
            className={`btn-primary font-semibold hover:scale-105 transition-all ${
              isMobile ? 'py-3 px-6 text-base' : 'px-8 py-4 text-lg'
            }`}
          >
            Ver tienda completa
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ============================================
// COMPONENTE: Tarjeta de producto para móvil
// ============================================
const MobileProductCard = ({ product, onAddToCart, currencySymbol = 'Q' }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (isAdding) return;

    try {
      setIsAdding(true);
      await onAddToCart(product);
    } catch (error) {
      console.error('Error en tarjeta de producto móvil:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="aspect-w-4 aspect-h-3">
        <img 
          src={product.images?.[0]?.url || "/api/placeholder/300/225"}
          alt={product.name}
          className="object-cover w-full h-40"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary-600">
            {currencySymbol}{product.price}
          </span>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isAdding && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{isAdding ? 'Agregando...' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Tarjeta de producto para desktop
// ============================================
const ProductPreviewCard = ({ product, onAddToCart, currencySymbol = 'Q' }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (isAdding) return;

    try {
      setIsAdding(true);
      await onAddToCart(product);
    } catch (error) {
      console.error('Error en tarjeta de producto desktop:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-w-4 aspect-h-3">
        <img 
          src={product.images?.[0]?.url || "/api/placeholder/300/225"}
          alt={product.name}
          className="object-cover w-full h-48"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary-600">
            {currencySymbol}{product.price}
          </span>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isAdding && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{isAdding ? 'Agregando...' : 'Agregar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingStore;

/**
 * DOCUMENTACIÓN DEL COMPONENTE LandingStore
 * 
 * PROPÓSITO:
 * Muestra la sección de tienda con productos destacados.
 * Incluye carousel automático en móvil y grid en desktop.
 * 
 * PROPS:
 * - products: Array de productos destacados
 * - isMobile: boolean - Si es vista móvil
 * - currencySymbol: string - Símbolo de moneda (ej: 'Q')
 * - onAddToCart: function - Función para agregar al carrito
 * - currentProductIndex: number - Índice del producto actual (carousel)
 * - setCurrentProductIndex: function - Función para cambiar índice
 * 
 * CARACTERÍSTICAS:
 * - ✅ Carousel automático en móvil (controlado desde padre)
 * - ✅ Grid responsivo en desktop
 * - ✅ Agregar al carrito con loading
 * - ✅ Indicadores de navegación
 * - ✅ Controles manuales en móvil
 * - ✅ Link a tienda completa
 * - ✅ No renderiza si no hay productos
 * - ✅ SIN badges de envío gratis ni garantía
 * 
 * INTEGRACIÓN:
 * - El carousel automático se maneja desde LandingPage.js
 * - Los productos vienen del hook useFeaturedProducts()
 * - onAddToCart viene del CartContext
 */