// src/hooks/usePaymentStatusTracker.js
// Autor: Alexander Echeverria
// Hook para seguimiento automático de estado de pagos pendientes

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import membershipService from '../services/membershipService';

const usePaymentStatusTracker = (options = {}) => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showInfo, showError } = useApp();
  const queryClient = useQueryClient();
  
  // Configuración por defecto
  const defaultOptions = {
    enabled: true,
    pollInterval: 30000, // 30 segundos
    maxPollDuration: 1800000, // 30 minutos
    onStatusChange: null,
    autoNotify: true,
    ...options
  };

  // Estados locales
  const [isTracking, setIsTracking] = useState(false);
  const [trackingPayments, setTrackingPayments] = useState(new Set());
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null);
  
  // Referencias
  const pollIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const notifiedPayments = useRef(new Set());

  // Query para obtener membresía actual
  const { data: currentMembership, refetch: refetchMembership } = useQuery({
    queryKey: ['currentMembership', user?.id],
    queryFn: () => membershipService.getCurrentMembership(),
    enabled: isAuthenticated && defaultOptions.enabled,
    staleTime: 30000
  });

  // Query para verificar pagos pendientes
  const { data: pendingPayments, refetch: refetchPendingPayments } = useQuery({
    queryKey: ['userPendingPayments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        // Obtener pagos pendientes del usuario
        const response = await membershipService.checkPaymentStatus('user-pending');
        return response.payments || [];
      } catch (error) {
        console.error('Error fetching pending payments:', error);
        return [];
      }
    },
    enabled: isAuthenticated && defaultOptions.enabled,
    staleTime: 15000,
    refetchInterval: isTracking ? defaultOptions.pollInterval : false
  });

  // Función para verificar estado de un pago específico
  const checkSpecificPaymentStatus = useCallback(async (paymentId) => {
    try {
      const status = await membershipService.checkPaymentStatus(paymentId);
      return status;
    } catch (error) {
      console.error(`Error checking status for payment ${paymentId}:`, error);
      return null;
    }
  }, []);

  // Función para iniciar seguimiento de un pago
  const startTracking = useCallback((paymentId) => {
    console.log(`Iniciando seguimiento del pago ${paymentId}`);
    
    setTrackingPayments(prev => new Set([...prev, paymentId]));
    setIsTracking(true);
    startTimeRef.current = Date.now();
    
    if (defaultOptions.autoNotify) {
      showInfo('Seguimiento de pago iniciado. Te notificaremos cuando sea validado.');
    }
  }, [defaultOptions.autoNotify, showInfo]);

  // Función para detener seguimiento de un pago
  const stopTracking = useCallback((paymentId) => {
    console.log(`Deteniendo seguimiento del pago ${paymentId}`);
    
    setTrackingPayments(prev => {
      const newSet = new Set(prev);
      newSet.delete(paymentId);
      return newSet;
    });

    // Si no hay más pagos en seguimiento, detener polling
    if (trackingPayments.size <= 1) {
      setIsTracking(false);
      startTimeRef.current = null;
    }
  }, [trackingPayments.size]);

  // Función para detener todo el seguimiento
  const stopAllTracking = useCallback(() => {
    console.log('Deteniendo todo el seguimiento de pagos');
    
    setIsTracking(false);
    setTrackingPayments(new Set());
    startTimeRef.current = null;
    notifiedPayments.current = new Set();
  }, []);

  // Procesar cambios de estado de pagos
  const processPaymentUpdates = useCallback(async () => {
    if (!pendingPayments || pendingPayments.length === 0) {
      return;
    }

    let hasChanges = false;

    for (const payment of pendingPayments) {
      // Verificar estado actualizado
      const currentStatus = await checkSpecificPaymentStatus(payment.id);
      
      if (!currentStatus) continue;

      const previouslyNotified = notifiedPayments.current.has(payment.id);
      
      // Detectar cambios de estado
      if (currentStatus.status !== payment.status && !previouslyNotified) {
        hasChanges = true;
        
        // Manejar diferentes estados
        switch (currentStatus.status) {
          case 'completed':
            if (defaultOptions.autoNotify) {
              showSuccess(
                payment.paymentMethod === 'transfer' 
                  ? '¡Tu transferencia ha sido validada! Tu membresía está activa.'
                  : '¡Tu pago en efectivo ha sido confirmado! Tu membresía está activa.'
              );
            }
            
            // Marcar como notificado y detener seguimiento
            notifiedPayments.current.add(payment.id);
            stopTracking(payment.id);
            
            // Refrescar membresía
            setTimeout(() => {
              refetchMembership();
              queryClient.invalidateQueries(['userMemberships']);
            }, 1000);
            
            break;
            
          case 'failed':
            if (defaultOptions.autoNotify) {
              showError(
                `Tu ${payment.paymentMethod === 'transfer' ? 'transferencia' : 'pago'} fue rechazado. ` +
                'Contacta soporte para más información.'
              );
            }
            
            notifiedPayments.current.add(payment.id);
            stopTracking(payment.id);
            break;
            
          case 'under_review':
            if (defaultOptions.autoNotify && !previouslyNotified) {
              showInfo('Tu pago está siendo revisado por nuestro equipo.');
            }
            break;
        }

        // Ejecutar callback personalizado
        if (defaultOptions.onStatusChange) {
          defaultOptions.onStatusChange({
            paymentId: payment.id,
            previousStatus: payment.status,
            currentStatus: currentStatus.status,
            payment: currentStatus
          });
        }

        setLastStatusUpdate({
          paymentId: payment.id,
          status: currentStatus.status,
          timestamp: Date.now()
        });
      }
    }

    if (hasChanges) {
      // Refrescar queries relacionadas
      refetchPendingPayments();
    }
  }, [
    pendingPayments, 
    checkSpecificPaymentStatus, 
    defaultOptions.onStatusChange, 
    defaultOptions.autoNotify,
    showSuccess, 
    showError, 
    showInfo,
    stopTracking,
    refetchMembership,
    refetchPendingPayments,
    queryClient
  ]);

  // Efecto para manejar polling automático
  useEffect(() => {
    if (!isTracking || trackingPayments.size === 0) {
      return;
    }

    // Verificar timeout máximo
    if (startTimeRef.current && 
        Date.now() - startTimeRef.current > defaultOptions.maxPollDuration) {
      console.log('Timeout de seguimiento alcanzado, deteniendo');
      stopAllTracking();
      
      if (defaultOptions.autoNotify) {
        showInfo('Seguimiento de pago finalizado. Revisa tu membresía más tarde.');
      }
      return;
    }

    // Procesar actualizaciones
    processPaymentUpdates();

  }, [
    isTracking, 
    trackingPayments.size, 
    processPaymentUpdates, 
    defaultOptions.maxPollDuration,
    defaultOptions.autoNotify,
    stopAllTracking,
    showInfo
  ]);

  // Efecto para iniciar seguimiento automático de pagos pendientes
  useEffect(() => {
    if (!pendingPayments || pendingPayments.length === 0) {
      return;
    }

    // Auto-iniciar seguimiento para pagos pendientes no rastreados
    pendingPayments.forEach(payment => {
      if (payment.status === 'pending' && !trackingPayments.has(payment.id)) {
        startTracking(payment.id);
      }
    });
  }, [pendingPayments, trackingPayments, startTracking]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopAllTracking();
    };
  }, [stopAllTracking]);

  // Funciones de utilidad
  const getTrackingStatus = () => ({
    isTracking,
    trackedPayments: Array.from(trackingPayments),
    elapsedTime: startTimeRef.current ? Date.now() - startTimeRef.current : 0,
    remainingTime: startTimeRef.current ? 
      Math.max(0, defaultOptions.maxPollDuration - (Date.now() - startTimeRef.current)) : 0
  });

  const hasActiveMembership = () => {
    return currentMembership && 
           currentMembership.status === 'active' && 
           new Date(currentMembership.endDate) > new Date();
  };

  const hasPendingPayments = () => {
    return pendingPayments && pendingPayments.length > 0;
  };

  const getPendingPaymentsSummary = () => {
    if (!pendingPayments) return null;

    return {
      total: pendingPayments.length,
      byMethod: pendingPayments.reduce((acc, payment) => {
        acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
        return acc;
      }, {}),
      totalAmount: pendingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      oldestPayment: pendingPayments.reduce((oldest, payment) => {
        return !oldest || new Date(payment.createdAt) < new Date(oldest.createdAt) 
          ? payment : oldest;
      }, null)
    };
  };

  return {
    // Estados principales
    isTracking,
    trackingPayments: Array.from(trackingPayments),
    pendingPayments: pendingPayments || [],
    currentMembership,
    lastStatusUpdate,

    // Funciones de control
    startTracking,
    stopTracking,
    stopAllTracking,
    checkSpecificPaymentStatus,

    // Funciones de utilidad
    getTrackingStatus,
    hasActiveMembership,
    hasPendingPayments,
    getPendingPaymentsSummary,

    // Funciones de refetch
    refetchMembership,
    refetchPendingPayments
  };
};

export default usePaymentStatusTracker;

/*
=== HOOK PARA SEGUIMIENTO DE PAGOS ===

FUNCIONALIDADES PRINCIPALES:
- Seguimiento automático de pagos pendientes
- Polling inteligente con timeouts
- Notificaciones automáticas de cambios de estado
- Gestión de múltiples pagos simultáneos
- Integración con React Query para cache

CARACTERÍSTICAS DEL POLLING:
- Intervalo configurable (default: 30 segundos)
- Timeout máximo (default: 30 minutos)
- Auto-stop cuando se resuelven los pagos
- Detección de cambios de estado en tiempo real

NOTIFICACIONES AUTOMÁTICAS:
- Pago aprobado: Notificación de éxito
- Pago rechazado: Alerta con instrucciones
- En revisión: Información de estado
- Sin duplicados para el mismo pago

ESTADOS DE PAGO RASTREADOS:
- 'pending': Esperando validación
- 'under_review': En proceso de revisión
- 'completed': Aprobado y membresía activada
- 'failed': Rechazado por administrador

OPTIMIZACIONES:
- Solo rastrea pagos que necesitan seguimiento
- Cache inteligente con React Query
- Limpieza automática de memoria
- Prevención de llamadas redundantes

USO BÁSICO:
```javascript
const {
  isTracking,
  pendingPayments,
  startTracking,
  hasPendingPayments,
  getPendingPaymentsSummary
} = usePaymentStatusTracker({
  onStatusChange: (update) => {
    console.log('Payment status changed:', update);
  }
});

// Auto-iniciar seguimiento para pago específico
useEffect(() => {
  if (newPaymentId) {
    startTracking(newPaymentId);
  }
}, [newPaymentId]);
```

USO AVANZADO:
```javascript
const tracker = usePaymentStatusTracker({
  pollInterval: 15000, // 15 segundos
  maxPollDuration: 900000, // 15 minutos
  autoNotify: false, // Manejar notificaciones manualmente
  onStatusChange: (update) => {
    // Lógica personalizada
    if (update.currentStatus === 'completed') {
      router.push('/dashboard');
    }
  }
});
```

INTEGRACIÓN CON COMPONENTES:
- Dashboard del cliente: Mostrar estado de pagos
- Checkout: Iniciar seguimiento tras crear pago
- Notificaciones: Alertas en tiempo real
- Admin panel: Sincronización bidireccional

BENEFICIOS PARA UX:
- Usuario no necesita refrescar manualmente
- Feedback inmediato sobre cambios de estado
- Reducción de consultas de soporte
- Experiencia fluida y transparente

CASOS DE USO:
1. Cliente realiza transferencia -> Auto-seguimiento iniciado
2. Admin valida pago -> Usuario recibe notificación inmediata
3. Pago rechazado -> Usuario alertado con instrucciones
4. Múltiples pagos -> Seguimiento independiente de cada uno

CONFIGURACIÓN EN PRODUCCIÓN:
- Ajustar intervalos según carga del servidor
- Limitar duración máxima para conservar recursos
- Implementar backoff exponencial en caso de errores
- Monitorear uso de recursos y optimizar
*/