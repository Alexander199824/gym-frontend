// src/hooks/useBackendDebug.js
// FUNCIÓN: Hook para debug completo del backend y estado de carga
// MUESTRA: Información detallada de TODAS las peticiones y respuestas

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
      console.log(`🔍 Testing endpoint: ${endpoint.name} (${endpoint.url})`);
      
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
      
      console.log(`✅ ${endpoint.name} SUCCESS:`, {
        responseTime: `${responseTime}ms`,
        hasData,
        dataType: Array.isArray(response?.data) ? 'Array' : typeof response?.data,
        dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A'
      });
      
      // Log específico según el tipo de endpoint
      if (endpoint.name === 'config' && response?.data) {
        console.log('🏢 CONFIG DETAILS:', {
          name: response.data.name || '❌ Missing',
          logo: response.data.logo?.url ? '✅ Present' : '❌ Missing',
          contact: response.data.contact ? '✅ Present' : '❌ Missing',
          social: response.data.social ? `✅ ${Object.keys(response.data.social).length} platforms` : '❌ Missing'
        });
      }
      
      if (endpoint.name === 'stats' && response?.data) {
        console.log('📊 STATS DETAILS:', {
          members: response.data.members || 0,
          trainers: response.data.trainers || 0,
          experience: response.data.experience || 0,
          satisfaction: response.data.satisfaction || 0
        });
      }
      
      if (endpoint.name === 'services' && Array.isArray(response?.data)) {
        console.log('🏋️ SERVICES DETAILS:', {
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
      
      console.log(`❌ ${endpoint.name} FAILED:`, {
        error: error.message,
        status: error.response?.status,
        responseTime: `${responseTime}ms`
      });
      
      // Análisis específico del error
      let errorAnalysis = 'Unknown error';
      let suggestion = 'Check backend configuration';
      
      if (error.response?.status === 404) {
        errorAnalysis = 'Endpoint not implemented';
        suggestion = `Implement ${endpoint.url} in backend`;
      } else if (error.response?.status === 500) {
        errorAnalysis = 'Backend internal error';
        suggestion = 'Check backend logs for details';
      } else if (error.code === 'ERR_NETWORK') {
        errorAnalysis = 'Cannot connect to backend';
        suggestion = 'Start backend server';
      } else if (error.code === 'ECONNABORTED') {
        errorAnalysis = 'Request timeout';
        suggestion = 'Backend is taking too long to respond';
      }
      
      console.log(`💡 ${endpoint.name} ANALYSIS: ${errorAnalysis}`);
      console.log(`🔧 ${endpoint.name} SUGGESTION: ${suggestion}`);
      
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
    
    console.group('🔌 COMPLETE BACKEND CHECK - Starting...');
    
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
      
      // Small delay between requests to avoid overwhelming
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
    
    console.log('📊 BACKEND CHECK SUMMARY:', {
      total: endpointsToCheck.length,
      working: workingCount,
      failed: failedCount,
      percentage: `${percentage}%`,
      status: backendStatus,
      criticalErrors
    });
    
    if (errors.length > 0) {
      console.log('❌ ERRORS FOUND:');
      errors.forEach(err => {
        console.log(`  - ${err.endpoint}: ${err.error}`);
        if (err.critical) {
          console.log(`    ⚠️ CRITICAL: ${err.suggestion}`);
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
      console.error(`Endpoint ${endpointName} not found in list`);
      return null;
    }
    
    console.log(`🎯 Manual check for ${endpointName}...`);
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
    console.log('🚀 Backend Debug Hook initialized');
    
    // Verificación inicial inmediata
    checkAllEndpoints();
    
    // Verificación periódica cada 2 minutos
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log('🔄 Periodic backend check...');
        checkAllEndpoints();
      }
    }, 120000); // 2 minutos
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      console.log('🧹 Backend Debug Hook cleanup');
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
      report.recommendations.push('🚨 Critical: Start backend server immediately');
    }
    
    const failingEndpoints = getFailingEndpoints();
    failingEndpoints.forEach(ep => {
      if (ep.critical) {
        report.recommendations.push(`⚠️ Critical: ${ep.suggestion}`);
      } else {
        report.recommendations.push(`💡 Optional: ${ep.suggestion}`);
      }
    });
    
    console.log('📋 BACKEND REPORT:', report);
    
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