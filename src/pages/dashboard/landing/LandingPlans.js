// src/pages/dashboard/landing/LandingPlans.js
// SECCIÓN DE PLANES DE MEMBRESÍA

import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Shield, Check, Calendar } from 'lucide-react';
import { getPlanIcon } from './landingUtils';

const LandingPlans = ({ plans, isMobile, currencySymbol }) => {
  if (!plans || plans.length === 0) {
    return null;
  }

  return (
    <section id="planes" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-secondary-50 rounded-full mb-4">
            <Crown className="w-4 h-4 text-secondary-600 mr-2" />
            <span className="text-sm font-semibold text-secondary-700">
              Planes de Membresía
            </span>
          </div>
          <h2 className={`font-bold text-gray-900 mb-4 ${
            isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'
          }`}>
            Elige tu plan{' '}
            <span className="text-primary-600">ideal</span>
          </h2>
          <p className={`text-gray-600 max-w-3xl mx-auto ${
            isMobile ? 'text-base' : 'text-xl'
          }`}>
            Planes diseñados para diferentes objetivos y estilos de vida
          </p>
        </div>

        {/* Planes */}
        {isMobile ? (
          // Móvil: Scroll horizontal
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4" style={{ width: `${plans.length * 280}px` }}>
              {plans.map((plan) => (
                <MobilePlanCard 
                  key={plan.id} 
                  plan={plan}
                  currencySymbol={currencySymbol}
                />
              ))}
            </div>
          </div>
        ) : (
          // Desktop: Grid
          <div className={`grid gap-8 max-w-6xl mx-auto ${
            plans.length === 1 ? 'grid-cols-1 max-w-md' :
            plans.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {plans.map((plan) => {
              const IconComponent = getPlanIcon(plan.iconName);

              return (
                <div key={plan.id} className={`
                  relative bg-white rounded-3xl shadow-xl p-8 transition-all duration-300
                  ${plan.popular ? 'ring-2 ring-primary-500 scale-105' : 'hover:scale-105'}
                `}>
                  
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                        Más Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-primary-600" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {plan.name}
                    </h3>

                    <div className="mb-8">
                      <div className="flex items-baseline justify-center mb-2">
                        <span className="text-5xl font-bold text-gray-900">
                          {currencySymbol}{plan.price}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{plan.duration}
                        </span>
                      </div>
                      {plan.originalPrice && plan.originalPrice > plan.price && (
                        <div className="text-sm text-gray-500">
                          <span className="line-through">{currencySymbol}{plan.originalPrice}</span>
                          <span className="ml-2 text-green-600 font-semibold">
                            Ahorra {currencySymbol}{plan.originalPrice - plan.price}
                          </span>
                        </div>
                      )}
                    </div>

                    {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                      <ul className="space-y-4 mb-8 text-left">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <Link 
                      to="/register"
                      className={`
                        w-full btn text-center font-semibold py-4
                        ${plan.popular ? 'btn-primary' : 'btn-secondary'}
                      `}
                    >
                      {plan.popular ? 'Elegir Plan Popular' : 'Elegir Plan'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Garantía */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-lg border border-gray-200">
            <Shield className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-sm font-semibold text-gray-700">
              Garantía de satisfacción 30 días
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// Componente: Tarjeta de plan móvil
const MobilePlanCard = ({ plan, currencySymbol = 'Q' }) => {
  const IconComponent = getPlanIcon(plan.iconName);

  return (
    <div className={`
      relative bg-white rounded-2xl shadow-lg p-6 w-64 flex-shrink-0
      ${plan.popular ? 'ring-2 ring-primary-500' : ''}
    `}>
      
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold">
            Popular
          </span>
        </div>
      )}

      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-primary-600" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-3">
          {plan.name}
        </h3>

        <div className="mb-6">
          <div className="flex items-baseline justify-center mb-1">
            <span className="text-3xl font-bold text-gray-900">
              {currencySymbol}{plan.price}
            </span>
            <span className="text-gray-600 ml-1 text-sm">
              /{plan.duration}
            </span>
          </div>
          {plan.originalPrice && plan.originalPrice > plan.price && (
            <div className="text-xs text-gray-500">
              <span className="line-through">{currencySymbol}{plan.originalPrice}</span>
              <span className="ml-1 text-green-600 font-semibold">
                -{currencySymbol}{plan.originalPrice - plan.price}
              </span>
            </div>
          )}
        </div>

        {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
          <ul className="space-y-2 mb-6 text-left">
            {plan.features.slice(0, 4).map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start">
                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <Link 
          to="/register"
          className={`
            w-full btn text-center font-semibold py-3 text-sm
            ${plan.popular ? 'btn-primary' : 'btn-secondary'}
          `}
        >
          {plan.popular ? 'Elegir' : 'Elegir Plan'}
        </Link>
      </div>
    </div>
  );
};

export default LandingPlans;