// Autor: Alexander Echeverria
// Ubicación: /gym-frontend/src/components/dashboard/QuickStats.js

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const QuickStats = ({ stats = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            {stat.change && (
              <div className={`flex items-center ${
                stat.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change > 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">{Math.abs(stat.change)}%</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;

/*
FUNCIONALIDAD:
Este componente se encarga de mostrar estadísticas rápidas en tarjetas para el dashboard administrativo del gimnasio.
Presenta métricas clave de manera visual y accesible, con indicadores de tendencia.

CARACTERÍSTICAS:
- Muestra estadísticas en formato de tarjetas responsivas
- Incluye estado de carga con animación de skeleton
- Presenta indicadores de cambio/tendencia con iconos y colores
- Grid responsivo que se adapta a diferentes tamaños de pantalla
- Manejo de datos dinámicos desde props
- Indicadores visuales de crecimiento (verde) o decrecimiento (rojo)

ESTRUCTURA DE DATOS:
Recibe un array de estadísticas con la siguiente estructura:
- label: Etiqueta descriptiva de la métrica
- value: Valor actual de la estadística
- change: Porcentaje de cambio (opcional, puede ser positivo o negativo)

CONEXIONES:
- Importa desde 'react' para funcionalidad del componente
- Importa iconos desde 'lucide-react' (TrendingUp, TrendingDown)
- Utilizado en componentes del dashboard que agregan métricas del gimnasio
- Recibe datos de componentes padre que calculan estadísticas desde APIs
- Se integra con el layout del dashboard principal
- Conecta con sistemas de métricas como ingresos, membresías activas, usuarios registrados

PROPÓSITO:
Proporcionar una vista rápida y comprensible de las métricas más importantes del gimnasio,
permitiendo al personal administrativo monitorear el rendimiento del negocio de un vistazo
y identificar tendencias positivas o negativas en indicadores clave.
*/