// Autor: Alexander Echeverria
// src/components/common/ConnectionIndicator.js

import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/apiService';

const ConnectionIndicator = ({ show = true }) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showDetails, setShowDetails] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [endpointsStatus, setEndpointsStatus] = useState({});
  const [testimonialsError, setTestimonialsError] = useState(null);
  
  // Referencias para evitar memory leaks
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Lista de endpoints críticos para verificar
  const criticalEndpoints = [
    { name: 'config', url: '/gym/config', critical: true },
    { name: 'stats', url: '/gym/stats', critical: false },
    { name: 'services', url: '/gym/services', critical: false },
    { name: 'testimonials', url: '/gym/testimonials', critical: false },
    { name: 'products', url: '/store/featured-products', critical: false },
    { name: 'plans', url: '/gym/membership-plans', critical: false }
  ];

  // Verificar conexión con diagnóstico completo
  useEffect(() => {
    if (!show) return;

    // Verificación inicial
    checkAllEndpoints();

    // Verificar cada 60 segundos
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        checkAllEndpoints();
      }
    }, 60000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [show]);

  // Función para verificar todos los endpoints
  const checkAllEndpoints = async () => {
    if (!isMountedRef.current) return;
    
    setConnectionStatus('checking');
    const results = {};
    let hasErrors = false;
    let hasCriticalErrors = false;
    
    console.group('Verificación Completa del Backend');
    console.log('Verificando todos los endpoints...');
    
    for (const endpoint of criticalEndpoints) {
      try {
        const startTime = Date.now();
        const response = await apiService.get(endpoint.url);
        const responseTime = Date.now() - startTime;
        
        results[endpoint.name] = {
          status: 'success',
          responseTime,
          hasData: !!(response.data && (Array.isArray(response.data) ? response.data.length > 0 : Object.keys(response.data).length > 0))
        };
        
        console.log(`EXITOSO ${endpoint.name}: ${responseTime}ms`);
        
      } catch (error) {
        hasErrors = true;
        if (endpoint.critical) hasCriticalErrors = true;
        
        results[endpoint.name] = {
          status: 'error',
          error: error.response?.status || error.code || 'Desconocido',
          message: error.message,
          details: getErrorDetails(endpoint.name, error)
        };
        
        // Diagnóstico específico para testimonials
        if (endpoint.name === 'testimonials') {
          setTestimonialsError({
            status: error.response?.status,
            message: error.message,
            details: getTestimonialsErrorDetails(error),
            solution: getTestimonialsSolution(error)
          });
        }
        
        console.log(`ERROR ${endpoint.name}: ${error.response?.status || 'Conexión fallida'}`);
      }
    }
    
    setEndpointsStatus(results);
    setLastCheck(new Date());
    
    // Determinar estado general
    if (hasCriticalErrors) {
      setConnectionStatus('critical_error');
    } else if (hasErrors) {
      setConnectionStatus('partial_error');
    } else {
      setConnectionStatus('connected');
    }
    
    console.log('Estado final:', {
      errores_criticos: hasCriticalErrors,
      tiene_errores: hasErrors,
      total_endpoints: criticalEndpoints.length,
      endpoints_funcionando: Object.values(results).filter(r => r.status === 'success').length
    });
    console.groupEnd();
  };

  // Función para obtener detalles específicos del error
  const getErrorDetails = (endpointName, error) => {
    const status = error.response?.status;
    
    switch (status) {
      case 404:
        return `Endpoint ${endpointName} no implementado en backend`;
      case 500:
        return `Error interno del servidor en ${endpointName}`;
      case 403:
        return `Sin permisos para acceder a ${endpointName}`;
      case 422:
        return `Datos inválidos enviados a ${endpointName}`;
      default:
        return error.code === 'ERR_NETWORK' ? 'Backend no disponible' : 'Error desconocido';
    }
  };

  // Función específica para diagnosticar error de testimonials
  const getTestimonialsErrorDetails = (error) => {
    const status = error.response?.status;
    
    if (status === 500) {
      return {
        problem: 'Error interno en el backend',
        likely_cause: 'Campo created_at o updated_at es undefined',
        location: 'gymController.js línea aproximadamente 186',
        technical: 'TypeError: No se puede leer propiedades de undefined (leyendo toISOString)'
      };
    }
    
    if (status === 404) {
      return {
        problem: 'Endpoint no encontrado',
        likely_cause: 'Ruta /api/gym/testimonials no implementada',
        location: 'Enrutamiento del Backend',
        technical: 'Manejador de ruta faltante'
      };
    }
    
    return {
      problem: 'Error de conexión',
      likely_cause: 'Backend no está ejecutándose',
      location: 'Nivel de red',
      technical: error.message
    };
  };

  // Función para obtener solución específica de testimonials
  const getTestimonialsSolution = (error) => {
    const status = error.response?.status;
    
    if (status === 500) {
      return {
        immediate: 'Agregar validación en gymController.js línea 186',
        code: 'testimonial.created_at ? testimonial.created_at.toISOString() : new Date().toISOString()',
        verification: 'curl -X GET http://localhost:5000/api/gym/testimonials'
      };
    }
    
    if (status === 404) {
      return {
        immediate: 'Implementar ruta /api/gym/testimonials en backend',
        code: 'router.get("/gym/testimonials", gymController.getTestimonials)',
        verification: 'Verificar que el controlador existe'
      };
    }
    
    return {
      immediate: 'Iniciar el servidor backend',
      code: 'npm run dev o npm start en el directorio del backend',
      verification: 'curl -X GET http://localhost:5000/api/health'
    };
  };

  // Obtener configuración del indicador según el estado
  const getIndicatorConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'bg-green-500',
          title: 'Todos los endpoints funcionando correctamente',
          pulse: false
        };
        
      case 'partial_error':
        return {
          color: 'bg-yellow-500',
          title: 'Algunos endpoints con errores (no críticos)',
          pulse: true
        };
        
      case 'critical_error':
        return {
          color: 'bg-red-500',
          title: 'Error crítico - Backend no disponible',
          pulse: true
        };
        
      case 'checking':
      default:
        return {
          color: 'bg-blue-500',
          title: 'Verificando conexión...',
          pulse: true
        };
    }
  };

  const config = getIndicatorConfig();

  // Solo mostrar si está configurado para mostrarse
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* PUNTO INDICADOR MINIMALISTA */}
      <div
        className="relative cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
        title={config.title}
      >
        <div className={`w-3 h-3 rounded-full ${config.color} transition-all duration-300 ${
          config.pulse ? 'animate-pulse' : ''
        } hover:scale-125`} />
      </div>

      {/* PANEL DE DETALLES MEJORADO */}
      {showDetails && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          
          {/* Panel expandido */}
          <div className="absolute bottom-6 right-0 w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 max-h-96 overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${config.color} mr-2`} />
                <span className="text-sm font-medium text-gray-900">
                  Estado del Backend
                </span>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                X
              </button>
            </div>

            {/* Estado general */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium ${
                    connectionStatus === 'connected' ? 'text-green-600' :
                    connectionStatus === 'partial_error' ? 'text-yellow-600' :
                    connectionStatus === 'critical_error' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {connectionStatus === 'connected' ? 'Conectado' :
                     connectionStatus === 'partial_error' ? 'Parcialmente funcional' :
                     connectionStatus === 'critical_error' ? 'Error crítico' : 'Verificando...'}
                  </span>
                </div>
                
                {lastCheck && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última verificación:</span>
                    <span className="text-gray-700">
                      {lastCheck.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de endpoints */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Endpoints del Backend:
              </h4>
              
              {criticalEndpoints.map(endpoint => {
                const status = endpointsStatus[endpoint.name];
                
                return (
                  <div key={endpoint.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        status?.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-xs font-medium capitalize">
                        {endpoint.name}
                        {endpoint.critical && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {status?.status === 'success' ? (
                        <span className="text-green-600">
                          {status.responseTime}ms {status.hasData ? 'CON DATOS' : 'SIN DATOS'}
                        </span>
                      ) : (
                        <span className="text-red-600">
                          {status?.error || 'Error'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Diagnóstico específico de testimonials */}
            {testimonialsError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-xs font-semibold text-red-700 mb-2">
                  Diagnóstico: Error en Testimonios
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-red-600">Problema:</span>
                    <div className="text-red-700 ml-2">
                      {testimonialsError.details?.problem}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-red-600">Causa probable:</span>
                    <div className="text-red-700 ml-2">
                      {testimonialsError.details?.likely_cause}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-red-600">Ubicación:</span>
                    <div className="text-red-700 ml-2 font-mono">
                      {testimonialsError.details?.location}
                    </div>
                  </div>
                  
                  {testimonialsError.solution && (
                    <div>
                      <span className="font-medium text-green-600">Solución:</span>
                      <div className="text-green-700 ml-2">
                        {testimonialsError.solution.immediate}
                      </div>
                      <div className="text-green-600 ml-2 font-mono text-xs mt-1 p-1 bg-green-100 rounded">
                        {testimonialsError.solution.code}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información técnica */}
            <div className="text-xs text-gray-500 space-y-1">
              <div>URL del Backend: {process.env.REACT_APP_API_URL || 'localhost:5000'}</div>
              <div>* = Endpoint crítico</div>
              <div>CON DATOS = Contiene información, SIN DATOS = Vacío</div>
            </div>

            {/* Acciones */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={checkAllEndpoints}
                disabled={connectionStatus === 'checking'}
                className="w-full text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {connectionStatus === 'checking' ? 'Verificando...' : 'Verificar Nuevamente'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionIndicator;

/*
==========================================
DOCUMENTACIÓN DEL COMPONENTE ConnectionIndicator
==========================================

PROPÓSITO GENERAL:
Este componente implementa un indicador visual del estado de conexión con el backend del sistema,
proporcionando diagnóstico detallado de endpoints y detección específica de errores comunes.
Está diseñado para facilitar el debugging durante el desarrollo y monitoreo en producción.

QUÉ MUESTRA AL USUARIO:
- Punto indicador minimalista en la esquina inferior derecha con colores de estado:
  * Verde: Todos los endpoints funcionando correctamente
  * Amarillo: Algunos endpoints con errores no críticos  
  * Rojo: Error crítico, backend no disponible
  * Azul: Verificando conexión
- Panel expandible al hacer clic que muestra:
  * Estado general del backend
  * Lista detallada de cada endpoint con tiempos de respuesta
  * Diagnóstico específico de errores con soluciones sugeridas
  * Información técnica para debugging
  * Botón para verificar nuevamente la conexión

FUNCIONALIDADES PRINCIPALES:
- Verificación automática de múltiples endpoints del backend cada 60 segundos
- Diagnóstico específico para errores comunes en testimonios
- Sistema de logging detallado en consola del navegador
- Detección de endpoints críticos vs no críticos
- Prevención de memory leaks con referencias y cleanup apropiado
- Interfaz responsive y accesible

ARCHIVOS A LOS QUE SE CONECTA:

SERVICIOS REQUERIDOS:
- ../../services/apiService: Servicio HTTP principal para comunicación con el backend
  Debe exportar métodos como apiService.get() para realizar peticiones HTTP

ENDPOINTS DEL BACKEND MONITOREADOS:
- /gym/config: Configuración general del gimnasio (CRÍTICO)
- /gym/stats: Estadísticas y métricas del gimnasio  
- /gym/services: Servicios ofrecidos por el gimnasio
- /gym/testimonials: Testimonios y reseñas de clientes
- /store/featured-products: Productos destacados de la tienda
- /gym/membership-plans: Planes de membresía disponibles

VARIABLES DE ENTORNO UTILIZADAS:
- REACT_APP_API_URL: URL base del servidor backend (ej: http://localhost:5000)

ARCHIVOS DEL BACKEND RELACIONADOS:
- gymController.js: Controlador que maneja las rutas del gimnasio
- Rutas de la API REST que deben estar implementadas en el backend
- Servidor backend que debe estar ejecutándose en el puerto configurado

TECNOLOGÍAS Y DEPENDENCIAS:
- React con Hooks (useState, useEffect, useRef)
- Tailwind CSS para estilos
- JavaScript ES6+ con async/await

USO RECOMENDADO EN LA APLICACIÓN:
```javascript
// En el layout principal o App.js
import ConnectionIndicator from './components/common/ConnectionIndicator';

// Mostrar solo en desarrollo
{process.env.NODE_ENV === 'development' && <ConnectionIndicator />}

// O mostrar siempre pero controlado
<ConnectionIndicator show={mostrarIndicador} />
```

TIPOS DE ERRORES DETECTADOS Y DIAGNOSTICADOS:
- 404: Endpoint no implementado en el backend
- 500: Error interno del servidor (común en testimonials por campos undefined)
- 403: Sin permisos de acceso al endpoint
- 422: Datos inválidos enviados al servidor
- ERR_NETWORK: Backend no disponible o no ejecutándose

BENEFICIOS PARA DESARROLLO Y PRODUCCIÓN:
- Identificación inmediata de problemas de conectividad
- Diagnóstico automático con soluciones específicas para errores comunes
- Monitoreo continuo sin interrumpir el flujo de trabajo del usuario
- Información técnica detallada para debugging eficiente
- Prevención de errores silenciosos que afecten la experiencia del usuario
- Facilita la comunicación entre frontend y backend durante desarrollo

NOTAS TÉCNICAS IMPORTANTES:
- Utiliza intervalos de 60 segundos para verificación automática
- Implementa cleanup adecuado para prevenir memory leaks
- Solo se renderiza si la prop 'show' es true
- Registra información detallada en la consola del navegador para debugging
- Maneja estados de loading, success y error de manera robusta
*/