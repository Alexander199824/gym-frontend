// src/pages/dashboard/landing/LandingTestimonials.js
// SECCIÓN DE TESTIMONIOS - VERSIÓN COMPLETA

import React from 'react';
import { Star } from 'lucide-react';

const LandingTestimonials = ({ testimonials, currentIndex, isMobile }) => {
  // Si no hay testimonios, no renderizar nada
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la sección */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-50 rounded-full mb-4">
            <Star className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm font-semibold text-yellow-700">
              Testimonios
            </span>
          </div>
          <h2 className={`font-bold text-gray-900 mb-4 ${
            isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
          }`}>
            Lo que dicen nuestros{' '}
            <span className="text-primary-600">miembros</span>
          </h2>
        </div>

        {/* Contenedor de testimonios */}
        <div className="max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id || index}
              className={`transition-all duration-500 ${
                index === currentIndex ? 'block opacity-100' : 'hidden opacity-0'
              }`}
            >
              <div className={`bg-gray-50 rounded-3xl text-center ${
                isMobile ? 'p-6' : 'p-12'
              }`}>
                
                {/* Estrellas de rating */}
                <div className="flex justify-center mb-6">
                  {[...Array(Math.min(testimonial.rating || 5, 5))].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-500 fill-current" />
                  ))}
                </div>

                {/* Texto del testimonio */}
                <blockquote className={`text-gray-700 mb-6 leading-relaxed font-medium ${
                  isMobile ? 'text-lg' : 'text-2xl md:text-3xl'
                }`}>
                  "{testimonial.text}"
                </blockquote>

                {/* Información del autor */}
                <div>
                  <div className={`font-bold text-gray-900 ${
                    isMobile ? 'text-lg' : 'text-xl'
                  }`}>
                    {testimonial.name}
                  </div>
                  <div className="text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Indicadores de navegación (puntos) */}
          {testimonials.length > 1 && (
            <div className="flex justify-center mt-8 space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Este botón es solo visual, el cambio se maneja automáticamente
                    // pero podrías agregar funcionalidad manual si quisieras
                  }}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-primary-500 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ver testimonio ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;

/**
 * DOCUMENTACIÓN DEL COMPONENTE LandingTestimonials
 * 
 * PROPÓSITO:
 * Muestra los testimonios de clientes del gimnasio con rotación automática.
 * Incluye sistema de rating con estrellas y navegación por puntos.
 * 
 * PROPS:
 * - testimonials: Array de objetos con estructura:
 *   {
 *     id: string | number,
 *     text: string,          // Texto del testimonio
 *     name: string,          // Nombre del cliente
 *     role: string,          // Rol/descripción del cliente
 *     rating: number         // Rating de 1-5 estrellas
 *   }
 * - currentIndex: number     // Índice del testimonio actual a mostrar
 * - isMobile: boolean        // Si es vista móvil o desktop
 * 
 * CARACTERÍSTICAS:
 * - ✅ Rotación automática controlada desde LandingPage.js
 * - ✅ Sistema de rating visual con estrellas
 * - ✅ Indicadores de navegación (puntos)
 * - ✅ Responsive design para móvil y desktop
 * - ✅ Transiciones suaves entre testimonios
 * - ✅ No renderiza si no hay testimonios
 * 
 * INTEGRACIÓN:
 * - Usado en LandingPage.js
 * - La rotación automática se maneja en el componente padre
 * - Los datos vienen del hook useTestimonials()
 * 
 * EJEMPLO DE USO:
 * <LandingTestimonials
 *   testimonials={testimonials}
 *   currentIndex={currentTestimonialIndex}
 *   isMobile={isMobile}
 * />
 */