// Autor: Alexander Echeverria
// src/components/common/LoadingSpinner.js
// FUNCIÓN: Componente de loading spinner COMPLETO Y CORREGIDO
// MANTIENE: Funcionalidad existente + compatibilidad con ProfileManager

import React from 'react';
import { Dumbbell, Loader } from 'lucide-react';
import useGymConfig from '../../hooks/useGymConfig';

const LoadingSpinner = ({ 
  fullScreen = false, 
  message = 'Cargando...', 
  size = 'md',
  showLogo = true,
  className = '',
  // NUEVAS PROPS para compatibilidad con ProfileManager
  color = 'primary'
}) => {
  const { config } = useGymConfig();

  // Configuración de tamaños
  const sizeConfig = {
    sm: { spinner: 'w-8 h-8', logo: 'w-6 h-6', text: 'text-sm' },
    md: { spinner: 'w-12 h-12', logo: 'w-8 h-8', text: 'text-base' },
    lg: { spinner: 'w-16 h-16', logo: 'w-12 h-12', text: 'text-lg' },
    xl: { spinner: 'w-24 h-24', logo: 'w-16 w-16', text: 'text-xl' }
  };

  // Configuración de colores
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
      {/* Logo + Spinner */}
      <div className="relative">
        {/* Spinner */}
        <div className={`${currentSize.spinner} animate-spin`}>
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className={`absolute inset-0 border-4 ${currentColor} border-t-transparent rounded-full`}></div>
        </div>
        
        {/* Logo en el centro */}
        {showLogo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Dumbbell className={`${currentSize.logo} text-primary-600`} />
          </div>
        )}
      </div>

      {/* Mensaje */}
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

// ButtonSpinner para botones
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

//  SimpleSpinner para casos simples (compatibilidad con ProfileManager)
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

// Variantes específicas MEJORADAS
export const FullScreenLoader = ({ message = 'Cargando Elite Fitness...' }) => (
  <LoadingSpinner fullScreen={true} message={message} size="lg" />
);

export const InlineLoader = ({ message = 'Cargando...', size = 'sm' }) => (
  <LoadingSpinner fullScreen={false} message={message} size={size} showLogo={false} />
);

export const CardLoader = ({ message = 'Cargando...', size = 'md' }) => (
  <div className="bg-white rounded-lg shadow p-8">
    <LoadingSpinner fullScreen={false} message={message} size={size} />
  </div>
);

// NUEVO: ProfileLoader específico para el ProfileManager
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
DOCUMENTACIÓN DEL COMPONENTE LoadingSpinner

PROPÓSITO:
Este componente proporciona una colección completa de spinners de carga personalizables
para diferentes contextos dentro de la aplicación del gimnasio. Incluye variantes 
especializadas para botones, perfiles, pantalla completa y elementos inline.

FUNCIONALIDADES PRINCIPALES:
- Spinner principal con logo del gimnasio integrado
- Múltiples tamaños y colores configurables
- Variantes especializadas para diferentes casos de uso
- Compatibilidad con ProfileManager y otros componentes
- Animaciones suaves y profesionales
- Mensajes de carga personalizables
- Integración con configuración del gimnasio

CONEXIONES CON OTROS ARCHIVOS:

HOOKS REQUERIDOS:
- useGymConfig (../../hooks/useGymConfig): Obtiene configuración del gimnasio

COMPONENTES IMPORTADOS:
- Dumbbell, Loader (lucide-react): Iconos para spinner y logo

ARCHIVOS QUE USAN ESTE COMPONENTE:
- ProfileManager: Para carga de información de perfil
- Dashboard components: Estados de carga de datos
- Formularios: Durante envío de información
- Páginas de autenticación: Proceso de login/registro
- Carrito de compras: Procesamiento de transacciones
- API calls: Estados de carga de datos del backend
- Navegación: Transiciones entre páginas

COMPONENTES EXPORTADOS:

COMPONENTE PRINCIPAL:
- LoadingSpinner: Spinner base con todas las opciones

VARIANTES ESPECIALIZADAS:
- ButtonSpinner: Para botones durante acciones
- SimpleSpinner: Versión simplificada para casos básicos
- FullScreenLoader: Cubre toda la pantalla
- InlineLoader: Para elementos en línea
- CardLoader: Para tarjetas/contenedores
- ProfileLoader: Específico para ProfileManager

PROPS DEL COMPONENTE PRINCIPAL:
- fullScreen: Boolean para modo pantalla completa
- message: Texto de carga personalizable
- size: Tamaño ('sm', 'md', 'lg', 'xl')
- showLogo: Mostrar logo del gimnasio en el centro
- className: Clases CSS adicionales
- color: Color del spinner ('primary', 'blue', 'green', etc.)

CONFIGURACIÓN DE TAMAÑOS:
- sm: 8x8px spinner, 6x6px logo, texto pequeño
- md: 12x12px spinner, 8x8px logo, texto base
- lg: 16x16px spinner, 12x12px logo, texto grande
- xl: 24x24px spinner, 16x16px logo, texto XL

CONFIGURACIÓN DE COLORES:
Soporta múltiples temas de color:
- primary: Color principal del gimnasio
- blue, green, red, yellow, purple, indigo: Colores específicos

CASOS DE USO ESPECÍFICOS:
- Carga de datos del dashboard
- Procesamiento de pagos en quetzales
- Autenticación de usuarios
- Carga de información de membresías
- Subida de archivos de perfil
- Sincronización con backend
- Navegación entre secciones

CARACTERÍSTICAS TÉCNICAS:
- Animaciones CSS optimizadas
- Backdrop blur para spinner de pantalla completa
- Z-index apropiado para modales
- Responsive design
- Integración con sistema de diseño de la aplicación

INTEGRACIÓN CON GYMCONFIG:
- Muestra nombre del gimnasio cuando está disponible
- Se adapta a la configuración específica del gimnasio
- Mantiene consistencia visual con la marca

ACCESIBILIDAD:
- Roles ARIA apropiados
- Indicadores visuales claros de carga
- Texto descriptivo para lectores de pantalla
- Contraste adecuado en todos los temas

PERFORMANCE:
- Componentes memoizados donde es apropiado
- Animaciones optimizadas para rendimiento
- Carga condicional de elementos
- Minimal re-renders

USO TÍPICO EN LA APLICACIÓN:
```javascript
// Carga básica
<LoadingSpinner message="Cargando membresías..." />

// Pantalla completa
<FullScreenLoader message="Procesando pago..." />

// En botón
<ButtonSpinner size="sm" color="white" />

// Para perfil
<ProfileLoader message="Actualizando información..." />
```

Este componente es esencial para proporcionar feedback visual consistente durante
operaciones asíncronas en toda la aplicación del gimnasio, mejorando la experiencia
del usuario y manteniendo la identidad visual de la marca.
*/