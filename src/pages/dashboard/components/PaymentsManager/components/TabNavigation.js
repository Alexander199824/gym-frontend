// src/pages/dashboard/components/PaymentsManager/components/TabNavigation.js
// Author: Alexander Echeverria
// Componente de navegación por tabs para el sistema de gestión de pagos
// Incluye contadores dinámicos y indicadores visuales de estado

// src/pages/dashboard/components/PaymentsManager/components/TabNavigation.js
// Author: Alexander Echeverria
// Componente de navegación por tabs para el sistema de gestión de pagos
// OPTIMIZADO: Completamente responsive para móvil con scroll horizontal

import React from 'react';
import { Coins, Building, Banknote, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange, counters }) => {
  const tabs = [
    {
      id: 'payments',
      name: 'Historial',
      shortName: 'Historial', // Para móvil
      icon: Coins,
      color: 'blue',
      counter: counters?.totalPayments || 0,
      showCounter: true
    },
    {
      id: 'transfers',
      name: 'Transferencias',
      shortName: 'Transfers', // Para móvil
      icon: Building,
      color: 'purple',
      counter: counters?.pendingTransfers || 0,
      criticalCounter: counters?.criticalTransfers || 0,
      showCounter: true,
      showCritical: true
    },
    {
      id: 'cash',
      name: 'Efectivo',
      shortName: 'Efectivo',
      icon: Banknote,
      color: 'green',
      counter: counters?.pendingCash || 0,
      oldCounter: counters?.urgentCash || 0,
      showCounter: true,
      showOld: true
    },
    {
      id: 'summary',
      name: 'Resumen',
      shortName: 'Resumen',
      icon: TrendingUp,
      color: 'orange',
      showCounter: false
    }
  ];

  const getTabClasses = (tab) => {
    const baseClasses = "relative flex items-center justify-center px-3 sm:px-4 py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 min-w-0 flex-shrink-0";
    
    if (activeTab === tab.id) {
      const activeClasses = {
        blue: 'border-blue-500 text-blue-600 bg-blue-50',
        purple: 'border-purple-500 text-purple-600 bg-purple-50',
        green: 'border-green-500 text-green-600 bg-green-50',
        orange: 'border-orange-500 text-orange-600 bg-orange-50'
      };
      return `${baseClasses} ${activeClasses[tab.color]}`;
    }
    
    return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50`;
  };

  const getCounterClasses = (tab) => {
    const counterClasses = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800'
    };
    return `ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${counterClasses[tab.color]}`;
  };

  const getCriticalClasses = () => {
    return "ml-0.5 sm:ml-1 inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800";
  };

  const getOldClasses = () => {
    return "ml-0.5 sm:ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800";
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Contenedor con scroll horizontal en móvil */}
      <div className="overflow-x-auto scrollbar-hide">
        <nav className="flex min-w-max sm:min-w-0">
          {tabs.map((tab, index) => {
            const IconComponent = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`${getTabClasses(tab)} ${index === 0 ? 'ml-0' : ''}`}
                style={{ minWidth: '80px' }} // Asegurar un ancho mínimo
              >
                {/* Icono y texto principal */}
                <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <IconComponent className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                  
                  {/* Texto que se adapta a la pantalla */}
                  <span className="hidden sm:inline leading-tight">
                    {tab.name}
                  </span>
                  <span className="sm:hidden text-xs leading-tight">
                    {tab.shortName}
                  </span>
                </div>
                
                {/* Contenedor de contadores */}
                <div className="flex items-center">
                  {/* Contador principal */}
                  {tab.showCounter && tab.counter > 0 && (
                    <span className={getCounterClasses(tab)}>
                      {tab.counter}
                    </span>
                  )}
                  
                  {/* Contador crítico para transferencias */}
                  {tab.showCritical && tab.criticalCounter > 0 && (
                    <span className={getCriticalClasses()}>
                      <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                      <span className="hidden sm:inline">{tab.criticalCounter}</span>
                    </span>
                  )}
                  
                  {/* Contador de antiguos para efectivo */}
                  {tab.showOld && tab.oldCounter > 0 && (
                    <span className={getOldClasses()}>
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline ml-0.5">{tab.oldCounter}</span>
                    </span>
                  )}
                </div>
                
                {/* Indicador de notificación para móvil */}
                {(tab.showCritical && tab.criticalCounter > 0) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full sm:hidden"></div>
                )}
                {(tab.showOld && tab.oldCounter > 0 && !(tab.showCritical && tab.criticalCounter > 0)) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full sm:hidden"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Indicador de scroll para móvil */}
      <div className="sm:hidden flex justify-center pt-2 pb-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <div
              key={`indicator-${tab.id}`}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                activeTab === tab.id ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;;

// Este componente maneja la navegación entre los diferentes tabs del sistema de pagos
// Muestra contadores dinámicos para cada sección y indicadores de urgencia
// Proporciona feedback visual claro sobre el estado de cada módulo