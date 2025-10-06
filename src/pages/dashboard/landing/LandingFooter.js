// src/pages/dashboard/landing/LandingFooter.js
// FOOTER DE LA LANDING PAGE

import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { getSocialIcon } from './landingUtils';
import GymLogo from '../../../components/common/GymLogo';

const LandingFooter = ({ 
  gymConfig, 
  config, 
  services, 
  plans, 
  products, 
  isMobile 
}) => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Contenido principal del footer */}
        <div className={`grid gap-8 ${
          isMobile ? 'grid-cols-1 text-center' : 'grid-cols-1 md:grid-cols-4'
        }`}>
          
          {/* Logo y descripción */}
          <div className="space-y-4">
            {config && config.logo && config.logo.url ? (
              <div className="flex items-center space-x-3 justify-center md:justify-start">
                <img 
                  src={config.logo.url}
                  alt={config.logo.alt || gymConfig.name}
                  className="h-12 w-auto object-contain"
                />
                <span className="text-xl font-bold">
                  {gymConfig.name}
                </span>
              </div>
            ) : (
              <GymLogo 
                size={isMobile ? "md" : "lg"} 
                variant="white" 
                showText={true} 
                priority="low" 
              />
            )}
            <p className="text-gray-400 leading-relaxed text-sm">
              {gymConfig.description}
            </p>
          </div>

          {/* Enlaces rápidos - solo en desktop */}
          {!isMobile && (
            <>
              <div>
                <h3 className="font-semibold mb-4 text-lg">Enlaces Rápidos</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#inicio" className="text-gray-400 hover:text-white transition-colors">
                      Inicio
                    </a>
                  </li>
                  {services && services.length > 0 && (
                    <li>
                      <a href="#servicios" className="text-gray-400 hover:text-white transition-colors">
                        Servicios
                      </a>
                    </li>
                  )}
                  {plans && plans.length > 0 && (
                    <li>
                      <a href="#planes" className="text-gray-400 hover:text-white transition-colors">
                        Planes
                      </a>
                    </li>
                  )}
                  <li>
                    <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                      Iniciar Sesión
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Tienda - solo si hay productos */}
              {products && Array.isArray(products) && products.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Tienda</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link to="/store?category=suplementos" className="text-gray-400 hover:text-white transition-colors">
                        Suplementos
                      </Link>
                    </li>
                    <li>
                      <Link to="/store?category=ropa" className="text-gray-400 hover:text-white transition-colors">
                        Ropa Deportiva
                      </Link>
                    </li>
                    <li>
                      <Link to="/store?category=accesorios" className="text-gray-400 hover:text-white transition-colors">
                        Accesorios
                      </Link>
                    </li>
                  </ul>
                </div>
              )}

              {/* Contacto */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">Contáctanos</h3>
                <ul className="space-y-2">
                  {gymConfig.contact?.phone && (
                    <li className="text-gray-400 text-sm">
                      {gymConfig.contact.phone}
                    </li>
                  )}
                  {gymConfig.contact?.email && (
                    <li className="text-gray-400 text-sm">
                      {gymConfig.contact.email}
                    </li>
                  )}
                  {gymConfig.contact?.address && (
                    <li className="text-gray-400 text-sm">
                      {gymConfig.contact.address}
                    </li>
                  )}
                </ul>

                {/* Redes sociales desktop */}
                {gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
                  <div className="flex space-x-3 mt-4">
                    {Object.entries(gymConfig.social).map(([platform, data]) => {
                      if (!data || !data.url) return null;
                      const IconComponent = getSocialIcon(platform);

                      return (
                        <a 
                          key={platform}
                          href={data.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                        >
                          <IconComponent className="w-4 h-4" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Copyright y redes sociales móvil */}
        <div className={`border-t border-gray-700 pt-6 mt-8 text-center ${
          isMobile ? 'space-y-4' : ''
        }`}>
          <p className="text-gray-400 text-sm">
            &copy; 2024 {gymConfig.name}. Todos los derechos reservados.
          </p>

          {/* Redes sociales móvil */}
          {isMobile && gymConfig.social && Object.keys(gymConfig.social).length > 0 && (
            <div className="flex justify-center space-x-4">
              {Object.entries(gymConfig.social).map(([platform, data]) => {
                if (!data || !data.url) return null;
                const IconComponent = getSocialIcon(platform);

                return (
                  <a 
                    key={platform}
                    href={data.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;