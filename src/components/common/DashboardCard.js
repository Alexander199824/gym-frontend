// src/components/common/DashboardCard.js
// UBICACIÓN: /gym-frontend/src/components/common/DashboardCard.js
// FUNCIÓN: Componente reutilizable para mostrar métricas en el dashboard
// USADO EN: AdminDashboard, StaffDashboard, ClientDashboard

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
  
  // 🎨 CONFIGURACIÓN DE COLORES
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
  
  // 📊 CONTENIDO DE LA TARJETA
  const cardContent = (
    <div className={`
      bg-white rounded-lg shadow-lg p-6 transition-all duration-200
      ${alert ? `border-2 ${colors.border} animate-pulse` : 'border border-gray-200'}
      ${(link || onClick) ? 'hover:shadow-xl cursor-pointer' : ''}
      ${className}
    `}>
      
      {/* 🔔 INDICADOR DE ALERTA */}
      {alert && (
        <div className="absolute top-2 right-2">
          <div className={`w-3 h-3 rounded-full ${colors.icon} animate-pulse`}></div>
        </div>
      )}
      
      <div className="flex items-center">
        {/* 🎯 ICONO */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${colors.icon}
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* 📊 CONTENIDO */}
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              {title}
            </h3>
            {link && (
              <ExternalLink className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          {/* 🔢 VALOR PRINCIPAL */}
          <div className="flex items-center mt-1">
            {isLoading ? (
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {value}
              </p>
            )}
            
            {/* 📈 CAMBIO/TENDENCIA */}
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
          
          {/* 📝 SUBTÍTULO */}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* 📊 BARRA DE PROGRESO (opcional) */}
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
  
  // 🔗 WRAPPER CON LINK O CLICK
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

// 📊 VARIANTE: Tarjeta con gráfico pequeño
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
      {/* 📈 Mini gráfico */}
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

// 📊 VARIANTE: Tarjeta compacta
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

// 📊 VARIANTE: Tarjeta con estado
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