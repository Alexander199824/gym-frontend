
// src/hooks/useGymConfig.js
// FUNCIÓN: Hook CORREGIDO para cargar configuración del gimnasio
// ARREGLA: Extrae solo la data del response del backend

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useGymConfig = () => {
  const [config, setConfig] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  console.log('🚀 useGymConfig hook initialized');

  const fetchConfig = useCallback(async (attempt = 1) => {
    console.log(`🏢 Loading Gym Config - Attempt ${attempt}`);
    
    if (attempt === 1) {
      setIsLoading(true);
      setError(null);
    }

    try {
      console.log('📡 Making request to /api/gym/config...');
      const response = await apiService.getGymConfig();
      
      console.log('✅ Config response received:', response);
      
      // 🔧 ARREGLO CRÍTICO: Extraer solo la data del response
      let configData = null;
      
      if (response && response.success && response.data) {
        // Backend devuelve: { success: true, data: { name: "...", ... } }
        configData = response.data;
        console.log('📋 Config data structure:');
        console.log('  - Name:', configData.name);
        console.log('  - Description:', configData.description);
        console.log('  - Logo URL:', configData.logo?.url || '❌ MISSING');
        console.log('  - Contact info:', configData.contact ? '✅ Present' : '❌ MISSING');
        console.log('  - Social media:', configData.social ? `✅ ${Object.keys(configData.social).length} platforms` : '❌ MISSING');
        console.log('  - Hours:', configData.hours?.full || '❌ MISSING');
        console.log('  - Tagline:', configData.tagline || '❌ MISSING');
      } else if (response && response.name) {
        // Si el response ya es la data directamente
        configData = response;
        console.log('📋 Config data (direct):', configData.name);
      } else {
        console.warn('⚠️ Invalid config response structure:', response);
        throw new Error('Invalid response structure');
      }

      if (configData && configData.name) {
        setConfig(configData); // ✅ Guardamos solo la data, no el wrapper
        setIsLoaded(true);
        setError(null);
        console.log('🎉 Gym config loaded successfully!');
      } else {
        throw new Error('Config data missing required fields');
      }

    } catch (err) {
      console.error(`❌ Error loading config (attempt ${attempt}):`, err.message);
      
      setError(err);
      
      // Reintentar hasta 3 veces
      if (attempt < 3) {
        console.log(`🔄 Retrying in ${attempt}s...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchConfig(attempt + 1);
        }, attempt * 1000);
      } else {
        console.log('💥 Max retry attempts reached');
        setIsLoaded(true); // Marcar como cargado aunque falle
      }
    } finally {
      if (attempt === 1 || attempt >= 3) {
        setIsLoading(false);
      }
    }
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    fetchConfig();
    
    // Cleanup en unmount
    return () => {
      console.log('🧹 useGymConfig hook cleanup');
    };
  }, [fetchConfig]);

  // Logs de estado cuando cambie config
  useEffect(() => {
    if (config) {
      console.log('🏢 Gym Config State Update:', {
        hasName: !!config.name,
        hasLogo: !!config.logo?.url,
        hasContact: !!config.contact,
        hasSocial: !!(config.social && Object.keys(config.social).length > 0),
        hasHours: !!config.hours
      });
    }
  }, [config]);

  // Función manual de reload
  const reload = useCallback(() => {
    console.log('🔄 Manual config reload requested');
    setRetryCount(0);
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,          // ✅ Solo la data: { name: "...", description: "...", ... }
    isLoaded,        // true cuando terminó de cargar (exitoso o fallo)
    isLoading,       // true mientras está cargando
    error,           // Error si falló
    reload,          // Función para recargar manualmente
    retryCount       // Número de reintentos
  };
};

export default useGymConfig;