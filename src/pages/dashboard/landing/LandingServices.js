// src/pages/dashboard/landing/LandingServices.js
// SECCIÓN DE SERVICIOS - VERSIÓN COMPLETA Y CORREGIDA

import React from 'react';
import { Zap, Check } from 'lucide-react';
import { getServiceIcon } from './landingUtils';

const LandingServices = ({ 
  services, 
  isMobile, 
  currentServiceIndex, 
  setCurrentServiceIndex 
}) => {
  // Si no hay servicios, no renderizar nada
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <section id="servicios" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la sección */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full mb-4">
            <Zap className="w-4 h-4 text-primary-600 mr-2" />
            <span className="text-sm font-semibold text-primary-700">
              Nuestros Servicios
            </span>
          </div>
          <h2 className={`font-bold text-gray-900 mb-4 ${
            isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
          }`}>
            Todo lo que necesitas para{' '}
            <span className="text-primary-600">alcanzar tus metas</span>
          </h2>
          <p className={`text-gray-600 max-w-3xl mx-auto ${
            isMobile ? 'text-base' : 'text-xl'
          }`}>
            Servicios profesionales diseñados para llevarte al siguiente nivel
          </p>
        </div>

        {/* Servicios - Carousel en móvil, Grid en desktop */}
        {isMobile ? (
          // Móvil: Carousel automático
          <div className="space-y-6">
            {services[currentServiceIndex] && (
              <MobileServiceCard service={services[currentServiceIndex]} />
            )}

            {/* Indicadores de navegación */}
            <div className="flex justify-center space-x-2">
              {services.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentServiceIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentServiceIndex 
                      ? 'bg-primary-500 scale-125' 
                      : 'bg-gray-300'
                  }`}
                  aria-label={`Ver servicio ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          // Desktop: Grid normal
          <div className={`grid gap-12 ${
            services.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            services.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            services.length <= 3 ? 'grid-cols-1 md:grid-cols-3' :
            services.length <= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {services.map((service) => {
              const IconComponent = getServiceIcon(service.icon);

              return (
                <div key={service.id} className="text-center group">
                  {/* Icono del servicio */}
                  <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-all duration-300">
                    <IconComponent className="w-10 h-10 text-primary-600" />
                  </div>

                  {/* Título del servicio */}
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {service.title}
                  </h3>

                  {/* Descripción del servicio */}
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Características del servicio */}
                  {service.features && Array.isArray(service.features) && service.features.length > 0 && (
                    <ul className="text-sm text-gray-500 space-y-2">
                      {service.features.slice(0, 3).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

// ============================================
// COMPONENTE: Tarjeta de servicio para móvil
// ============================================
const MobileServiceCard = ({ service }) => {
  const IconComponent = getServiceIcon(service.icon);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
      {/* Icono del servicio */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
        <IconComponent className="w-8 h-8 text-primary-600" />
      </div>

      {/* Título del servicio */}
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {service.title}
      </h3>

      {/* Descripción del servicio */}
      <p className="text-gray-600 mb-6 leading-relaxed">
        {service.description}
      </p>

      {/* Características del servicio */}
      {service.features && Array.isArray(service.features) && service.features.length > 0 && (
        <ul className="text-sm text-gray-500 space-y-2">
          {service.features.slice(0, 3).map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-500 mr-2" />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LandingServices;

/**
 * DOCUMENTACIÓN DEL COMPONENTE LandingServices
 * 
 * PROPÓSITO:
 * Muestra la sección de servicios del gimnasio.
 * Incluye carousel automático en móvil y grid en desktop.
 * 
 * PROPS:
 * - services: Array de servicios con estructura:
 *   {
 *     id: string | number,
 *     title: string,
 *     description: string,
 *     icon: string,          // nombre del icono (ej: 'dumbbell', 'users')
 *     features: string[],    // array de características
 *     active: boolean        // si está activo (opcional)
 *   }
 * - isMobile: boolean - Si es vista móvil
 * - currentServiceIndex: number - Índice del servicio actual (carousel)
 * - setCurrentServiceIndex: function - Función para cambiar índice
 * 
 * CARACTERÍSTICAS:
 * - ✅ Carousel automático en móvil (controlado desde padre)
 * - ✅ Grid responsivo en desktop
 * - ✅ Iconos dinámicos desde backend
 * - ✅ Indicadores de navegación
 * - ✅ Hover effects en desktop
 * - ✅ Muestra hasta 3 características por servicio
 * - ✅ No renderiza si no hay servicios
 * 
 * INTEGRACIÓN:
 * - El carousel automático se maneja desde LandingPage.js
 * - Los servicios vienen del hook useGymServices()
 * - Los iconos se mapean en landingUtils.js (getServiceIcon)
 * 
 * ICONOS SOPORTADOS (landingUtils.js):
 * - 'user-check', 'users', 'heart', 'dumbbell', 'target', 'activity', 'zap'
 * - Fallback: Dumbbell
 */