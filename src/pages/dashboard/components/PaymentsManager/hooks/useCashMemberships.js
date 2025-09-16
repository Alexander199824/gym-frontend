// src/pages/dashboard/components/PaymentsManager/hooks/useCashMemberships.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de membresías en efectivo
// Incluye activación, filtros, estadísticas y gestión de estados de procesamiento

// src/pages/dashboard/components/PaymentsManager/hooks/useCashMemberships.js
// ACTUALIZADO: Para usar exactamente la misma lógica que el test funcional

import { useState, useEffect, useCallback } from 'react';
import apiService from '../../../../../services/apiService';

const useCashMemberships = (onSave) => {
  // Estados principales de membresías en efectivo
  const [pendingCashMemberships, setPendingCashMemberships] = useState([]);
  const [cashMembershipStats, setCashMembershipStats] = useState({
    total: 0,
    old: 0,
    totalAmount: 0,
    avgAmount: 0,
    avgHours: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Estados de procesamiento
  const [processingIds, setProcessingIds] = useState(new Set());
  const [cancellingIds, setCancellingIds] = useState(new Set());
  
  // Estados de filtros específicos para efectivo
  const [searchTerm, setSearchTerm] = useState('');
  const [cashViewMode, setCashViewMode] = useState('grid');
  const [cashSortBy, setCashSortBy] = useState('waiting_time');
  const [cashPriorityFilter, setCashPriorityFilter] = useState('all');

  // Función principal para cargar membresías en efectivo pendientes
  const loadPendingCashMemberships = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await apiService.paymentService.getPendingCashPayments({
        search: searchTerm,
        sortBy: cashSortBy,
        priority: cashPriorityFilter === 'all' ? undefined : cashPriorityFilter
      });
      
      if (response?.success && response.data) {
        const payments = response.data.payments || [];
        
        // Procesar pagos en efectivo para agregar campos necesarios
        const processedPayments = payments.map(payment => ({
          ...payment,
          id: payment.id || payment.paymentId,
          price: payment.amount || payment.price || 0,
          user: payment.user || payment.client || {
            name: payment.clientName || payment.client?.name || 'Cliente Anónimo',
            email: payment.client?.email || payment.user?.email || '',
            phone: payment.client?.phone || payment.user?.phone || ''
          },
          hoursWaiting: payment.hoursWaiting || 0,
          paymentType: payment.paymentType || 'membership',
          status: payment.status || 'pending',
          priority: payment.priority || getPriorityByHours(payment.hoursWaiting || 0)
        }));
        
        setPendingCashMemberships(processedPayments);
        
        // Calcular estadísticas
        const calculatedStats = calculateCashStats(processedPayments);
        setCashMembershipStats(calculatedStats);
        
      } else {
        setPendingCashMemberships([]);
        setCashMembershipStats({
          total: 0,
          old: 0,
          totalAmount: 0,
          avgAmount: 0,
          avgHours: 0
        });
      }
      
    } catch (error) {
      console.error('Error cargando pagos en efectivo:', error);
      setPendingCashMemberships([]);
      setCashMembershipStats({
        total: 0,
        old: 0,
        totalAmount: 0,
        avgAmount: 0,
        avgHours: 0
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, cashSortBy, cashPriorityFilter]);

  // Función para calcular estadísticas de efectivo
  const calculateCashStats = useCallback((payments) => {
    const total = payments.length;
    const old = payments.filter(p => (p.hoursWaiting || 0) > 24).length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.price || p.amount || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;
    const avgHours = total > 0 ? 
      payments.reduce((sum, p) => sum + (p.hoursWaiting || 0), 0) / total : 0;

    return {
      total,
      old,
      totalAmount,
      avgAmount,
      avgHours
    };
  }, []);

  // FUNCIÓN PRINCIPAL: Activar membresía en efectivo - EXACTAMENTE COMO EL TEST
  const handleActivateCashMembership = useCallback(async (paymentId, showSuccess, showError, formatCurrency) => {
    if (processingIds.has(paymentId) || cancellingIds.has(paymentId)) {
      return;
    }

    const paymentData = pendingCashMemberships.find(p => p.id === paymentId);
    
    if (!paymentData) {
      showError && showError('No se encontró el pago');
      return;
    }
    
    const clientName = paymentData?.user?.name || 'cliente';
    const amount = paymentData?.price || paymentData?.amount || 0;
    
    // Lógica exacta del test - CONFIRMAR sin pedir razón
    const confirmed = window.confirm(
      `¿Confirmar que recibiste Q${amount} en EFECTIVO de ${clientName}?\n\n✅ Se enviará email de confirmación automáticamente`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      // MISMO ENDPOINT Y LÓGICA QUE EL TEST
      await apiService.paymentService.activateCashMembership(paymentId);
      
      const successMessage = `¡Pago CONFIRMADO! ${clientName} - Q${amount} → Status: completed + Email automático`;
      showSuccess && showSuccess(successMessage);
      
      // Remover de la lista local inmediatamente
      setPendingCashMemberships(prev => prev.filter(p => p.id !== paymentId));
      
      // Recargar datos completos
      await loadPendingCashMemberships();
      
      if (onSave) {
        onSave({ 
          type: 'cash_membership_activation',
          paymentId,
          clientName,
          amount,
          action: 'confirmed'
        });
      }
      
    } catch (error) {
      console.error('Error activando membresía:', error);
      const errorMessage = 'Error al confirmar pago en efectivo: ' + (error.message || 'Error desconocido');
      showError && showError(errorMessage);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  }, [processingIds, cancellingIds, pendingCashMemberships, loadPendingCashMemberships, onSave]);

  // FUNCIÓN PRINCIPAL: Cancelar pago en efectivo - EXACTAMENTE COMO EL TEST
  const handleCancelCashMembership = useCallback(async (paymentId, showSuccess, showError, formatCurrency) => {
    if (cancellingIds.has(paymentId) || processingIds.has(paymentId)) {
      return;
    }

    const paymentData = pendingCashMemberships.find(p => p.id === paymentId);
    
    if (!paymentData) {
      showError && showError('No se encontró el pago');
      return;
    }
    
    const clientName = paymentData?.user?.name || 'cliente';
    const amount = paymentData?.price || paymentData?.amount || 0;
    
    // Lógica exacta del test - Pedir razón obligatoria
    const reason = window.prompt(
      `Razón DETALLADA de anulación (OBLIGATORIA para email al cliente):\n\nEjemplos: "Cliente no se presentó a pagar", "Cliente canceló", "Error en el registro"`
    );
    
    if (!reason || !reason.trim()) {
      showError && showError('La razón de anulación es obligatoria');
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmar ANULACIÓN del pago de ${clientName} por Q${amount}?\n\nRazón: "${reason.trim()}"\n\n❌ Se enviará email de anulación automáticamente`
    );
    
    if (!confirmed) return;

    try {
      setCancellingIds(prev => new Set([...prev, paymentId]));
      
      // MISMO ENDPOINT Y LÓGICA QUE EL TEST
      await apiService.paymentService.cancelCashPayment(paymentId, reason.trim());
      
      const successMessage = `Pago ANULADO: ${clientName} → Status: cancelled + Email automático con motivo`;
      showSuccess && showSuccess(successMessage);
      
      // Remover de la lista local inmediatamente
      setPendingCashMemberships(prev => prev.filter(p => p.id !== paymentId));
      
      // Recargar datos completos
      await loadPendingCashMemberships();
      
      if (onSave) {
        onSave({ 
          type: 'cash_membership_cancellation',
          paymentId,
          clientName,
          amount,
          reason: reason.trim(),
          action: 'cancelled'
        });
      }
      
    } catch (error) {
      console.error('Error cancelando pago:', error);
      const errorMessage = 'Error al anular pago: ' + (error.message || 'Error desconocido');
      showError && showError(errorMessage);
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  }, [cancellingIds, processingIds, pendingCashMemberships, loadPendingCashMemberships, onSave]);

  // Función para filtrar y ordenar pagos en efectivo
  const getFilteredCashMemberships = useCallback(() => {
    let filtered = [...pendingCashMemberships];

    // Filtrar por prioridad
    if (cashPriorityFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const priority = getCashMembershipPriority(payment.hoursWaiting || 0);
        return priority === cashPriorityFilter;
      });
    }

    // Filtrar por búsqueda
    if (searchTerm && searchTerm.length >= 2) {
      const searchText = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => {
        const clientInfo = `${payment.user?.name || ''} ${payment.user?.email || ''}`.toLowerCase();
        return clientInfo.includes(searchText);
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (cashSortBy) {
        case 'waiting_time':
          return (b.hoursWaiting || 0) - (a.hoursWaiting || 0);
        case 'amount':
          return (b.price || b.amount || 0) - (a.price || a.amount || 0);
        case 'name':
          return (a.user?.name || '').localeCompare(b.user?.name || '');
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [pendingCashMemberships, cashPriorityFilter, searchTerm, cashSortBy]);

  // Función para determinar la prioridad de un pago en efectivo
  const getCashMembershipPriority = useCallback((hoursWaiting) => {
    if (hoursWaiting > 48) {
      return 'very_old';
    } else if (hoursWaiting > 24) {
      return 'old';
    } else {
      return 'normal';
    }
  }, []);

  // Función auxiliar para calcular prioridad por horas
  const getPriorityByHours = (hours) => {
    if (hours > 48) return 'very_old';
    if (hours > 24) return 'old';
    return 'normal';
  };

  // Función para obtener si un pago es candidato a cancelar
  const isCandidateForCancellation = useCallback((payment) => {
    const hoursWaiting = payment.hoursWaiting || 0;
    return hoursWaiting > 24;
  }, []);

  // Función para obtener el estado de procesamiento
  const isMembershipProcessing = useCallback((paymentId) => {
    return processingIds.has(paymentId) || cancellingIds.has(paymentId);
  }, [processingIds, cancellingIds]);

  // Función para obtener el tipo de procesamiento
  const getProcessingType = useCallback((paymentId) => {
    if (processingIds.has(paymentId)) return 'activating';
    if (cancellingIds.has(paymentId)) return 'cancelling';
    return null;
  }, [processingIds, cancellingIds]);

  // Efecto inicial de carga
  useEffect(() => {
    loadPendingCashMemberships();
  }, [loadPendingCashMemberships]);

  return {
    // Estados principales
    pendingCashMemberships,
    cashMembershipStats,
    loading,
    processingIds,
    cancellingIds,
    
    // Estados de filtros
    searchTerm,
    cashViewMode,
    cashSortBy,
    cashPriorityFilter,
    
    // Funciones principales - USA LA LÓGICA EXACTA DEL TEST
    loadPendingCashMemberships,
    handleActivateCashMembership,   // CONFIRMAR automático
    handleCancelCashMembership,     // ANULAR con razón obligatoria
    
    // Funciones de filtros
    getFilteredCashMemberships,
    setSearchTerm,
    setCashViewMode,
    setCashSortBy,
    setCashPriorityFilter,
    
    // Utilidades
    getCashMembershipPriority,
    isCandidateForCancellation,
    isMembershipProcessing,
    getProcessingType
  };
};

export default useCashMemberships;

// Este hook encapsula toda la lógica específica de membresías en efectivo
// Maneja la carga, activación, filtros y estadísticas de pagos en efectivo
// Incluye gestión de estados de procesamiento para evitar doble activación