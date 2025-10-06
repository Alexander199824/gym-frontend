// src/pages/dashboard/landing/LandingContact.js
// SECCIÓN DE CONTACTO - SIN DATOS HARDCODEADOS

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock } from 'lucide-react';
import { getSocialIcon } from './landingUtils';

const LandingContact = ({ gymConfig, isMobile }) => {
  return (
    <section id="contacto" className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${isMobile ? 'space-y-12' : 'grid grid-cols-1 lg:grid-cols-2 gap-16'} items-center`}>
          
          {/* Información de contacto */}
          <div className="space-y-8">
            <div>
              <h2 className={`font-bold mb-4 ${
                isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
              }`}>
                ¿Listo para comenzar?
              </h2>
              <p className={`text-gray-300 leading-relaxed ${
                isMobile ? 'text-base' : 'text-xl'
              }`}>
                Únete a {gymConfig.name} y comienza tu transformación hoy mismo.
              </p>
            </div>

            {/* Datos de contacto desde el backend */}
            <div className={`space-y-4 ${isMobile ? 'grid grid-cols-1 gap-4' : 'space-y-6'}`}>
              {gymConfig.contact?.address && (
                <div className="flex items-center">
                  <div className={`bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4 ${
                    isMobile ? 'w-10 h-10' : 'w-12 h-12'
                  }`}>
                    <MapPin className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                  </div>
                  <div>
                    <div className="font-semibold">Ubicación</div>
                    <div className="text-gray-300 text-sm">
                      {gymConfig.contact.address}
                    </div>
                  </div>
                </div>
              )}

              {gymConfig.contact?.phone && (
                <div className="flex items-center">
                  <div className={`bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4 ${
                    isMobile ? 'w-10 h-10' : 'w-12 h-12'
                  }`}>
                    <Phone className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                  </div>
                  <div>
                    <div className="font-semibold">Teléfono</div>
                    <div className="text-gray-300 text-sm">
                      {gymConfig.contact.phone}
                    </div>
                  </div>
                </div>
              )}

              {gymConfig.hours?.full && (
                <div className="flex items-center">
                  <div className={`bg-white bg-opacity-10 rounded-xl flex items-center justify-center mr-4 ${
                    isMobile ? 'w-10 h-10' : 'w-12 h-12'
                  }`}>
                    <Clock className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                  </div>
                  <div>
                    <div className="font-semibold">Horarios</div>
                    <div className="text-gray-300 text-sm">
                      {gymConfig.hours.full}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Redes sociales */}
            {gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
              <div className={`flex space-x-3 ${isMobile ? 'justify-center' : ''}`}>
                {Object.entries(gymConfig.social).map(([platform, data]) => {
                  if (!data || !data.url) return null;
                  const IconComponent = getSocialIcon(platform);

                  return (
                    <a 
                      key={platform}
                      href={data.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`bg-white bg-opacity-10 rounded-xl flex items-center justify-center hover:bg-opacity-20 transition-all hover:scale-110 ${
                        isMobile ? 'w-10 h-10' : 'w-12 h-12'
                      }`}
                      title={data.handle}
                    >
                      <IconComponent className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* CTA Card - Solo botones sin lista hardcodeada */}
          <div className={`bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl border border-white border-opacity-20 ${
            isMobile ? 'p-6' : 'p-10'
          }`}>
            <h3 className={`font-bold mb-8 ${
              isMobile ? 'text-2xl' : 'text-3xl'
            }`}>
              Únete Ahora
            </h3>

            {/* Botones de acción */}
            <div className="space-y-3">
              <Link to="/register" className={`w-full btn bg-white text-gray-900 hover:bg-gray-100 font-bold ${
                isMobile ? 'py-3 text-base' : 'py-4 text-lg'
              }`}>
                Únete Ahora
              </Link>
              <Link to="/login" className={`w-full btn btn-secondary border-white text-white hover:bg-white hover:text-gray-900 ${
                isMobile ? 'py-3' : 'py-4'
              }`}>
                Ya soy miembro
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingContact;

/**
 * DOCUMENTACIÓN DEL COMPONENTE LandingContact
 * 
 * PROPÓSITO:
 * Muestra la sección de contacto con información del gimnasio
 * y CTAs para registro/login. TODO dinámico desde el backend.
 * 
 * PROPS:
 * - gymConfig: Objeto con configuración del gimnasio
 *   {
 *     name: string,
 *     contact: {
 *       address: string,
 *       phone: string,
 *       email: string
 *     },
 *     hours: {
 *       full: string
 *     },
 *     social: {
 *       instagram: { url, handle },
 *       facebook: { url, handle },
 *       ...
 *     }
 *   }
 * - isMobile: boolean - Si es vista móvil
 * 
 * CARACTERÍSTICAS:
 * - ✅ Información 100% dinámica desde backend
 * - ✅ Sin datos hardcodeados
 * - ✅ Redes sociales dinámicas
 * - ✅ CTAs para registro y login
 * - ✅ Responsive móvil/desktop
 * - ✅ Solo muestra datos que existen en el backend
 * 
 * INTEGRACIÓN:
 * - Usado en LandingPage.js
 * - Datos vienen del hook useGymConfig()
 * - Iconos de redes sociales mapeados en landingUtils.js
 */