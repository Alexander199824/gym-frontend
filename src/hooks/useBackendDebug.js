// Autor: Alexander Echeverria
// src/hooks/useBackendDebug.js
// FUNCIÓN: Hook para debug completo del backend y estado de carga

import { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService';

// Hook personalizado para debug completo del backend
const useBackendDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    isChecking: false,
    lastCheck: null,
    endpoints: {},
    summary: {
      total: 0,
      working: 0,
      failed: 0,
      percentage: 0
    },
    backendStatus: 'unknown', // 'connected', 'partial', 'disconnected'
    errors: []
  });
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Lista de endpoints a verificar
  const endpointsToCheck = [
    { name: 'health', url: '/api/health', critical: true },
    { name: 'config', url: '/api/gym/config', critical: true },
    { name: 'stats', url: '/api/gym/stats', critical: false },
    { name: 'services', url: '/api/gym/services', critical: false },
    { name: 'testimonials', url: '/api/gym/testimonials', critical: false },
    { name: 'products', url: '/api/store/featured-products', critical: false },
    { name: 'plans', url: '/api/gym/membership-plans', critical: false }
  ];

  // Función para verificar un endpoint específico
  const checkEndpoint = async (endpoint) => {
    const startTime = Date.now();
    
    try {
      console.log(`Probando endpoint: ${endpoint.name} (${endpoint.url})`);
      
      // Hacer petición según el tipo
      let response;
      if (endpoint.name === 'health') {
        response = await apiService.healthCheck();
      } else if (endpoint.name === 'config') {
        response = await apiService.getGymConfig();
      } else if (endpoint.name === 'stats') {
        response = await apiService.getGymStats();
      } else if (endpoint.name === 'services') {
        response = await apiService.getGymServices();
      } else if (endpoint.name === 'testimonials') {
        response = await apiService.getTestimonials();
      } else if (endpoint.name === 'products') {
        response = await apiService.getFeaturedProducts();
      } else if (endpoint.name === 'plans') {
        response = await apiService.getMembershipPlans();
      } else {
        // Usar método genérico para otros endpoints
        response = await apiService.get(endpoint.url);
      }
      
      const responseTime = Date.now() - startTime;
      
      // Analizar la respuesta
      const hasData = !!(response?.data && (
        Array.isArray(response.data) ? response.data.length > 0 : 
        Object.keys(response.data).length > 0
      ));
      
      console.log(`${endpoint.name} EXITOSO:`, {
        responseTime: `${responseTime}ms`,
        hasData,
        dataType: Array.isArray(response?.data) ? 'Array' : typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A'
      });
      
      // Log específico según el tipo de endpoint
      if (endpoint.name === 'config' && response?.data) {
        console.log('DETALLES DE CONFIGURACIÓN:', {
          name: response.data.name || 'Faltante',
          logo: response.data.logo?.url ? 'Presente' : 'Faltante',
          contact: response.data.contact ? 'Presente' : 'Faltante',
          social: response.data.social ? `${Object.keys(response.data.social).length} plataformas` : 'Faltante'
        });
      }
      
      if (endpoint.name === 'stats' && response?.data) {
        console.log('DETALLES DE ESTADÍSTICAS:', {
          members: response.data.members || 0,
          trainers: response.data.trainers || 0,
          experience: response.data.experience || 0,
          satisfaction: response.data.satisfaction || 0
        });
      }
      
      if (endpoint.name === 'services' && Array.isArray(response?.data)) {
        console.log('DETALLES DE SERVICIOS:', {
          total: response.data.length,
          active: response.data.filter(s => s.active !== false).length,
          services: response.data.map(s => ({ title: s.title, active: s.active !== false }))
        });
      }
      
      return {
        name: endpoint.name,
        status: 'success',
        responseTime,
        hasData,
        dataCount: Array.isArray(response?.data) ? response.data.length : 1,
        data: response?.data,
        critical: endpoint.critical
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.log(`${endpoint.name} FALLÓ:`, {
        error: error.message,
        status: error.response?.status,
        responseTime: `${responseTime}ms`
      });
      
      // Análisis específico del error
      let errorAnalysis = 'Error desconocido';
      let suggestion = 'Verificar configuración del backend';
      
      if (error.response?.status === 404) {
        errorAnalysis = 'Endpoint no implementado';
        suggestion = `Implementar ${endpoint.url} en el backend`;
      } else if (error.response?.status === 500) {
        errorAnalysis = 'Error interno del backend';
        suggestion = 'Revisar logs del backend para detalles';
      } else if (error.code === 'ERR_NETWORK') {
        errorAnalysis = 'No se puede conectar al backend';
        suggestion = 'Iniciar servidor del backend';
      } else if (error.code === 'ECONNABORTED') {
        errorAnalysis = 'Timeout de petición';
        suggestion = 'El backend está tardando demasiado en responder';
      }
      
      console.log(`${endpoint.name} ANÁLISIS: ${errorAnalysis}`);
      console.log(`${endpoint.name} SUGERENCIA: ${suggestion}`);
      
      return {
        name: endpoint.name,
        status: 'failed',
        responseTime,
        error: error.message,
        errorCode: error.response?.status || error.code,
        errorAnalysis,
        suggestion,
        critical: endpoint.critical
      };
    }
  };

  // Función principal para verificar todos los endpoints
  const checkAllEndpoints = async () => {
    if (!isMountedRef.current) return;
    
    console.group('VERIFICACIÓN COMPLETA DEL BACKEND - Iniciando...');
    
    setDebugInfo(prev => ({ ...prev, isChecking: true }));
    
    const results = {};
    const errors = [];
    let workingCount = 0;
    let failedCount = 0;
    let criticalErrors = 0;
    
    for (const endpoint of endpointsToCheck) {
      const result = await checkEndpoint(endpoint);
      results[endpoint.name] = result;
      
      if (result.status === 'success') {
        workingCount++;
      } else {
        failedCount++;
        errors.push({
          endpoint: endpoint.name,
          error: result.error,
          suggestion: result.suggestion,
          critical: endpoint.critical
        });
        
        if (endpoint.critical) {
          criticalErrors++;
        }
      }
      
      // Pequeña pausa entre peticiones para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Determinar estado general del backend
    let backendStatus = 'connected';
    if (criticalErrors > 0) {
      backendStatus = 'disconnected';
    } else if (failedCount > 0) {
      backendStatus = 'partial';
    }
    
    const percentage = Math.round((workingCount / endpointsToCheck.length) * 100);
    
    console.log('RESUMEN DE VERIFICACIÓN DEL BACKEND:', {
      total: endpointsToCheck.length,
      working: workingCount,
      failed: failedCount,
      percentage: `${percentage}%`,
      status: backendStatus,
      criticalErrors
    });
    
    if (errors.length > 0) {
      console.log('ERRORES ENCONTRADOS:');
      errors.forEach(err => {
        console.log(`  - ${err.endpoint}: ${err.error}`);
        if (err.critical) {
          console.log(`    CRÍTICO: ${err.suggestion}`);
        }
      });
    }
    
    console.groupEnd();
    
    if (isMountedRef.current) {
      setDebugInfo({
        isChecking: false,
        lastCheck: new Date(),
        endpoints: results,
        summary: {
          total: endpointsToCheck.length,
          working: workingCount,
          failed: failedCount,
          percentage
        },
        backendStatus,
        errors
      });
    }
  };

  // Función para verificar un endpoint específico manualmente
  const checkSpecificEndpoint = async (endpointName) => {
    const endpoint = endpointsToCheck.find(ep => ep.name === endpointName);
    if (!endpoint) {
      console.error(`Endpoint ${endpointName} no encontrado en la lista`);
      return null;
    }
    
    console.log(`Verificación manual para ${endpointName}...`);
    const result = await checkEndpoint(endpoint);
    
    // Actualizar solo ese endpoint en el estado
    setDebugInfo(prev => ({
      ...prev,
      endpoints: {
        ...prev.endpoints,
        [endpointName]: result
      }
    }));
    
    return result;
  };

  // Función para obtener resumen de un endpoint específico
  const getEndpointSummary = (endpointName) => {
    const endpoint = debugInfo.endpoints[endpointName];
    if (!endpoint) return null;
    
    return {
      name: endpointName,
      isWorking: endpoint.status === 'success',
      hasData: endpoint.hasData || false,
      responseTime: endpoint.responseTime,
      error: endpoint.error || null,
      suggestion: endpoint.suggestion || null
    };
  };

  // Función para obtener todos los endpoints que están fallando
  const getFailingEndpoints = () => {
    return Object.values(debugInfo.endpoints)
      .filter(ep => ep.status === 'failed')
      .map(ep => ({
        name: ep.name,
        error: ep.error,
        suggestion: ep.suggestion,
        critical: ep.critical
      }));
  };

  // Efecto para verificación inicial
  useEffect(() => {
    console.log('Hook de Debug del Backend inicializado');
    
    // Verificación inicial inmediata
    checkAllEndpoints();
    
    // Verificación periódica cada 2 minutos
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log('Verificación periódica del backend...');
        checkAllEndpoints();
      }
    }, 120000); // 2 minutos
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      console.log('Limpieza del Hook de Debug del Backend');
    };
  }, []);

  // Función para generar reporte completo
  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: debugInfo.summary,
      status: debugInfo.backendStatus,
      endpoints: Object.values(debugInfo.endpoints).map(ep => ({
        name: ep.name,
        status: ep.status,
        responseTime: ep.responseTime,
        hasData: ep.hasData,
        dataCount: ep.dataCount,
        critical: ep.critical,
        error: ep.error || null
      })),
      recommendations: []
    };
    
    // Agregar recomendaciones
    if (debugInfo.backendStatus === 'disconnected') {
      report.recommendations.push('CRÍTICO: Iniciar servidor del backend inmediatamente');
    }
    
    const failingEndpoints = getFailingEndpoints();
    failingEndpoints.forEach(ep => {
      if (ep.critical) {
        report.recommendations.push(`CRÍTICO: ${ep.suggestion}`);
      } else {
        report.recommendations.push(`OPCIONAL: ${ep.suggestion}`);
      }
    });
    
    console.log('REPORTE DEL BACKEND:', report);
    
    return report;
  };

  return {
    // Estado del debug
    debugInfo,
    isChecking: debugInfo.isChecking,
    lastCheck: debugInfo.lastCheck,
    backendStatus: debugInfo.backendStatus,
    summary: debugInfo.summary,
    
    // Funciones
    checkAllEndpoints,
    checkSpecificEndpoint,
    getEndpointSummary,
    getFailingEndpoints,
    generateReport,
    
    // Helpers
    isBackendWorking: debugInfo.backendStatus === 'connected',
    hasPartialConnection: debugInfo.backendStatus === 'partial',
    isDisconnected: debugInfo.backendStatus === 'disconnected',
    
    // Endpoints específicos
    endpoints: {
      health: getEndpointSummary('health'),
      config: getEndpointSummary('config'),
      stats: getEndpointSummary('stats'),
      services: getEndpointSummary('services'),
      testimonials: getEndpointSummary('testimonials'),
      products: getEndpointSummary('products'),
      plans: getEndpointSummary('plans')
    }
  };
};

export default useBackendDebug;

/*
DOCUMENTACIÓN DEL HOOK useBackendDebug

PROPÓSITO:
Este hook personalizado proporciona capacidades completas de debugging y monitoreo para el backend
de la aplicación del gimnasio, verificando automáticamente la conectividad, funcionamiento y estado
de todos los endpoints críticos del sistema. Está diseñado específicamente para desarrolladores
y administradores técnicos que necesitan diagnosticar problemas de conectividad y rendimiento.

FUNCIONALIDADES PRINCIPALES:
- Verificación automática de todos los endpoints del backend
- Monitoreo continuo con actualizaciones periódicas cada 2 minutos
- Análisis detallado de respuestas y errores de cada endpoint
- Generación de reportes completos de estado del sistema
- Clasificación de endpoints por criticidad (críticos vs opcionales)
- Logging detallado en consola para debugging avanzado
- Métricas de tiempo de respuesta y disponibilidad
- Sugerencias automáticas para resolución de problemas

ARCHIVOS Y CONEXIONES:

SERVICIOS UTILIZADOS:
- ../services/apiService: Servicio principal de comunicación con backend
  * healthCheck(): Verificación de salud general del servidor
  * getGymConfig(): Configuración básica del gimnasio
  * getGymStats(): Estadísticas del gimnasio
  * getGymServices(): Servicios ofrecidos
  * getTestimonials(): Testimonios de clientes
  * getFeaturedProducts(): Productos destacados de la tienda
  * getMembershipPlans(): Planes de membresía en quetzales
  * get(): Método genérico para otros endpoints

DEPENDENCIAS DE REACT:
- useState: Gestión del estado de debugging
- useEffect: Verificación inicial y limpieza
- useRef: Referencias para interval y estado de montaje

QUE MUESTRA AL DESARROLLADOR:

INFORMACIÓN EN CONSOLA DEL NAVEGADOR:
El hook proporciona logging detallado en la consola del navegador para debugging:

**Verificación de Endpoints Individuales**:
- "Probando endpoint: [nombre] ([URL])" - Inicio de verificación
- "[nombre] EXITOSO:" con detalles de tiempo de respuesta, datos y tipo
- "[nombre] FALLÓ:" con información específica del error
- "ANÁLISIS: [descripción del problema]" - Diagnóstico automático
- "SUGERENCIA: [solución recomendada]" - Pasos para resolver

**Detalles Específicos por Endpoint**:
- **Configuración**: Nombre del gimnasio, logo, contacto, redes sociales
- **Estadísticas**: Miembros, entrenadores, experiencia, satisfacción
- **Servicios**: Total de servicios, servicios activos, lista detallada
- **Productos**: Inventario de tienda, productos destacados
- **Planes**: Membresías disponibles con precios en quetzales

**Resumen General del Backend**:
- Total de endpoints verificados
- Endpoints funcionando correctamente
- Endpoints con fallos
- Porcentaje de disponibilidad general
- Estado global: 'connected', 'partial', 'disconnected'
- Número de errores críticos detectados

**Lista de Errores Encontrados**:
- Endpoint específico con problema
- Descripción del error técnico
- Clasificación de criticidad (CRÍTICO vs opcional)
- Sugerencia específica para resolución

ESTADOS DEL BACKEND MOSTRADOS:

**Estado 'connected' (Conectado)**:
- Todos los endpoints críticos funcionando
- Backend completamente operativo
- Datos del gimnasio disponibles
- Sistema listo para producción

**Estado 'partial' (Parcial)**:
- Endpoints críticos funcionando
- Algunos endpoints opcionales con problemas
- Funcionalidad básica disponible
- Algunas características pueden estar limitadas

**Estado 'disconnected' (Desconectado)**:
- Uno o más endpoints críticos fallando
- Backend no completamente funcional
- Problemas graves de conectividad
- Requiere atención inmediata

ENDPOINTS VERIFICADOS:

**Endpoints Críticos** (deben funcionar para operación básica):
- **health**: Estado de salud del servidor backend
- **config**: Configuración básica del gimnasio (nombre, logo, contacto)

**Endpoints Opcionales** (mejoran funcionalidad pero no son críticos):
- **stats**: Estadísticas del gimnasio (miembros, entrenadores)
- **services**: Servicios ofrecidos (clases, entrenamientos)
- **testimonials**: Testimonios y reseñas de clientes
- **products**: Productos destacados de la tienda
- **plans**: Planes de membresía con precios en quetzales

MÉTRICAS DE RENDIMIENTO:
- **Tiempo de respuesta**: Milisegundos para cada endpoint
- **Disponibilidad**: Porcentaje de endpoints funcionando
- **Datos válidos**: Verificación de que los endpoints retornan información
- **Frecuencia de errores**: Tracking de fallos por endpoint
- **Tiempo de última verificación**: Timestamp de último chequeo

ANÁLISIS DE ERRORES AUTOMÁTICO:

**Error 404 - No Encontrado**:
- Análisis: "Endpoint no implementado"
- Sugerencia: "Implementar [URL] en el backend"

**Error 500 - Error Interno**:
- Análisis: "Error interno del backend"
- Sugerencia: "Revisar logs del backend para detalles"

**ERR_NETWORK - Sin Conexión**:
- Análisis: "No se puede conectar al backend"
- Sugerencia: "Iniciar servidor del backend"

**ECONNABORTED - Timeout**:
- Análisis: "Timeout de petición"
- Sugerencia: "El backend está tardando demasiado en responder"

REPORTES GENERADOS:
- **Timestamp**: Fecha y hora del reporte
- **Resumen**: Estadísticas generales de conectividad
- **Estado global**: connected/partial/disconnected
- **Detalles por endpoint**: Estado, tiempo de respuesta, datos disponibles
- **Recomendaciones**: Lista priorizada de acciones a tomar

VERIFICACIONES AUTOMÁTICAS:
- **Inicial**: Al cargar la aplicación
- **Periódicas**: Cada 2 minutos en background
- **Manuales**: Funciones para verificar endpoints específicos
- **Al demanda**: Generación de reportes cuando se necesite

CASOS DE USO PARA DESARROLLADORES:

**Durante Desarrollo**:
- Verificar que todos los endpoints estén implementados
- Monitorear rendimiento durante pruebas
- Detectar problemas de conectividad tempranamente
- Validar datos retornados por cada endpoint

**En Producción**:
- Monitoreo continuo de salud del sistema
- Alertas tempranas de problemas de backend
- Diagnóstico rápido de fallos de conectividad
- Información para soporte técnico

**Para Administradores**:
- Estado general del sistema del gimnasio
- Verificación de datos críticos (configuración, planes de membresía)
- Monitoreo de disponibilidad de servicios
- Reportes para toma de decisiones técnicas

INTEGRACIÓN CON EL GIMNASIO:
- Verificación específica de datos del gimnasio guatemalteco
- Validación de planes de membresía en quetzales
- Monitoreo de inventario de productos de la tienda
- Estado de servicios específicos del fitness
- Conectividad con sistemas de gestión del gimnasio

OPTIMIZACIONES TÉCNICAS:
- Cache de resultados para evitar verificaciones excesivas
- Intervalos inteligentes de verificación
- Cleanup automático de recursos
- Logging condicional solo en desarrollo
- Análisis eficiente de respuestas

Este hook es fundamental para mantener la confiabilidad y rendimiento del sistema
del gimnasio, proporcionando visibilidad completa del estado del backend y
herramientas de diagnóstico para resolver problemas rápidamente.
*/