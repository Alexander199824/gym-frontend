// Autor: Alexander Echeverria
// src/hooks/usePayments.js
// FUNCIÓN: Hook personalizado para gestión completa de pagos y autorizaciones
// USO: Centraliza lógica de pagos para componentes

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import apiService from '../services/apiService';

/**
 * Hook personalizado para gestión completa de pagos
 * Incluye transferencias, efectivo, dashboard y estadísticas
 */
export const usePayments = (options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    loadOnMount = true,
    enableCache = true
  } = options;

  const { user, hasPermission } = useAuth();
  const { showSuccess, showError } = useApp();

  // Estados principales
  const [dashboard, setDashboard] = useState({
    data: {},
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [transfers, setTransfers] = useState({
    data: [],
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [cashMemberships, setCashMemberships] = useState({
    data: [],
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [payments, setPayments] = useState({
    data: [],
    pagination: {},
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [statistics, setStatistics] = useState({
    data: {},
    loading: false,
    error: null,
    lastUpdated: null
  });

  // Estados de procesamiento
  const [processingItems, setProcessingItems] = useState(new Set());
  
  // Referencias para intervalos
  const intervalRef = useRef(null);

  // CARGAR DASHBOARD DE PAGOS PENDIENTES
  const loadDashboard = useCallback(async (silent = false) => {
    if (!hasPermission('view_payments_dashboard')) {
      setDashboard(prev => ({ 
        ...prev, 
        error: 'Sin permisos para ver dashboard de pagos',
        loading: false 
      }));
      return;
    }

    if (!silent) {
      setDashboard(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = enableCache 
        ? await apiService.getPendingPaymentsDashboardWithCache()
        : await apiService.getPendingPaymentsDashboard();

      setDashboard({
        data: response.data || {},
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      return response.data;
    } catch (error) {
      console.error('Error al cargar dashboard de pagos:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar dashboard';
      
      setDashboard(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      if (!silent) {
        showError(errorMessage);
      }
      throw error;
    }
  }, [hasPermission, enableCache, showError]);

  // CARGAR TRANSFERENCIAS PENDIENTES
  const loadTransfers = useCallback(async (hoursFilter = null, silent = false) => {
    if (!hasPermission('validate_transfers')) {
      setTransfers(prev => ({ 
        ...prev, 
        error: 'Sin permisos para ver transferencias',
        loading: false 
      }));
      return;
    }

    if (!silent) {
      setTransfers(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = await apiService.getPendingTransfersDetailed(hoursFilter);
      
      setTransfers({
        data: response.data?.transfers || [],
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      return response.data?.transfers || [];
    } catch (error) {
      console.error('Error al cargar transferencias:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar transferencias';
      
      setTransfers(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      if (!silent) {
        showError(errorMessage);
      }
      throw error;
    }
  }, [hasPermission, showError]);

  // CARGAR MEMBRESÍAS EN EFECTIVO
  const loadCashMemberships = useCallback(async (silent = false) => {
    if (!hasPermission('activate_cash_memberships') && !hasPermission('manage_payments')) {
      setCashMemberships(prev => ({ 
        ...prev, 
        error: 'Sin permisos para ver membresías en efectivo',
        loading: false 
      }));
      return;
    }

    if (!silent) {
      setCashMemberships(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = await apiService.getPendingCashMemberships();
      
      setCashMemberships({
        data: response.data?.memberships || [],
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      return response.data?.memberships || [];
    } catch (error) {
      console.error('Error al cargar membresías en efectivo:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar membresías en efectivo';
      
      setCashMemberships(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      if (!silent) {
        showError(errorMessage);
      }
      throw error;
    }
  }, [hasPermission, showError]);

  // CARGAR HISTORIAL DE PAGOS
  const loadPayments = useCallback(async (params = {}, silent = false) => {
    if (!hasPermission('view_payments')) {
      setPayments(prev => ({ 
        ...prev, 
        error: 'Sin permisos para ver historial de pagos',
        loading: false 
      }));
      return;
    }

    if (!silent) {
      setPayments(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = await apiService.get('/payments', { params });
      const paymentData = response.data || response;
      
      setPayments({
        data: paymentData.payments || paymentData,
        pagination: paymentData.pagination || {},
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      return paymentData;
    } catch (error) {
      console.error('Error al cargar historial de pagos:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar historial de pagos';
      
      setPayments(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      if (!silent) {
        showError(errorMessage);
      }
      throw error;
    }
  }, [hasPermission, showError]);

  // CARGAR ESTADÍSTICAS
  const loadStatistics = useCallback(async (dateRange = {}, silent = false) => {
    if (!silent) {
      setStatistics(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = await apiService.getPaymentStatistics(dateRange);
      
      setStatistics({
        data: response.data || response,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      return response.data || response;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar estadísticas';
      
      setStatistics(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      if (!silent) {
        showError(errorMessage);
      }
      throw error;
    }
  }, [showError]);

  // VALIDAR TRANSFERENCIA
  const validateTransfer = useCallback(async (transferId, approved, notes = '') => {
    if (!hasPermission('validate_transfers')) {
      showError('Sin permisos para validar transferencias');
      return false;
    }

    if (processingItems.has(transferId)) {
      console.warn('Transferencia ya está siendo procesada:', transferId);
      return false;
    }

    try {
      setProcessingItems(prev => new Set([...prev, transferId]));

      const result = await apiService.validateTransfer(transferId, approved, notes);

      // Actualizar datos localmente
      setTransfers(prev => ({
        ...prev,
        data: prev.data.filter(t => t.id !== transferId)
      }));

      // Invalidar cache y recargar dashboard
      apiService.invalidatePaymentCache();
      loadDashboard(true);

      const message = approved 
        ? 'Transferencia aprobada exitosamente' 
        : 'Transferencia rechazada';
      showSuccess(message);

      return result;
    } catch (error) {
      console.error('Error al validar transferencia:', error);
      const errorMessage = error.response?.data?.message || 
        (approved ? 'Error al aprobar transferencia' : 'Error al rechazar transferencia');
      showError(errorMessage);
      return false;
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(transferId);
        return newSet;
      });
    }
  }, [hasPermission, processingItems, showError, showSuccess, loadDashboard]);

  // ACTIVAR MEMBRESÍA EN EFECTIVO
  const activateCashMembership = useCallback(async (membershipId) => {
    if (!hasPermission('activate_cash_memberships') && !hasPermission('manage_payments')) {
      showError('Sin permisos para activar membresías en efectivo');
      return false;
    }

    if (processingItems.has(membershipId)) {
      console.warn('Membresía ya está siendo procesada:', membershipId);
      return false;
    }

    try {
      setProcessingItems(prev => new Set([...prev, membershipId]));

      const result = await apiService.activateCashMembership(membershipId);

      // Actualizar datos localmente
      setCashMemberships(prev => ({
        ...prev,
        data: prev.data.filter(m => m.id !== membershipId)
      }));

      // Invalidar cache y recargar dashboard
      apiService.invalidatePaymentCache();
      loadDashboard(true);
      loadStatistics({}, true);

      showSuccess(`Membresía activada exitosamente`);
      return result;
    } catch (error) {
      console.error('Error al activar membresía:', error);
      const errorMessage = error.response?.data?.message || 'Error al activar membresía en efectivo';
      showError(errorMessage);
      return false;
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  }, [hasPermission, processingItems, showError, showSuccess, loadDashboard, loadStatistics]);

  // CREAR PAGO
  const createPayment = useCallback(async (paymentData) => {
    if (!hasPermission('create_payments')) {
      showError('Sin permisos para crear pagos');
      return false;
    }

    try {
      // Validar datos
      const validation = apiService.validatePaymentData(paymentData);
      if (!validation.isValid) {
        showError(validation.errors[0]);
        return false;
      }

      // Formatear datos
      const formattedData = apiService.formatPaymentDataForAPI(paymentData);

      const result = await apiService.post('/payments', formattedData);

      // Recargar datos
      loadPayments({}, true);
      loadStatistics({}, true);
      loadDashboard(true);

      showSuccess('Pago registrado exitosamente');
      return result;
    } catch (error) {
      console.error('Error al crear pago:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear pago';
      showError(errorMessage);
      return false;
    }
  }, [hasPermission, showError, showSuccess, loadPayments, loadStatistics, loadDashboard]);

  // CARGAR TODOS LOS DATOS
  const loadAllData = useCallback(async (silent = true) => {
    const promises = [];

    if (hasPermission('view_payments_dashboard')) {
      promises.push(loadDashboard(silent));
    }

    if (hasPermission('validate_transfers')) {
      promises.push(loadTransfers(null, silent));
    }

    if (hasPermission('activate_cash_memberships') || hasPermission('manage_payments')) {
      promises.push(loadCashMemberships(silent));
    }

    promises.push(loadStatistics({}, silent));

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error al cargar datos de pagos:', error);
    }
  }, [hasPermission, loadDashboard, loadTransfers, loadCashMemberships, loadStatistics]);

  // OBTENER ESTADÍSTICAS COMBINADAS
  const getCombinedStats = useCallback(() => {
    const dashboardStats = dashboard.data.summary || {};
    const transfersList = transfers.data || [];
    const cashList = cashMemberships.data || [];
    const paymentStats = statistics.data || {};

    return {
      // Del dashboard
      pendingTransfers: {
        count: dashboardStats.pendingTransfers?.count || 0,
        totalAmount: dashboardStats.pendingTransfers?.totalAmount || 0,
        oldestHours: dashboardStats.pendingTransfers?.oldestHours || 0
      },
      pendingCashMemberships: {
        count: dashboardStats.pendingCashMemberships?.count || 0,
        totalAmount: dashboardStats.pendingCashMemberships?.totalAmount || 0
      },
      todayValidations: {
        approved: dashboardStats.todayValidations?.approved || 0,
        rejected: dashboardStats.todayValidations?.rejected || 0,
        total: (dashboardStats.todayValidations?.approved || 0) + (dashboardStats.todayValidations?.rejected || 0)
      },
      
      // De las listas locales
      urgentTransfers: transfersList.filter(t => {
        const config = apiService.getTransferPriorityConfig(t.hoursWaiting);
        return config.priority === 'critical';
      }).length,
      urgentCashMemberships: cashList.filter(m => (m.hoursWaiting || 0) > 4).length,
      
      // De estadísticas generales
      totalIncome: paymentStats.totalIncome || 0,
      totalPayments: paymentStats.totalPayments || 0,
      averagePayment: paymentStats.averagePayment || 0,
      
      // Calculadas
      totalPendingAmount: (dashboardStats.pendingTransfers?.totalAmount || 0) + 
                         (dashboardStats.pendingCashMemberships?.totalAmount || 0),
      totalUrgentItems: 0 // Se calculará dinámicamente
    };
  }, [dashboard.data, transfers.data, cashMemberships.data, statistics.data]);

  // CONFIGURAR AUTO-REFRESH
  useEffect(() => {
    if (loadOnMount) {
      loadAllData(false);
    }

    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        loadAllData(true);
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, loadOnMount, loadAllData]);

  // LIMPIAR INTERVALOS AL DESMONTAR
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ESTADOS DERIVADOS
  const isLoading = dashboard.loading || transfers.loading || cashMemberships.loading || 
                   payments.loading || statistics.loading;
  
  const hasErrors = dashboard.error || transfers.error || cashMemberships.error || 
                   payments.error || statistics.error;

  const combinedStats = getCombinedStats();

  return {
    // Estados de datos
    dashboard: dashboard.data,
    transfers: transfers.data,
    cashMemberships: cashMemberships.data,
    payments: payments.data,
    paymentsPagination: payments.pagination,
    statistics: statistics.data,
    combinedStats,

    // Estados de carga
    loading: {
      dashboard: dashboard.loading,
      transfers: transfers.loading,
      cashMemberships: cashMemberships.loading,
      payments: payments.loading,
      statistics: statistics.loading,
      any: isLoading
    },

    // Estados de error
    errors: {
      dashboard: dashboard.error,
      transfers: transfers.error,
      cashMemberships: cashMemberships.error,
      payments: payments.error,
      statistics: statistics.error,
      any: hasErrors
    },

    // Timestamps de última actualización
    lastUpdated: {
      dashboard: dashboard.lastUpdated,
      transfers: transfers.lastUpdated,
      cashMemberships: cashMemberships.lastUpdated,
      payments: payments.lastUpdated,
      statistics: statistics.lastUpdated
    },

    // Estados de procesamiento
    processingItems,
    isProcessing: (id) => processingItems.has(id),

    // Funciones de carga
    loadDashboard,
    loadTransfers,
    loadCashMemberships,
    loadPayments,
    loadStatistics,
    loadAllData,

    // Funciones de acción
    validateTransfer,
    activateCashMembership,
    createPayment,

    // Utilidades
    refreshAll: () => loadAllData(false),
    clearErrors: () => {
      setDashboard(prev => ({ ...prev, error: null }));
      setTransfers(prev => ({ ...prev, error: null }));
      setCashMemberships(prev => ({ ...prev, error: null }));
      setPayments(prev => ({ ...prev, error: null }));
      setStatistics(prev => ({ ...prev, error: null }));
    },

    // Configuraciones de helpers
    getTransferPriorityConfig: apiService.getTransferPriorityConfig,
    getPaymentMethodConfig: apiService.getPaymentMethodConfig,
    getPaymentStatusConfig: apiService.getPaymentStatusConfig,
    validatePaymentData: apiService.validatePaymentData,
    formatPaymentDataForAPI: apiService.formatPaymentDataForAPI
  };
};

/**
 * Hook simplificado para estadísticas de pagos
 */
export const usePaymentStats = (dateRange = {}, autoRefresh = false) => {
  const [stats, setStats] = useState({
    data: {},
    loading: true,
    error: null
  });

  const loadStats = useCallback(async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiService.getPaymentStatistics(dateRange);
      setStats({
        data: response.data || response,
        loading: false,
        error: null
      });
    } catch (error) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error al cargar estadísticas'
      }));
    }
  }, [dateRange]);

  useEffect(() => {
    loadStats();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadStats, 60000); // Cada minuto
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadStats, autoRefresh]);

  return {
    stats: stats.data,
    loading: stats.loading,
    error: stats.error,
    reload: loadStats
  };
};

/**
 * Hook para gestión simplificada de transferencias
 */
export const useTransferValidation = (autoRefresh = true) => {
  const { transfers, loading, validateTransfer, loadTransfers, isProcessing } = usePayments({
    autoRefresh,
    loadOnMount: true
  });

  const getFilteredTransfers = useCallback((priorityFilter = 'all') => {
    if (priorityFilter === 'all') return transfers;
    
    return transfers.filter(transfer => {
      const priority = apiService.getTransferPriorityConfig(transfer.hoursWaiting).priority;
      return priority === priorityFilter;
    });
  }, [transfers]);

  return {
    transfers,
    loading: loading.transfers,
    validateTransfer,
    reload: loadTransfers,
    isProcessing,
    getFilteredTransfers,
    totalCount: transfers.length,
    criticalCount: transfers.filter(t => 
      apiService.getTransferPriorityConfig(t.hoursWaiting).priority === 'critical'
    ).length
  };
};

/**
 * Hook para gestión simplificada de membresías en efectivo
 */
export const useCashMemberships = (autoRefresh = true) => {
  const { 
    cashMemberships, 
    loading, 
    activateCashMembership, 
    loadCashMemberships, 
    isProcessing 
  } = usePayments({
    autoRefresh,
    loadOnMount: true
  });

  const urgentMemberships = cashMemberships.filter(m => (m.hoursWaiting || 0) > 4);
  const totalAmount = cashMemberships.reduce((sum, m) => sum + (m.price || 0), 0);

  return {
    memberships: cashMemberships,
    loading: loading.cashMemberships,
    activateMembership: activateCashMembership,
    reload: loadCashMemberships,
    isProcessing,
    totalCount: cashMemberships.length,
    urgentCount: urgentMemberships.length,
    totalAmount
  };
};

export default usePayments;