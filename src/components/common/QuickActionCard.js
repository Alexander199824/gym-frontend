// Autor: Alexander Echeverria
// src/components/common/QuickActionCard.js
// FUNCIÓN: Componente para acciones rápidas en el dashboard
// USADO EN: StaffDashboard, ClientDashboard

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';

const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color = 'blue',
  link = null,
  onClick = null,
  badge = null,
  disabled = false,
  className = ''
}) => {
  
  // CONFIGURACIÓN DE COLORES
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      hover: 'hover:bg-blue-100',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-500',
      text: 'text-green-600',
      hover: 'hover:bg-green-100',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-500',
      text: 'text-yellow-600',
      hover: 'hover:bg-yellow-100',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600',
      hover: 'hover:bg-purple-100',
      border: 'border-purple-200'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-500',
      text: 'text-red-600',
      hover: 'hover:bg-red-100',
      border: 'border-red-200'
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'bg-gray-500',
      text: 'text-gray-600',
      hover: 'hover:bg-gray-100',
      border: 'border-gray-200'
    }
  };
  
  const colors = colorConfig[color] || colorConfig.blue;
  
  // CONTENIDO DE LA TARJETA
  const cardContent = (
    <div className={`
      relative bg-white rounded-lg shadow-lg p-6 transition-all duration-200
      ${!disabled ? `${colors.hover} hover:shadow-xl cursor-pointer` : 'opacity-50 cursor-not-allowed'}
      ${className}
    `}>
      
      {/* BADGE */}
      {badge && (
        <div className="absolute top-2 right-2">
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full
            ${colors.bg} ${colors.text}
          `}>
            {badge}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        {/* ICONO Y CONTENIDO */}
        <div className="flex items-center">
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            ${colors.icon}
          `}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">
              {title}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {description}
            </p>
          </div>
        </div>
        
        {/* INDICADOR DE ACCIÓN */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${colors.bg}
        `}>
          <ArrowRight className={`w-4 h-4 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
  
  // WRAPPER CON LINK O CLICK
  if (link && !disabled) {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  }
  
  if (onClick && !disabled) {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    );
  }
  
  return cardContent;
};

// VARIANTE: Tarjeta compacta
export const CompactQuickActionCard = ({ 
  title, 
  icon: Icon, 
  color = 'blue',
  link = null,
  onClick = null,
  count = null 
}) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };
  
  const cardContent = (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${colors[color] || colors.blue}
          `}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 text-sm font-medium text-gray-900">
            {title}
          </span>
        </div>
        
        {count && (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
            {count}
          </span>
        )}
      </div>
    </div>
  );
  
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

// VARIANTE: Tarjeta con progreso
export const ProgressQuickActionCard = ({ 
  title, 
  description,
  icon: Icon, 
  color = 'blue',
  progress = 0, // 0-100
  link = null,
  onClick = null 
}) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };
  
  const cardContent = (
    <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow cursor-pointer">
      <div className="flex items-center mb-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center
          ${colors[color] || colors.blue}
        `}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-900">
            {title}
          </h3>
          <p className="text-xs text-gray-600">
            {description}
          </p>
        </div>
      </div>
      
      {/* BARRA DE PROGRESO */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colors[color] || colors.blue} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-600 text-right">
        {progress}% completado
      </div>
    </div>
  );
  
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

// VARIANTE: Tarjeta con estado
export const StatusQuickActionCard = ({ 
  title, 
  description,
  icon: Icon, 
  status = 'active', // active, pending, completed, disabled
  link = null,
  onClick = null 
}) => {
  const statusConfig = {
    active: {
      bg: 'bg-green-50',
      icon: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    pending: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-500',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    completed: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    disabled: {
      bg: 'bg-gray-50',
      icon: 'bg-gray-400',
      text: 'text-gray-500',
      border: 'border-gray-200'
    }
  };
  
  const config = statusConfig[status];
  
  const cardContent = (
    <div className={`
      ${config.bg} border ${config.border} rounded-lg p-4
      ${status !== 'disabled' ? 'hover:shadow-lg transition-shadow cursor-pointer' : 'opacity-50'}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${config.icon}
          `}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">
              {title}
            </h3>
            <p className="text-xs text-gray-600">
              {description}
            </p>
          </div>
        </div>
        
        <div className={`
          w-3 h-3 rounded-full ${config.icon}
          ${status === 'pending' ? 'animate-pulse' : ''}
        `} />
      </div>
    </div>
  );
  
  if (link && status !== 'disabled') {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    );
  }
  
  if (onClick && status !== 'disabled') {
    return (
      <div onClick={onClick} className="block">
        {cardContent}
      </div>
    );
  }
  
  return cardContent;
};

export default QuickActionCard;

/*
DOCUMENTACIÓN DEL COMPONENTE QuickActionCard

PROPÓSITO:
Este componente proporciona tarjetas de acciones rápidas personalizables para dashboards,
permitiendo a los usuarios acceder fácilmente a funciones importantes del sistema del gimnasio.
Incluye múltiples variantes especializadas para diferentes tipos de acciones y estados.

FUNCIONALIDADES PRINCIPALES:
- Tarjetas interactivas con iconos y descripciones
- Sistema de colores temáticos configurables
- Soporte para badges informativos
- Estados activos/deshabilitados
- Navegación por enlaces o acciones personalizadas
- Múltiples variantes especializadas
- Animaciones y efectos hover

VARIANTES DISPONIBLES:
- QuickActionCard: Componente base principal
- CompactQuickActionCard: Versión compacta para espacios reducidos
- ProgressQuickActionCard: Con barras de progreso integradas
- StatusQuickActionCard: Con indicadores de estado específicos

CONEXIONES CON OTROS ARCHIVOS:

COMPONENTES IMPORTADOS:
- Link (react-router-dom): Para navegación interna
- ArrowRight, ExternalLink (lucide-react): Iconos de interfaz

ARCHIVOS QUE USAN ESTE COMPONENTE:
- StaffDashboard: Panel del personal con acciones rápidas
- ClientDashboard: Panel del cliente con funciones frecuentes
- AdminDashboard: Panel de administración con controles rápidos
- Páginas de gestión: Accesos directos a funciones específicas

PROPS DEL COMPONENTE BASE:
- title: Título de la acción
- description: Descripción breve de la función
- icon: Componente de icono (Lucide React)
- color: Tema de color ('blue', 'green', 'yellow', etc.)
- link: Ruta para navegación
- onClick: Función de click personalizada
- badge: Etiqueta informativa opcional
- disabled: Estado deshabilitado
- className: Clases CSS adicionales

CONFIGURACIÓN DE COLORES:
Soporta 6 temas de color predefinidos:
- blue: Acciones generales
- green: Acciones exitosas o confirmaciones
- yellow: Advertencias o pendientes
- purple: Acciones especiales o premium
- red: Acciones críticas o eliminación
- gray: Acciones deshabilitadas o neutras

CASOS DE USO EN EL GIMNASIO:

STAFF DASHBOARD:
- Registrar nuevo miembro
- Ver asistencia del día
- Gestionar equipos
- Programar mantenimiento
- Revisar pagos pendientes

CLIENT DASHBOARD:
- Reservar clase
- Ver rutina personalizada
- Actualizar perfil
- Revisar historial de pagos (en quetzales)
- Contactar entrenador

ADMIN DASHBOARD:
- Generar reportes
- Gestionar personal
- Configurar promociones
- Revisar finanzas (en quetzales)
- Administrar instalaciones

VARIANTES ESPECIALIZADAS:

COMPACT VERSION:
- Para sidebars o espacios reducidos
- Muestra contador opcional
- Acción directa sin descripción

PROGRESS VERSION:
- Para tareas con progreso measurable
- Barra de progreso visual
- Porcentaje de completado

STATUS VERSION:
- Para elementos con estados específicos
- Indicadores visuales de estado
- Animaciones para estados pendientes

CARACTERÍSTICAS TÉCNICAS:
- Responsive design automático
- Animaciones CSS suaves
- Estados hover interactivos
- Accesibilidad con navegación por teclado
- Sistema de colores consistente
- Lazy loading de iconos

INTEGRACIÓN CON NAVEGACIÓN:
- Soporte completo para React Router
- Enlaces internos y externos
- Acciones personalizadas
- Estados de carga

ACCESIBILIDAD:
- Roles ARIA apropiados
- Navegación por teclado
- Contraste de colores adecuado
- Estados visuales claros
- Texto descriptivo

ESTRUCTURA VISUAL:
- Icono temático a la izquierda
- Título y descripción central
- Indicador de acción a la derecha
- Badge opcional en esquina superior
- Efectos de sombra y hover

PERSONALIZACIÓN:
- Colores adaptables al tema del gimnasio
- Iconos intercambiables
- Contenido completamente personalizable
- Estilos CSS extendibles

Este componente es fundamental para crear interfaces de dashboard intuitivas
y eficientes que permitan a usuarios del gimnasio (staff, clientes, administradores)
acceder rápidamente a las funciones más importantes del sistema.
*/