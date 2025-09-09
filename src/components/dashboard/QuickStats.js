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
        <div key={index} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 break-words">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </div>
            {stat.change !== undefined && stat.change !== null && (
              <div className={`flex items-center ml-2 ${
                stat.change > 0 ? 'text-green-600' : stat.change < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stat.change > 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : stat.change < 0 ? (
                  <TrendingDown className="w-4 h-4 mr-1" />
                ) : null}
                <span className="text-sm font-medium">
                  {stat.change === 0 ? '0%' : `${Math.abs(stat.change)}%`}
                </span>
              </div>
            )}
          </div>
          
          {/* Indicador visual opcional */}
          {stat.color && (
            <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${stat.color}`}
                style={{ width: `${Math.min(Math.max(stat.progress || 0, 0), 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuickStats;

/*
FUNCIONALIDAD:
Este componente se encarga de mostrar estadísticas rápidas en tarjetas para el dashboard administrativo del gimnasio.
Presenta métricas clave de manera visual y accesible, con indicadores de tendencia y estado de carga.
Está optimizado para mostrar datos financieros en quetzales guatemaltecos y métricas operativas del gimnasio.

CARACTERÍSTICAS PRINCIPALES:
- Muestra estadísticas en formato de tarjetas responsivas con efecto hover
- Incluye estado de carga con animación de skeleton mientras cargan los datos
- Presenta indicadores de cambio y tendencia con iconos y colores intuitivos
- Grid responsivo que se adapta a diferentes tamaños de pantalla (1-2-4 columnas)
- Manejo de datos dinámicos desde props del componente padre
- Indicadores visuales de crecimiento (verde), decrecimiento (rojo) o estabilidad (gris)
- Soporte para subtítulos adicionales y barras de progreso opcionales
- Manejo seguro de valores nulos o indefinidos

ESTRUCTURA DE DATOS ESPERADA:
Recibe un array de estadísticas con la siguiente estructura:
- label: Etiqueta descriptiva de la métrica (ej: "Ingresos del Mes")
- value: Valor actual de la estadística (ej: "Q 15,450.00")
- change: Porcentaje de cambio (opcional, puede ser positivo, negativo o cero)
- subtitle: Texto adicional descriptivo (opcional)
- color: Clase CSS para color de barra de progreso (opcional)
- progress: Valor entre 0-100 para barra de progreso (opcional)

TIPOS DE MÉTRICAS QUE MANEJA:
- Ingresos mensuales y diarios en quetzales
- Número de miembros activos vs objetivo
- Membresías vencidas y por vencer
- Asistencia diaria promedio
- Nuevos registros del mes
- Porcentajes de ocupación del gimnasio
- Métricas de retención de clientes

CONEXIONES CON OTROS ARCHIVOS:
- Importa desde 'react' para funcionalidad del componente
- Importa iconos desde 'lucide-react' (TrendingUp, TrendingDown) para indicadores visuales
- Utilizado en componentes del dashboard principal que agregan métricas del gimnasio
- Recibe datos de componentes padre que calculan estadísticas desde APIs del backend
- Se integra con el layout del dashboard principal en /dashboard
- Conecta con sistemas de métricas como:
  * PaymentChart.js para datos de ingresos
  * ExpiredMemberships.js para conteo de membresías
  * APIs de usuarios para estadísticas de miembros
  * APIs de asistencia para métricas de uso del gimnasio

LO QUE VE EL USUARIO:
- Tarjetas blancas con sombra y efecto hover en una cuadrícula responsiva
- Durante la carga: Placeholders animados (skeleton) en gris que pulsan suavemente
- Para cada estadística:
  * Etiqueta descriptiva en gris (ej: "Ingresos del Mes")
  * Valor principal en texto grande y negrita (ej: "Q 15,450.00")
  * Flecha verde hacia arriba con porcentaje para crecimiento (ej: "↗ 12%")
  * Flecha roja hacia abajo con porcentaje para decrecimiento (ej: "↘ 5%")
  * Texto gris con "0%" cuando no hay cambios
  * Subtítulo opcional en gris claro (ej: "vs mes anterior")
  * Barra de progreso colorida opcional en la parte inferior
- Diseño que se adapta automáticamente: 1 columna en móvil, 2 en tablet, 4 en escritorio
- Transiciones suaves en hover y cambios de estado

CASOS DE USO TÍPICOS EN EL DASHBOARD:
- "Ingresos del Mes: Q 45,230.00 ↗ 15%" 
- "Miembros Activos: 342 ↗ 8%"
- "Membresías Vencidas: 12 ↘ 3%"
- "Asistencia Promedio: 89% ↗ 2%"

PROPÓSITO:
Proporcionar una vista rápida y comprensible de las métricas más importantes del gimnasio,
permitiendo al personal administrativo monitorear el rendimiento del negocio de un vistazo,
identificar tendencias positivas o negativas en indicadores clave, y tomar decisiones informadas
basadas en datos actualizados. Facilita el seguimiento del progreso hacia objetivos y la 
detección temprana de problemas que requieren atención inmediata.
*/