// src/pages/dashboard/components/PaymentsManager/hooks/useTransfers.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de transferencias bancarias
// Incluye validación, aprobación, rechazo y gestión de estados de procesamiento

// src/pages/dashboard/components/PaymentsManager/hooks/useTransfers.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de transferencias bancarias
// CORREGIDO: Mejorado cálculo de tiempo de espera y sincronización

import { useState, useEffect, useCallback } from 'react';
import apiService from '../../../../../services/apiService';

const useTransfers = (onSave) => {
  // Estados principales de transferencias
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [transferStats, setTransferStats] = useState({
    total: 0,
    critical: 0, // Más de 24h
    high: 0,     // Más de 12h
    medium: 0,   // Más de 4h
    normal: 0,   // Menos de 4h
    totalAmount: 0,
    avgAmount: 0,
    avgHours: 0,
    withProof: 0,
    withoutProof: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Estados de procesamiento
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Estados de filtros específicos para transferencias
  const [searchTerm, setSearchTerm] = useState('');
  const [transferViewMode, setTransferViewMode] = useState('grid');
  const [transferSortBy, setTransferSortBy] = useState('waiting_time');
  const [transferPriorityFilter, setTransferPriorityFilter] = useState('all');

  // NUEVO: Función para calcular tiempo de espera si no viene del backend
  const calculateHoursWaiting = useCallback((createdAt, paymentDate) => {
    if (!createdAt && !paymentDate) return 0;
    
    const transferDate = new Date(paymentDate || createdAt);
    const now = new Date();
    const diffTime = now - transferDate;
    const diffHours = diffTime / (1000 * 60 * 60); // Convertir a horas
    
    return Math.max(0, diffHours); // No permitir valores negativos
  }, []);

  // Función para calcular estadísticas de transferencias - MEJORADA
  const calculateTransferStats = useCallback((transfers) => {
    const total = transfers.length;
    const critical = transfers.filter(t => (t.hoursWaiting || 0) > 24).length;
    const high = transfers.filter(t => (t.hoursWaiting || 0) > 12 && (t.hoursWaiting || 0) <= 24).length;
    const medium = transfers.filter(t => (t.hoursWaiting || 0) > 4 && (t.hoursWaiting || 0) <= 12).length;
    const normal = transfers.filter(t => (t.hoursWaiting || 0) <= 4).length;
    const totalAmount = transfers.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;
    const avgHours = total > 0 ? 
      transfers.reduce((sum, t) => sum + (t.hoursWaiting || 0), 0) / total : 0;
    const withProof = transfers.filter(t => t.transferProof).length;
    const withoutProof = transfers.filter(t => !t.transferProof).length;

    return {
      total,
      critical,
      high,
      medium,
      normal,
      totalAmount,
      avgAmount,
      avgHours,
      withProof,
      withoutProof
    };
  }, []);

  // Función principal para cargar transferencias pendientes - MEJORADA
  const loadPendingTransfers = useCallback(async () => {
    try {
      console.log('🏦 useTransfers: Cargando transferencias pendientes...');
      setLoading(true);
      
      const response = await apiService.paymentService.getPendingTransfers({
        search: searchTerm,
        sortBy: transferSortBy,
        priority: transferPriorityFilter === 'all' ? undefined : transferPriorityFilter
      });
      
      if (response?.success && response.data) {
        const transfers = response.data.transfers || [];
        
        // MEJORADO: Procesar transferencias con cálculo de tiempo de espera
        const processedTransfers = transfers.map(transfer => {
          // Calcular hoursWaiting si no viene del backend o es 0
          let hoursWaiting = transfer.hoursWaiting || 0;
          
          if (!hoursWaiting || hoursWaiting === 0) {
            hoursWaiting = calculateHoursWaiting(
              transfer.createdAt, 
              transfer.paymentDate
            );
          }

          return {
            ...transfer,
            id: transfer.id || transfer.paymentId,
            amount: parseFloat(transfer.amount || 0),
            user: transfer.user || {
              name: transfer.clientName || 
                    `${transfer.user?.firstName || ''} ${transfer.user?.lastName || ''}`.trim() || 
                    'Cliente Anónimo',
              firstName: transfer.user?.firstName || transfer.clientName?.split(' ')[0] || '',
              lastName: transfer.user?.lastName || transfer.clientName?.split(' ').slice(1).join(' ') || '',
              email: transfer.user?.email || ''
            },
            hoursWaiting: hoursWaiting, // CORREGIDO: Asegurar que siempre tenga un valor calculado
            paymentDate: transfer.paymentDate || transfer.createdAt,
            transferProof: transfer.transferProof || transfer.hasProof || false,
            transferValidated: transfer.transferValidated,
            transferValidatedAt: transfer.transferValidatedAt,
            transferValidator: transfer.transferValidator,
            registeredByUser: transfer.registeredByUser,
            reference: transfer.reference || transfer.transferReference || ''
          };
        });
        
        setPendingTransfers(processedTransfers);
        
        // Calcular estadísticas
        const calculatedStats = calculateTransferStats(processedTransfers);
        setTransferStats(calculatedStats);
        
        console.log(`✅ ${processedTransfers.length} transferencias pendientes cargadas`);
        console.log('📊 Estadísticas calculadas:', {
          total: calculatedStats.total,
          critical: calculatedStats.critical,
          high: calculatedStats.high,
          medium: calculatedStats.medium,
          normal: calculatedStats.normal,
          avgHours: calculatedStats.avgHours.toFixed(1)
        });
        
      } else {
        setPendingTransfers([]);
        setTransferStats({
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          normal: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgHours: 0,
          withProof: 0,
          withoutProof: 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error cargando transferencias:', error);
      setPendingTransfers([]);
      setTransferStats({
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        normal: 0,
        totalAmount: 0,
        avgAmount: 0,
        avgHours: 0,
        withProof: 0,
        withoutProof: 0
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, transferSortBy, transferPriorityFilter, calculateTransferStats, calculateHoursWaiting]);

  // Función para validar una transferencia (aprobar o rechazar)
  const handleValidateTransfer = useCallback(async (paymentId, approved, showSuccess, showError) => {
    if (processingIds.has(paymentId)) return;

    const transfer = pendingTransfers.find(t => t.id === paymentId);
    const clientName = transfer?.user?.name || 'cliente';
    
    const confirmed = window.confirm(
      approved 
        ? `¿Confirmar que quieres APROBAR la transferencia de ${clientName} por ${transfer?.amount || 0}?`
        : `¿Confirmar que quieres RECHAZAR la transferencia de ${clientName}?`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      console.log(`🏦 ${approved ? 'Aprobando' : 'Rechazando'} transferencia:`, paymentId);
      
      await apiService.paymentService.validateTransfer(
        paymentId, 
        approved, 
        approved ? 'Transferencia aprobada por administrador' : 'Transferencia rechazada por administrador'
      );
      
      showSuccess(
        approved 
          ? `Transferencia de ${clientName} aprobada exitosamente`
          : `Transferencia de ${clientName} rechazada`
      );
      
      // Remover de la lista local inmediatamente
      setPendingTransfers(prev => prev.filter(t => t.id !== paymentId));
      
      // Recargar datos completos
      await loadPendingTransfers();
      
      if (onSave) {
        onSave({ 
          type: 'transfer_validation', 
          approved,
          transferId: paymentId,
          clientName: clientName,
          amount: transfer?.amount || 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error validando transferencia:', error);
      showError('Error al procesar transferencia: ' + (error.message || 'Error desconocido'));
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  }, [processingIds, pendingTransfers, loadPendingTransfers, onSave]);

  // Función para filtrar y ordenar transferencias
  const getFilteredTransfers = useCallback(() => {
    let filtered = [...pendingTransfers];

    // Filtrar por prioridad
    if (transferPriorityFilter !== 'all') {
      filtered = filtered.filter(transfer => {
        const priority = getTransferPriority(transfer.hoursWaiting || 0);
        return priority === transferPriorityFilter;
      });
    }

    // Filtrar por búsqueda
    if (searchTerm && searchTerm.length >= 2) {
      const searchText = searchTerm.toLowerCase();
      filtered = filtered.filter(transfer => {
        const clientInfo = `${transfer.user?.name || ''} ${transfer.user?.email || ''} ${transfer.reference || ''}`.toLowerCase();
        return clientInfo.includes(searchText);
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (transferSortBy) {
        case 'waiting_time':
          return (b.hoursWaiting || 0) - (a.hoursWaiting || 0);
        case 'amount':
          return (b.amount || 0) - (a.amount || 0);
        case 'name':
          return (a.user?.name || '').localeCompare(b.user?.name || '');
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [pendingTransfers, transferPriorityFilter, searchTerm, transferSortBy]);

  // Función para determinar la prioridad de una transferencia - MEJORADA
  const getTransferPriority = useCallback((hoursWaiting) => {
    if (hoursWaiting > 24) {
      return 'critical'; // Más de 24 horas - crítica
    } else if (hoursWaiting > 12) {
      return 'high'; // Más de 12 horas - alta
    } else if (hoursWaiting > 4) {
      return 'medium'; // Más de 4 horas - media
    } else {
      return 'normal'; // Normal
    }
  }, []);

  // Función para obtener configuración de prioridad - MEJORADA
  const getTransferPriorityConfig = useCallback((hoursWaiting) => {
    if (hoursWaiting > 24) {
      return {
        priority: 'critical',
        color: 'red',
        label: 'Crítica',
        description: 'Más de 24 horas - Requiere atención inmediata',
        urgency: 4
      };
    } else if (hoursWaiting > 12) {
      return {
        priority: 'high',
        color: 'orange',
        label: 'Alta',
        description: 'Más de 12 horas - Requiere atención pronto',
        urgency: 3
      };
    } else if (hoursWaiting > 4) {
      return {
        priority: 'medium',
        color: 'yellow',
        label: 'Media',
        description: 'Más de 4 horas - Revisar cuando sea posible',
        urgency: 2
      };
    } else {
      return {
        priority: 'normal',
        color: 'purple',
        label: 'Normal',
        description: 'Recién recibida',
        urgency: 1
      };
    }
  }, []);

  // Función para aprobar una transferencia específicamente
  const handleApproveTransfer = useCallback(async (paymentId, showSuccess, showError) => {
    await handleValidateTransfer(paymentId, true, showSuccess, showError);
  }, [handleValidateTransfer]);

  // Función para rechazar una transferencia específicamente
  const handleRejectTransfer = useCallback(async (paymentId, showSuccess, showError) => {
    await handleValidateTransfer(paymentId, false, showSuccess, showError);
  }, [handleValidateTransfer]);

  // Función para obtener el estado de procesamiento de una transferencia
  const isTransferProcessing = useCallback((transferId) => {
    return processingIds.has(transferId);
  }, [processingIds]);

  // Función para obtener el tipo de procesamiento
  const getProcessingType = useCallback((transferId) => {
    if (processingIds.has(transferId)) {
      return 'processing';
    }
    return null;
  }, [processingIds]);

  // NUEVA: Función para obtener distribución por prioridad
  const getPriorityDistribution = useCallback(() => {
    return {
      critical: transferStats.critical,
      high: transferStats.high,
      medium: transferStats.medium,
      normal: transferStats.normal,
      total: transferStats.total
    };
  }, [transferStats]);

  // NUEVA: Función para obtener transferencias críticas
  const getCriticalTransfers = useCallback(() => {
    return pendingTransfers.filter(t => (t.hoursWaiting || 0) > 24);
  }, [pendingTransfers]);

  // NUEVA: Función para obtener resumen de urgencia
  const getUrgencySummary = useCallback(() => {
    const critical = pendingTransfers.filter(t => (t.hoursWaiting || 0) > 24);
    const high = pendingTransfers.filter(t => (t.hoursWaiting || 0) > 12 && (t.hoursWaiting || 0) <= 24);
    const needsAttention = critical.length + high.length;
    
    return {
      needsAttention,
      criticalCount: critical.length,
      highCount: high.length,
      totalAmount: [...critical, ...high].reduce((sum, t) => sum + (t.amount || 0), 0),
      oldestHours: Math.max(...pendingTransfers.map(t => t.hoursWaiting || 0), 0)
    };
  }, [pendingTransfers]);

  // Función para ordenar transferencias por prioridad (MANTENER para compatibilidad)
  const getSortedTransfers = useCallback(() => {
    return [...pendingTransfers].sort((a, b) => {
      // Ordenar por tiempo de espera descendente (más urgentes primero)
      return (b.hoursWaiting || 0) - (a.hoursWaiting || 0);
    });
  }, [pendingTransfers]);

  // Función para obtener estadísticas de transferencias (MANTENER para compatibilidad)
  const getTransferStats = useCallback(() => {
    const total = pendingTransfers.length;
    const critical = pendingTransfers.filter(t => (t.hoursWaiting || 0) > 24).length;
    const high = pendingTransfers.filter(t => (t.hoursWaiting || 0) > 12 && (t.hoursWaiting || 0) <= 24).length;
    const totalAmount = pendingTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;
    const avgWaitingTime = total > 0 
      ? pendingTransfers.reduce((sum, t) => sum + (t.hoursWaiting || 0), 0) / total 
      : 0;

    return {
      total,
      critical,
      high,
      totalAmount,
      avgAmount,
      avgWaitingTime
    };
  }, [pendingTransfers]);

  // Función para debug - obtener todos los datos como en el test (MANTENER)
  const debugTransferData = useCallback(async () => {
    try {
      console.log('🔍 useTransfers: Obteniendo datos de debug...');
      
      const transferResponse = await apiService.paymentService.getPendingTransfers();
      
      console.log('📊 Debug Transfers:', {
        response: transferResponse,
        currentState: {
          pendingCount: pendingTransfers.length,
          stats: getTransferStats(),
          processed: Array.from(processingIds),
          avgHours: transferStats.avgHours,
          priorityDistribution: getPriorityDistribution()
        }
      });
      
      return {
        response: transferResponse,
        currentState: {
          pendingCount: pendingTransfers.length,
          stats: getTransferStats(),
          avgHours: transferStats.avgHours,
          priorityDistribution: getPriorityDistribution()
        }
      };
      
    } catch (error) {
      console.error('❌ Error en debug transfers:', error);
      return { error: error.message };
    }
  }, [pendingTransfers, getTransferStats, processingIds, transferStats.avgHours, getPriorityDistribution]);

  // Efecto inicial de carga
  useEffect(() => {
    loadPendingTransfers();
  }, [loadPendingTransfers]);

  return {
    // Estados principales
    pendingTransfers,
    transferStats,
    loading,
    processingIds,
    
    // Estados de filtros
    searchTerm,
    transferViewMode,
    transferSortBy,
    transferPriorityFilter,
    
    // Funciones principales
    loadPendingTransfers,
    handleValidateTransfer,
    handleApproveTransfer,
    handleRejectTransfer,
    
    // Funciones de filtros
    getFilteredTransfers,
    setSearchTerm,
    setTransferViewMode,
    setTransferSortBy,
    setTransferPriorityFilter,
    
    // Utilidades MEJORADAS
    isTransferProcessing,
    getProcessingType,
    getTransferPriority,
    getTransferPriorityConfig,
    
    // NUEVAS funciones de análisis
    getPriorityDistribution,
    getCriticalTransfers,
    getUrgencySummary,
    calculateHoursWaiting,
    
    // Funciones de compatibilidad (MANTENER)
    getSortedTransfers,
    getTransferStats,
    
    // Debug
    debugTransferData
  };
};

export default useTransfers;

// Este hook encapsula toda la lógica relacionada con transferencias bancarias
// Maneja la validación, aprobación y rechazo de transferencias pendientes
// Incluye utilidades para priorización y estadísticas de transferencias