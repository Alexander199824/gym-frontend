// src/hooks/useGymConfig.js
// FUNCIÓN: Hook MEJORADO para cargar configuración del gimnasio con logs detallados
// TOLERANTE: A errores, timeouts y datos faltantes

import { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService';

const useGymConfig = () => {
  const [state, setState] = useState({
    config: null,
    isLoaded: false,
    isLoading: false,
    error: null,
    lastAttempt: null,
    attemptCount: 0
  });
  
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);
  
  // 🔄 Función para cargar configuración
  const loadConfig = async (attemptNumber = 1) => {
    if (!isMountedRef.current) return;
    
    console.group(`🏢 Loading Gym Config - Attempt ${attemptNumber}`);
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastAttempt: new Date(),
      attemptCount: attemptNumber
    }));
    
    try {
      console.log('📡 Making request to /api/gym/config...');
      
      const response = await apiService.getGymConfig();
      
      console.log('✅ Config response received:', response);
      
      // Analizar la respuesta
      if (response && response.success && response.data) {
        const configData = response.data;
        
        console.log('📋 Config data structure:');
        console.log('  - Name:', configData.name || '❌ MISSING');
        console.log('  - Description:', configData.description || '❌ MISSING');
        console.log('  - Logo URL:', configData.logo?.url || '❌ MISSING');
        console.log('  - Contact info:', configData.contact ? '✅ Present' : '❌ MISSING');
        console.log('  - Social media:', configData.social ? `✅ ${Object.keys(configData.social).length} platforms` : '❌ MISSING');
        console.log('  - Hours:', configData.hours?.full || '❌ MISSING');
        console.log('  - Tagline:', configData.tagline || '❌ MISSING');
        
        // Validar que al menos tengamos el nombre del gimnasio
        if (!configData.name) {
          console.warn('⚠️ Config loaded but missing gym name. Using fallback.');
          configData.name = 'Elite Fitness Club';
        }
        
        if (!configData.description) {
          console.warn('⚠️ Config loaded but missing description. Using fallback.');
          configData.description = 'Tu transformación comienza aquí.';
        }
        
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            config: configData,
            isLoaded: true,
            isLoading: false,
            error: null
          }));
        }
        
        console.log('🎉 Gym config loaded successfully!');
        console.groupEnd();
        
      } else {
        throw new Error('Invalid response structure from backend');
      }
      
    } catch (error) {
      console.log('❌ Failed to load gym config:', error.message);
      
      let errorMessage = 'Error loading gym configuration';
      let shouldRetry = false;
      
      // Analizar el tipo de error
      if (error.response?.status === 404) {
        errorMessage = 'Gym config endpoint not found (404)';
        console.log('💡 SOLUTION: Implement /api/gym/config endpoint in backend');
      } else if (error.response?.status === 500) {
        errorMessage = 'Backend internal error (500)';
        shouldRetry = true;
        console.log('💡 SOLUTION: Check backend logs for internal error details');
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to backend';
        shouldRetry = true;
        console.log('💡 SOLUTION: Start the backend server');
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout';
        shouldRetry = true;
        console.log('💡 SOLUTION: Backend is taking too long to respond');
      }
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          // En caso de error, usar configuración mínima para que la app no se rompa
          config: prev.config || {
            name: 'Elite Fitness Club',
            description: 'Tu transformación comienza aquí.',
            contact: { address: 'Guatemala', phone: 'Pronto disponible' },
            hours: { full: 'Consultar horarios' },
            social: {}
          },
          isLoaded: true // Marcar como cargado para que la app pueda continuar
        }));
      }
      
      // Reintentar automáticamente para ciertos tipos de error
      if (shouldRetry && attemptNumber < 3) {
        console.log(`🔄 Will retry in ${attemptNumber * 2} seconds...`);
        setTimeout(() => {
          if (isMountedRef.current) {
            loadConfig(attemptNumber + 1);
          }
        }, attemptNumber * 2000);
      }
      
      console.groupEnd();
    }
  };
  
  // 🔄 Función para recargar configuración manualmente
  const reloadConfig = () => {
    console.log('🔄 Manual reload of gym config requested');
    setState(prev => ({ ...prev, attemptCount: 0 }));
    loadConfig(1);
  };
  
  // ⏰ Timeout de seguridad - Si no carga en 5 segundos, usar fallback
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (!state.isLoaded && isMountedRef.current) {
        console.warn('⏰ Gym config loading timeout - using fallback configuration');
        setState(prev => ({
          ...prev,
          config: {
            name: 'Elite Fitness Club',
            description: 'Tu transformación comienza aquí.',
            contact: { address: 'Guatemala', phone: 'Pronto disponible' },
            hours: { full: 'Consultar horarios' },
            social: {}
          },
          isLoaded: true,
          isLoading: false,
          error: 'Loading timeout - using fallback configuration'
        }));
      }
    }, 5000);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.isLoaded]);
  
  // 🔥 Cargar configuración al montar el componente
  useEffect(() => {
    console.log('🚀 useGymConfig hook initialized');
    loadConfig(1);
    
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      console.log('🧹 useGymConfig hook cleanup');
    };
  }, []);
  
  // 📊 Log del estado actual cuando cambie
  useEffect(() => {
    console.log('🏢 Gym Config State Update:', {
      isLoaded: state.isLoaded,
      isLoading: state.isLoading,
      hasConfig: !!state.config,
      hasError: !!state.error,
      attemptCount: state.attemptCount,
      configName: state.config?.name || 'Not loaded'
    });
  }, [state.isLoaded, state.isLoading, state.config, state.error, state.attemptCount]);

  return {
    // Datos principales
    config: state.config,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    error: state.error,
    
    // Información adicional
    lastAttempt: state.lastAttempt,
    attemptCount: state.attemptCount,
    
    // Funciones
    reloadConfig,
    
    // Helpers
    hasValidConfig: !!(state.config && state.config.name),
    isUsingFallback: !!(state.error && state.config),
    
    // Accesos directos a propiedades comunes
    gymName: state.config?.name || 'Elite Fitness Club',
    gymDescription: state.config?.description || 'Tu transformación comienza aquí.',
    gymLogo: state.config?.logo?.url || null,
    gymContact: state.config?.contact || null,
    gymSocial: state.config?.social || {},
    gymHours: state.config?.hours?.full || 'Consultar horarios'
  };
};

export default useGymConfig;