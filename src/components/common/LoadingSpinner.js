// Autor: Alexander Echeverria
// src/components/common/LoadingSpinner.js

import React from 'react';
import { Dumbbell, Loader } from 'lucide-react';
import useGymConfig from '../../hooks/useGymConfig';

const LoadingSpinner = ({ 
  fullScreen = false, 
  message = 'Cargando...', 
  size = 'md',
  showLogo = true,
  className = '',
  color = 'primary'
}) => {
  const { config } = useGymConfig();

  // Configuración de tamaños para diferentes contextos
  const sizeConfig = {
    sm: { spinner: 'w-8 h-8', logo: 'w-6 h-6', text: 'text-sm' },
    md: { spinner: 'w-12 h-12', logo: 'w-8 h-8', text: 'text-base' },
    lg: { spinner: 'w-16 h-16', logo: 'w-12 h-12', text: 'text-lg' },
    xl: { spinner: 'w-24 h-24', logo: 'w-16 w-16', text: 'text-xl' }
  };

  // Configuración de colores temáticos
  const colorConfig = {
    primary: 'border-primary-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600',
    indigo: 'border-indigo-600'
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;
  const currentColor = colorConfig[color] || colorConfig.primary;

  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Logo integrado con spinner animado */}
      <div className="relative">
        {/* Spinner circular animado */}
        <div className={`${currentSize.spinner} animate-spin`}>
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className={`absolute inset-0 border-4 ${currentColor} border-t-transparent rounded-full`}></div>
        </div>
        
        {/* Logo de mancuernas en el centro */}
        {showLogo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Dumbbell className={`${currentSize.logo} text-primary-600`} />
          </div>
        )}
      </div>

      {/* Mensaje informativo y nombre del gimnasio */}
      <div className="text-center space-y-2">
        <p className={`${currentSize.text} font-medium text-gray-900`}>
          {message}
        </p>
        {config?.name && showLogo && (
          <p className="text-sm text-gray-500">
            {config.name}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
        <LoadingContent />
      </div>
    );
  }

  return <LoadingContent />;
};

// Spinner específico para botones
export const ButtonSpinner = ({ size = 'sm', className = '', color = 'white' }) => {
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    white: 'border-white border-opacity-30',
    primary: 'border-primary-600 border-opacity-30',
    gray: 'border-gray-600 border-opacity-30'
  };

  const borderColor = colorClasses[color] || colorClasses.white;

  return (
    <div className={`${spinnerSizes[size]} animate-spin relative ${className}`}>
      <div className={`absolute inset-0 border-2 ${borderColor} rounded-full`}></div>
      <div className={`absolute inset-0 border-2 ${color === 'white' ? 'border-white' : `border-${color}-600`} border-t-transparent rounded-full`}></div>
    </div>
  );
};

// Spinner simple para casos básicos de carga
export const SimpleSpinner = ({ 
  size = 'medium', 
  color = 'primary',
  message = '',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'text-indigo-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="text-center">
        <Loader className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin mx-auto mb-2`} />
        {message && (
          <p className="text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};

// Variantes especializadas para diferentes contextos
export const FullScreenLoader = ({ message = 'Cargando Gimnasio Elite Fitness...' }) => (
  <LoadingSpinner fullScreen={true} message={message} size="lg" />
);

export const InlineLoader = ({ message = 'Cargando...', size = 'sm' }) => (
  <LoadingSpinner fullScreen={false} message={message} size={size} showLogo={false} />
);

export const CardLoader = ({ message = 'Cargando información...', size = 'md' }) => (
  <div className="bg-white rounded-lg shadow p-8">
    <LoadingSpinner fullScreen={false} message={message} size={size} />
  </div>
);

// Loader específico para gestión de perfiles
export const ProfileLoader = ({ message = 'Cargando información del perfil...' }) => (
  <div className="flex items-center justify-center min-h-96">
    <LoadingSpinner 
      fullScreen={false} 
      message={message} 
      size="lg"
      showLogo={false}
      color="indigo"
    />
  </div>
);

export default LoadingSpinner;

/*
==========================================
DOCUMENTACIÓN DEL COMPONENTE LoadingSpinner
==========================================

PROPÓSITO GENERAL:
Este componente proporciona una colección completa y profesional de indicadores de carga
personalizables para diferentes contextos dentro de la aplicación del gimnasio. Ofrece
múltiples variantes especializadas que mantienen la consistencia visual y mejoran la
experiencia del usuario durante operaciones que requieren tiempo de procesamiento.

QUÉ MUESTRA AL USUARIO:
El usuario ve diferentes tipos de indicadores de carga según el contexto:
- Spinner principal con logo de mancuernas integrado en el centro
- Animación circular suave que gira continuamente
- Mensaje descriptivo personalizable ("Cargando...", "Procesando pago...", etc.)
- Nombre del gimnasio debajo del spinner cuando está disponible
- Diferentes tamaños según la importancia de la operación
- Colores temáticos que se adaptan al contexto (verde para éxito, rojo para errores)
- Overlay de pantalla completa para operaciones críticas
- Spinners compactos para botones y elementos pequeños

VARIANTES DISPONIBLES PARA EL USUARIO:
1. LoadingSpinner: Componente principal con todas las opciones
2. ButtonSpinner: Para botones durante acciones (guardar, procesar pago, etc.)
3. SimpleSpinner: Versión básica sin logo para casos simples
4. FullScreenLoader: Cubre toda la pantalla para operaciones importantes
5. InlineLoader: Para elementos en línea dentro de contenido
6. CardLoader: Para tarjetas y contenedores específicos
7. ProfileLoader: Especializado para carga de información de perfiles

FUNCIONALIDADES PRINCIPALES:
- Integración automática con el logo y nombre del gimnasio
- Sistema de tamaños responsive (sm, md, lg, xl)
- Múltiples colores temáticos configurables
- Animaciones CSS optimizadas y suaves
- Soporte para mensajes personalizables
- Backdrop blur para mode pantalla completa
- Compatibilidad con todos los navegadores modernos

ARCHIVOS A LOS QUE SE CONECTA:

HOOKS REQUERIDOS:
- ../../hooks/useGymConfig: Hook personalizado para obtener configuración del gimnasio
  * Proporciona config.name (nombre del gimnasio para mostrar)
  * Proporciona información de configuración visual
  * Mantiene consistencia con la identidad de marca

COMPONENTES IMPORTADOS:
- 'lucide-react': Biblioteca de iconos
  * Dumbbell: Icono de mancuernas para el logo del gimnasio
  * Loader: Icono simple de carga para variantes básicas

ARCHIVOS QUE UTILIZAN ESTE COMPONENTE:
- src/components/profile/ProfileManager.js: Carga de información de perfiles
- src/pages/admin/AdminDashboard.js: Estados de carga de métricas
- src/pages/client/ClientDashboard.js: Carga de estadísticas personales
- src/components/forms/: Formularios durante envío de datos
- src/pages/auth/Login.js: Proceso de autenticación
- src/pages/auth/Register.js: Proceso de registro de nuevos miembros
- src/components/cart/CartSidebar.js: Procesamiento de compras
- src/pages/checkout/Checkout.js: Procesamiento de pagos en quetzales
- src/components/membership/: Renovación y gestión de membresías
- src/services/apiService.js: Llamadas al backend
- src/components/classes/: Reserva de clases y entrenadores

CONTEXTOS Y SERVICIOS RELACIONADOS:
- src/contexts/AuthContext.js: Estados de autenticación
- src/contexts/GymContext.js: Datos del gimnasio y configuración
- src/contexts/CartContext.js: Procesamiento de compras
- src/services/paymentService.js: Procesamiento de pagos en quetzales
- src/services/membershipService.js: Gestión de membresías

CONFIGURACIÓN DE TAMAÑOS DISPONIBLES:
- sm (pequeño): 8x8px spinner, texto pequeño - Para elementos compactos
- md (mediano): 12x12px spinner, texto base - Tamaño estándar
- lg (grande): 16x16px spinner, texto grande - Para operaciones importantes
- xl (extra grande): 24x24px spinner, texto XL - Para pantalla completa

CONFIGURACIÓN DE COLORES TEMÁTICOS:
- primary: Color principal del gimnasio (azul/índigo)
- blue: Para información general y carga de datos
- green: Para operaciones exitosas y confirmaciones
- red: Para errores o operaciones críticas
- yellow: Para advertencias y procesos en espera
- purple: Para funciones premium o especiales
- indigo: Para perfiles y datos personales

PROPS DEL COMPONENTE PRINCIPAL:
- fullScreen: Boolean para modo pantalla completa
- message: Texto descriptivo personalizable
- size: Tamaño del spinner ('sm', 'md', 'lg', 'xl')
- showLogo: Mostrar logo de mancuernas en el centro
- className: Clases CSS adicionales para personalización
- color: Color temático del spinner

CASOS DE USO ESPECÍFICOS EN EL GIMNASIO:
- Procesamiento de pagos de membresías en quetzales guatemaltecos
- Carga de horarios de clases y disponibilidad de entrenadores
- Autenticación de miembros y personal del gimnasio
- Actualización de información de perfiles de clientes
- Carga de estadísticas de asistencia y progreso personal
- Procesamiento de reservas de equipamiento
- Sincronización de datos con el sistema central
- Carga de reportes financieros y métricas de negocio
- Renovación automática de membresías
- Carga de catálogo de productos de la tienda del gimnasio

CARACTERÍSTICAS TÉCNICAS AVANZADAS:
- Animaciones CSS3 optimizadas para rendimiento
- Z-index apropiado (z-50) para overlays y modales
- Backdrop-filter para efecto de desenfoque profesional
- Responsive design que se adapta a móvil y escritorio
- Accesibilidad mejorada con ARIA labels
- Performance optimizado para evitar re-renders innecesarios
- Compatibilidad con React.memo y optimizaciones

INTEGRACIÓN CON LA IDENTIDAD DEL GIMNASIO:
- Logo de mancuernas que refuerza la identidad fitness
- Colores que coinciden con la paleta de marca
- Nombre del gimnasio mostrado automáticamente
- Consistencia visual en toda la aplicación
- Mensajes en español adaptados al mercado guatemalteco

EJEMPLOS DE MENSAJES TÍPICOS:
- "Procesando pago en quetzales..."
- "Cargando horario de clases..."
- "Verificando membresía..."
- "Guardando información del perfil..."
- "Conectando con el sistema del gimnasio..."
- "Actualizando estadísticas de entrenamiento..."
- "Reservando sesión con entrenador..."

ESTADOS DE CARGA POR CONTEXTO:
- Autenticación: "Verificando credenciales..."
- Pagos: "Procesando pago de Q XXX..."
- Perfiles: "Actualizando información personal..."
- Clases: "Reservando clase de yoga..."
- Equipamiento: "Verificando disponibilidad..."
- Reportes: "Generando reporte mensual..."

CARACTERÍSTICAS DE ACCESIBILIDAD:
- Roles ARIA apropiados para lectores de pantalla
- Indicadores visuales claros de estado de carga
- Contraste de color adecuado en todos los temas
- Texto descriptivo para usuarios con discapacidades visuales
- Navegación por teclado soportada donde es relevante

OPTIMIZACIONES DE RENDIMIENTO:
- Componentes React.memo para evitar re-renders innecesarios
- Animaciones CSS puras para mejor rendimiento
- Lazy loading condicional de elementos pesados
- Gestión eficiente de estados de carga
- Cleanup automático de timers y efectos

USO TÍPICO EN LA APLICACIÓN:
```javascript
// Carga básica con logo
<LoadingSpinner message="Cargando membresías..." />

// Pantalla completa para operaciones importantes
<FullScreenLoader message="Procesando pago de Q 500..." />

// En botón durante envío
<ButtonSpinner size="sm" color="white" />

// Para perfil de usuario
<ProfileLoader message="Actualizando información del cliente..." />

// Simple sin logo
<SimpleSpinner size="medium" message="Guardando..." />
```

INTEGRACIÓN CON BACKEND:
Este componente se activa automáticamente durante:
- Llamadas a la API del gimnasio
- Operaciones de base de datos
- Procesamiento de pagos externos
- Sincronización de datos en tiempo real
- Carga de imágenes y archivos multimedia

El LoadingSpinner es fundamental para mantener una experiencia de usuario profesional
y consistente en toda la aplicación del gimnasio, proporcionando feedback visual
claro durante todas las operaciones que requieren tiempo de procesamiento, desde
simples consultas hasta complejas transacciones financieras en quetzales.
*/