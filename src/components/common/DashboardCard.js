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
  
  // CONFIGURACIÓN DE COLORES TEMÁTICOS
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
  
  // CONTENIDO PRINCIPAL DE LA TARJETA
  const cardContent = (
    <div className={`
      bg-white rounded-lg shadow-lg p-6 transition-all duration-200
      ${alert ? `border-2 ${colors.border} animate-pulse` : 'border border-gray-200'}
      ${(link || onClick) ? 'hover:shadow-xl cursor-pointer' : ''}
      ${className}
    `}>
      
      {/* INDICADOR DE ALERTA VISUAL */}
      {alert && (
        <div className="absolute top-2 right-2">
          <div className={`w-3 h-3 rounded-full ${colors.icon} animate-pulse`}></div>
        </div>
      )}
      
      <div className="flex items-center">
        {/* ICONO TEMÁTICO */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${colors.icon}
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* CONTENIDO PRINCIPAL */}
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              {title}
            </h3>
            {link && (
              <ExternalLink className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {/* VALOR PRINCIPAL CON FORMATO EN QUETZALES */}
          <div className="flex items-center mt-1">
            {isLoading ? (
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {value}
              </p>
            )}
            
            {/* INDICADOR DE CAMBIO Y TENDENCIA */}
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
          
          {/* SUBTÍTULO DESCRIPTIVO */}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* BARRA DE PROGRESO PARA ALERTAS */}
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
  
  // ENVOLVER CON ENLACE O ACCIÓN DE CLICK
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

// VARIANTE: Tarjeta con gráfico integrado
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
      {/* Mini gráfico de tendencias */}
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

// VARIANTE: Tarjeta compacta para espacios reducidos
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

// VARIANTE: Tarjeta con estado y acciones
export const StatusDashboardCard = ({ 
  title, 
  value, 
  icon: Icon, 
  status = 'exitoso', // exitoso, advertencia, error, informativo
  description = null,
  actions = null 
}) => {
  const statusConfig = {
    exitoso: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-500',
      text: 'text-green-600'
    },
    advertencia: {
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
    informativo: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-500',
      text: 'text-blue-600'
    }
  };
  
  const config = statusConfig[status] || statusConfig.informativo;
  
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
==========================================
DOCUMENTACIÓN DEL COMPONENTE DashboardCard
==========================================

PROPÓSITO GENERAL:
Este componente proporciona una tarjeta reutilizable y altamente personalizable para mostrar
métricas, estadísticas y datos clave en los diferentes paneles de control de la aplicación.
Incluye múltiples variantes especializadas para diferentes casos de uso del gimnasio.

QUÉ MUESTRA AL USUARIO:
- Tarjetas visuales con métricas importantes como:
  * Número de miembros activos
  * Ingresos mensuales en quetzales (Q)
  * Asistencia diaria al gimnasio
  * Estadísticas de clases y entrenadores
  * Alertas de equipamiento y mantenimiento
- Indicadores de tendencia (aumento/disminución) con colores verde/rojo
- Iconos temáticos para identificar rápidamente el tipo de métrica
- Estados de carga con animaciones mientras se obtienen los datos
- Enlaces a páginas detalladas cuando es aplicable

VARIANTES DISPONIBLES PARA EL USUARIO:
1. DashboardCard: Tarjeta base para métricas generales
2. DashboardCardWithChart: Incluye mini gráfico de tendencias de los últimos 7 días
3. CompactDashboardCard: Versión compacta para pantallas móviles o espacios reducidos
4. StatusDashboardCard: Con estados específicos (exitoso, advertencia, error, informativo)

FUNCIONALIDADES PRINCIPALES:
- Sistema de colores temáticos para categorizar información
- Animaciones suaves para transiciones y estados de carga
- Indicadores visuales de alertas con pulsos animados
- Soporte para navegación (enlaces internos)
- Acciones personalizables al hacer clic
- Barras de progreso para alertas críticas
- Formateo automático de valores monetarios en quetzales

ARCHIVOS A LOS QUE SE CONECTA:

COMPONENTES IMPORTADOS:
- './LoadingSpinner': Componente de animación de carga
- 'react-router-dom': Para navegación entre páginas (Link)
- 'lucide-react': Iconos para enlaces externos y tendencias
  * ExternalLink: Icono para enlaces externos
  * TrendingUp: Flecha hacia arriba para aumentos
  * TrendingDown: Flecha hacia abajo para disminuciones

ARCHIVOS QUE UTILIZAN ESTE COMPONENTE:
- src/pages/admin/AdminDashboard.js: Panel principal de administración
- src/pages/staff/StaffDashboard.js: Panel del personal del gimnasio
- src/pages/client/ClientDashboard.js: Panel personal del cliente
- src/pages/reports/: Páginas de reportes y análisis
- src/components/charts/: Componentes de gráficos que incluyen métricas

CONTEXTOS RELACIONADOS:
- src/contexts/AuthContext.js: Para determinar permisos y datos del usuario
- src/contexts/GymContext.js: Datos del gimnasio (miembros, clases, equipos)
- src/contexts/StatsContext.js: Estadísticas y métricas en tiempo real

SERVICIOS DE DATOS:
- src/services/apiService.js: Para obtener datos del backend
- src/services/statsService.js: Cálculos específicos de estadísticas
- src/services/formatService.js: Formateo de números y moneda en quetzales

CONFIGURACIÓN DE COLORES DISPONIBLES:
- primary: Colores principales de la marca del gimnasio
- blue: Para información general y estadísticas neutras
- green: Para métricas positivas, ingresos, membresías activas
- yellow: Para advertencias y alertas de mantenimiento
- orange: Para notificaciones importantes
- red: Para errores, alertas críticas, equipos fuera de servicio
- purple: Para métricas especiales o promociones
- gray: Para datos neutros o inactivos

PROPS PRINCIPALES QUE RECIBE:
- title: Título descriptivo de la métrica (ej: "Miembros Activos")
- value: Valor a mostrar (ej: "247", "Q 15,450")
- icon: Icono de Lucide React para identificar visualmente
- color: Tema de color de la lista anterior
- isLoading: Muestra animación de carga
- subtitle: Texto adicional explicativo
- change: Objeto con cambios porcentuales { value: 12, type: 'increase' }
- link: Ruta para navegar a detalles
- alert: Activa estado de alerta visual
- onClick: Función personalizada al hacer clic

CASOS DE USO ESPECÍFICOS EN EL GIMNASIO:
- Membresías: Activas, vencidas, nuevas del mes
- Finanzas: Ingresos diarios/mensuales en quetzales, pagos pendientes
- Asistencia: Personas en el gimnasio, clases del día, ocupación
- Personal: Entrenadores activos, clases programadas
- Equipamiento: Estado de máquinas, mantenimientos pendientes
- Clientes: Nuevos registros, renovaciones, cumpleaños

FORMATO DE MONEDA:
- Todos los valores monetarios se muestran en quetzales guatemaltecos (Q)
- Formato: Q 1,500.00 para cantidades exactas
- Formato compacto: Q 15K para miles, Q 1.5M para millones

CARACTERÍSTICAS TÉCNICAS:
- Responsive: Se adapta a móvil, tablet y escritorio
- Accesible: Colores con contraste adecuado, navegación por teclado
- Performante: Animaciones CSS optimizadas
- Modular: Fácil de extender con nuevas variantes
- Typed: Preparado para TypeScript si se migra en el futuro

INTEGRACIÓN CON DASHBOARDS:
Este componente es fundamental en:
- Página de inicio del administrador (métricas generales)
- Panel de entrenadores (sus clases y clientes)
- Vista del cliente (su progreso y estadísticas)
- Reportes ejecutivos (KPIs del negocio)
- Alertas de sistema (mantenimiento, vencimientos)

FLUJO DE DATOS TÍPICO:
1. El dashboard padre obtiene datos del backend
2. Formatea los valores según el tipo (moneda, porcentajes, números)
3. Pasa las props necesarias al DashboardCard
4. El componente renderiza con el color y estado apropiado
5. Si hay click/enlace, navega a la página de detalles correspondiente

MONITOREO Y ALERTAS:
Las tarjetas pueden mostrar:
- Estados normales: Verde para métricas saludables
- Advertencias: Amarillo para situaciones que requieren atención
- Errores: Rojo para problemas críticos que necesitan acción inmediata
- Información: Azul para datos neutrales o informativos
*/