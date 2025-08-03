// src/components/common/SystemStatusIndicator.js
// FUNCIÓN: Indicador simple circular del estado del sistema (similar a ConnectionIndicator)
// UBICACIÓN: Esquina inferior derecha, solo para admins

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';

const SystemStatusIndicator = ({ show = true }) => {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState('checking');
  const [showDetails, setShowDetails] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    totalUsers: 0,
    activeUsers: 0,
    systemHealth: 'unknown',
    lastCheck: null,
    uptime: null
  });

  // Solo mostrar para admins
  const shouldShow = show && user?.role === 'admin';

  // 🔄 Verificar estado del sistema
  const checkSystemStatus = async () => {
    if (!shouldShow) return;
    
    setSystemStatus('checking');
    
    try {
      // Intentar obtener stats básicas del sistema
      const promises = [
        apiService.getUserStats().catch(() => null),
        apiService.getSystemHealth().catch(() => null),
        apiService.getMembershipStats().catch(() => null)
      ];
      
      const [userStats, healthData, membershipStats] = await Promise.all(promises);
      
      // Actualizar información del sistema
      setSystemInfo({
        totalUsers: userStats?.totalUsers || userStats?.totalActiveUsers || 0,
        activeUsers: userStats?.activeUsers || userStats?.totalActiveUsers || 0,
        activeMemberships: membershipStats?.activeMemberships || 0,
        systemHealth: healthData?.status || 'operational',
        lastCheck: new Date(),
        uptime: healthData?.uptime || 'unknown'
      });
      
      // Determinar estado general
      if (userStats || healthData || membershipStats) {
        setSystemStatus('operational');
      } else {
        setSystemStatus('partial');
      }
      
    } catch (error) {
      console.log('⚠️ System status check failed:', error.message);
      setSystemStatus('error');
      setSystemInfo(prev => ({
        ...prev,
        lastCheck: new Date(),
        systemHealth: 'error'
      }));
    }
  };

  // ⏰ Verificar cada 30 segundos
  useEffect(() => {
    if (!shouldShow) return;

    // Verificación inicial
    checkSystemStatus();

    // Verificar periódicamente
    const interval = setInterval(checkSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, [shouldShow]);

  // 🎨 Configuración visual según estado
  const getStatusConfig = () => {
    switch (systemStatus) {
      case 'operational':
        return {
          color: 'bg-green-500',
          title: `Sistema Operativo - ${systemInfo.totalUsers} usuarios`,
          pulse: false
        };
        
      case 'partial':
        return {
          color: 'bg-yellow-500',
          title: 'Sistema Parcialmente Funcional',
          pulse: true
        };
        
      case 'error':
        return {
          color: 'bg-red-500',
          title: 'Error en Sistema',
          pulse: true
        };
        
      case 'checking':
      default:
        return {
          color: 'bg-blue-500',
          title: 'Verificando sistema...',
          pulse: true
        };
    }
  };

  // No mostrar si no es admin o no está habilitado
  if (!shouldShow) return null;

  const config = getStatusConfig();

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* 🟢 CÍRCULO INDICADOR SIMPLE */}
      <div
        className="relative cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
        title={config.title}
      >
        <div className={`w-3 h-3 rounded-full ${config.color} transition-all duration-300 ${
          config.pulse ? 'animate-pulse' : ''
        } hover:scale-125`} />
      </div>

      {/* 📋 PANEL DE DETALLES DEL SISTEMA */}
      {showDetails && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          
          {/* Panel de información */}
          <div className="absolute bottom-6 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${config.color} mr-2`} />
                <span className="text-sm font-medium text-gray-900">
                  Estado del Sistema
                </span>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Información principal */}
            <div className="space-y-3">
              
              {/* Estado general */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Estado:</span>
                <span className={`text-sm font-medium ${
                  systemStatus === 'operational' ? 'text-green-600' :
                  systemStatus === 'partial' ? 'text-yellow-600' :
                  systemStatus === 'error' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {systemStatus === 'operational' ? 'Operativo' :
                   systemStatus === 'partial' ? 'Parcial' :
                   systemStatus === 'error' ? 'Error' : 'Verificando...'}
                </span>
              </div>

              {/* Métricas del sistema */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {systemInfo.totalUsers}
                  </div>
                  <div className="text-xs text-blue-500">
                    Usuarios Totales
                  </div>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {systemInfo.activeMemberships}
                  </div>
                  <div className="text-xs text-green-500">
                    Membresías Activas
                  </div>
                </div>
              </div>

              {/* Información técnica */}
              <div className="space-y-2 text-xs text-gray-500">
                {systemInfo.lastCheck && (
                  <div className="flex justify-between">
                    <span>Última verificación:</span>
                    <span>{systemInfo.lastCheck.toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Usuario:</span>
                  <span>{user?.firstName} {user?.lastName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Rol:</span>
                  <span className="capitalize">{user?.role}</span>
                </div>
              </div>

              {/* Botón de actualizar */}
              <button
                onClick={checkSystemStatus}
                disabled={systemStatus === 'checking'}
                className="w-full text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {systemStatus === 'checking' ? 'Verificando...' : 'Actualizar Estado'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemStatusIndicator;