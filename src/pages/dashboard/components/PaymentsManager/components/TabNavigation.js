// src/pages/dashboard/components/PaymentsManager/components/TabNavigation.js
// Author: Alexander Echeverria
// Componente de navegación por tabs para el sistema de gestión de pagos
// Incluye contadores dinámicos y indicadores visuales de estado

import React from 'react';
import { Coins, Building, Banknote, TrendingUp, Clock } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange, counters }) => {
  const tabs = [
    {
      id: 'payments',
      name: 'Historial de Pagos',
      icon: Coins,
      color: 'blue',
      counter: counters?.totalPayments || 0,
      showCounter: true
    },
    {
      id: 'transfers',
      name: 'Transferencias',
      icon: Building,
      color: 'purple',
      counter: counters?.pendingTransfers || 0,
      showCounter: true
    },
    {
      id: 'cash',
      name: 'Efectivo',
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
      icon: TrendingUp,
      color: 'orange',
      showCounter: false
    }
  ];

  const getTabClasses = (tab) => {
    const baseClasses = "py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center transition-colors duration-200";
    
    if (activeTab === tab.id) {
      const activeClasses = {
        blue: 'border-blue-500 text-blue-600',
        purple: 'border-purple-500 text-purple-600',
        green: 'border-green-500 text-green-600',
        orange: 'border-orange-500 text-orange-600'
      };
      return `${baseClasses} ${activeClasses[tab.color]}`;
    }
    
    return `${baseClasses} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  };

  const getCounterClasses = (tab) => {
    const counterClasses = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800'
    };
    return `ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${counterClasses[tab.color]}`;
  };

  const getOldClasses = () => {
    return "ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800";
  };

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={getTabClasses(tab)}
            >
              <IconComponent className="w-4 h-4 mr-2" />
              {tab.name}
              
              {/* Contador principal */}
              {tab.showCounter && tab.counter > 0 && (
                <span className={getCounterClasses(tab)}>
                  {tab.counter}
                </span>
              )}
              
              {/* Contador de antiguos (solo para efectivo) */}
              {tab.showOld && tab.oldCounter > 0 && (
                <span className={getOldClasses()}>
                  <Clock className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;

// Este componente maneja la navegación entre los diferentes tabs del sistema de pagos
// Muestra contadores dinámicos para cada sección y indicadores de urgencia
// Proporciona feedback visual claro sobre el estado de cada módulo