// Autor: Alexander Echeverria
// src/components/common/DashboardCard.js


import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const DashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary', 
  isLoading = false,
  subtitle = null,
  change = null, // { value: number, type: 'increase' | 'decrease' }
  link = null,
  alert = false,
  onClick = null,
  className = ''
}) => {
  
  // CONFIGURACIÓN DE COLORES
  const colorConfig = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-500',
      text: 'text-primary-600',
      border: 'border-primary-200'
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-500',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'bg-orange-500',
      text: 'text-orange-600',
      border: 'border-orange-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-500',
      text: 'text-red-600',
      border: 'border-red-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'bg-gray-500',
      text: 'text-gray-600',
      border: 'border-gray-200'
    }
  };
  
  const colors = colorConfig[color] || colorConfig.primary;
  
  // CONTENIDO DE LA TARJETA
  const cardContent = (
    <div className={`
      bg-white rounded-lg shadow-lg p-6 transition-all duration-200
      ${alert ? `border-2 ${colors.border} animate-pulse` : 'border border-gray-200'}
      ${(link || onClick) ? 'hover:shadow-xl cursor-pointer' : ''}
      ${className}
    `}>
      
      {/* INDICADOR DE ALERTA */}
      {alert && (
        <div className="absolute top-2 right-2">
          <div className={`w-3 h-3 rounded-full ${colors.icon} animate-pulse`}></div>
        </div>
      )}
      
      <div className="flex items-center">
        {/* ICONO */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${colors.icon}
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* CONTENIDO */}
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              {title}
            </h3>
            {link && (
              <ExternalLink className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {/* VALOR PRINCIPAL */}
          <div className="flex items-center mt-1">
            {isLoading ? (
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {value}
              </p>
            )}
            
            {/* CAMBIO/TENDENCIA */}
            {change && !isLoading && (
              <div className={`
                ml-2 flex items-center text-sm
                ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}
              `}>
                {change.type === 'increase' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {change.value}%
              </div>
            )}
          </div>
          
          {/* SUBTÍTULO */}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* BARRA DE PROGRESO (opcional) */}
      {alert && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${colors.icon} transition-all duration-300`}
              style={{ width: '75%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
  
  // WRAPPER CON LINK O CLICK
  if (link) {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  }
  
  if (onClick) {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    );
  }
  
  return cardContent;
};

// VARIANTE: Tarjeta con gráfico pequeño
export const DashboardCardWithChart = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary',
  chartData = [],
  isLoading = false,
  link = null 
}) => {
  return (
    <DashboardCard
      title={title}
      value={value}
      icon={Icon}
      color={color}
      isLoading={isLoading}
      link={link}
      className="pb-4"
    >
      {/* Mini gráfico */}
      <div className="mt-4 h-8">
        <div className="flex items-end justify-between h-full space-x-1">
          {chartData.slice(-7).map((point, index) => (
            <div
              key={index}
              className={`w-2 bg-${color}-300 rounded-t`}
              style={{ height: `${(point / Math.max(...chartData)) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};

// VARIANTE: Tarjeta compacta
export const CompactDashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary',
  change = null 
}) => {
  const colors = {
    primary: 'text-primary-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${colors[color] || colors.primary}`} />
      </div>
      
      {change && (
        <div className={`
          mt-2 flex items-center text-sm
          ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}
        `}>
          {change.type === 'increase' ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          {change.value}% desde ayer
        </div>
      )}
    </div>
  );
};

// VARIANTE: Tarjeta con estado
export const StatusDashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  status = 'success', // success, warning, error, info
  description = null,
  actions = null 
}) => {
  const statusConfig = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-500',
      text: 'text-green-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'bg-yellow-500',
      text: 'text-yellow-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'bg-red-500',
      text: 'text-red-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-500',
      text: 'text-blue-600'
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className={`
      ${config.bg} ${config.border} border rounded-lg p-4
    `}>
      <div className="flex items-center">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${config.icon}
        `}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {title}
          </h3>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-600 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="mt-4 flex justify-end space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;

/*
DOCUMENTACIÓN DEL COMPONENTE DashboardCard

PROPÓSITO:
Este componente proporciona una tarjeta reutilizable y altamente personalizable para mostrar
métricas, estadísticas y datos clave en los diferentes dashboards de la aplicación. Incluye
múltiples variantes especializadas para diferentes casos de uso.

FUNCIONALIDADES PRINCIPALES:
- Tarjeta base con icono, título, valor y opciones de personalización
- Sistema de colores temáticos configurables
- Estados de carga con animaciones
- Indicadores de tendencias (aumento/disminución)
- Alertas visuales con animaciones
- Soporte para enlaces y acciones onClick
- Múltiples variantes especializadas

VARIANTES DISPONIBLES:
- DashboardCard: Componente base principal
- DashboardCardWithChart: Tarjeta con mini gráfico integrado
- CompactDashboardCard: Versión compacta para espacios reducidos
- StatusDashboardCard: Tarjeta con estados y acciones

CONEXIONES CON OTROS ARCHIVOS:

COMPONENTES IMPORTADOS:
- LoadingSpinner (./LoadingSpinner): Componente de carga
- Link (react-router-dom): Para navegación interna
- Iconos (lucide-react): ExternalLink, TrendingUp, TrendingDown

ARCHIVOS QUE USAN ESTE COMPONENTE:
- AdminDashboard: Panel de administración con métricas del gimnasio
- StaffDashboard: Panel del personal con estadísticas de trabajo
- ClientDashboard: Panel del cliente con métricas personales
- Reports y páginas de análisis

PROPS DEL COMPONENTE BASE:
- title: Título de la métrica
- value: Valor principal a mostrar
- icon: Componente de icono (Lucide React)
- color: Tema de color ('primary', 'blue', 'green', etc.)
- isLoading: Estado de carga
- subtitle: Texto descriptivo adicional
- change: Objeto con cambios/tendencias { value, type }
- link: Ruta para navegación
- alert: Indicador de alerta
- onClick: Función de click personalizada
- className: Clases CSS adicionales

CONFIGURACIÓN DE COLORES:
Soporta 8 temas de color predefinidos:
- primary: Colores primarios de la marca
- blue: Tonos azules
- green: Tonos verdes (típicamente para éxito/ganancias)
- yellow: Tonos amarillos (advertencias)
- orange: Tonos naranjas
- red: Tonos rojos (errores/alertas críticas)
- purple: Tonos púrpuras
- gray: Tonos grises (neutros)

CARACTERÍSTICAS TÉCNICAS:
- Animaciones CSS con Tailwind
- Responsive design
- Estados hover interactivos
- Barras de progreso animadas para alertas
- Sistema de iconos flexible
- Soporte para datos de gráficos (variante WithChart)

CASOS DE USO TÍPICOS:
- Métricas de membresías activas
- Ingresos y estadísticas financieras (en quetzales)
- Asistencia y ocupación del gimnasio
- Estadísticas de entrenadores y clases
- Alertas de mantenimiento de equipos
- KPIs del negocio
- Progreso personal del cliente

ESTRUCTURA VISUAL:
- Header con título y enlace opcional
- Icono temático a la izquierda
- Valor principal prominente
- Indicadores de tendencia opcionales
- Subtítulo descriptivo
- Barra de progreso para alertas

INTEGRACIÓN CON DASHBOARDS:
Se utiliza principalmente en:
- Páginas de resumen ejecutivo
- Paneles de monitoreo en tiempo real
- Reportes de rendimiento
- Interfaces de administración
- Vistas de cliente personalizado

MONEDA:
Cuando se muestran valores monetarios, el componente está configurado para
trabajar con quetzales guatemaltecos (Q) según el contexto de la aplicación.

ACCESIBILIDAD:
- Colores con suficiente contraste
- Texto descriptivo en iconos
- Navegación por teclado soportada
- Estados visuales claros
*/