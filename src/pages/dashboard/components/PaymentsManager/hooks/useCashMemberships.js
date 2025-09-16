// src/pages/dashboard/components/PaymentsManager/hooks/useCashMemberships.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de membresías en efectivo
// Incluye activación, filtros, estadísticas y gestión de estados de procesamiento

// src/pages/dashboard/components/PaymentsManager/hooks/useCashMemberships.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de membresías en efectivo
// Incluye activación, filtros, estadísticas y gestión de estados de procesamiento

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
      
      const response = await apiService.paymentService.getPendingCashMemberships({
        search: searchTerm,
        sortBy: cashSortBy,
        priority: cashPriorityFilter === 'all' ? undefined : cashPriorityFilter
      });
      
      if (response?.success && response.data) {
        const memberships = response.data.memberships || [];
        
        // Procesar membresías para agregar campos necesarios
        const processedMemberships = memberships.map(membership => ({
          ...membership,
          id: membership.id || membership.membershipId,
          price: membership.amount || membership.price || 0,
          user: membership.user || {
            name: membership.clientName || membership.client?.name || 'Cliente Anónimo',
            email: membership.client?.email || membership.user?.email || '',
            phone: membership.client?.phone || membership.user?.phone || ''
          },
          plan: membership.plan || membership.membership || {
            name: membership.planName || 'Plan personalizado'
          },
          hoursWaiting: membership.hoursWaiting || 0,
          paymentType: membership.paymentType || 'membership',
          status: membership.status || 'pending',
          canActivate: true,
          canCancel: true
        }));
        
        setPendingCashMemberships(processedMemberships);
        
        // Calcular estadísticas
        const calculatedStats = calculateCashStats(processedMemberships);
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
      console.error('Error cargando membresías en efectivo:', error);
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
  const calculateCashStats = useCallback((memberships) => {
    const total = memberships.length;
    const old = memberships.filter(m => (m.hoursWaiting || 0) > 24).length;
    const totalAmount = memberships.reduce((sum, m) => sum + (m.price || m.amount || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;
    const avgHours = total > 0 ? 
      memberships.reduce((sum, m) => sum + (m.hoursWaiting || 0), 0) / total : 0;

    return {
      total,
      old,
      totalAmount,
      avgAmount,
      avgHours
    };
  }, []);

  // Función para activar una membresía en efectivo
  const handleActivateCashMembership = useCallback(async (membershipId, showSuccess, showError, formatCurrency) => {
    if (processingIds.has(membershipId) || cancellingIds.has(membershipId)) {
      return;
    }

    const membershipData = pendingCashMemberships.find(m => m.id === membershipId);
    
    if (!membershipData) {
      showError && showError('No se encontró la membresía');
      return;
    }
    
    const clientName = membershipData?.user?.name || 'cliente';
    const amount = membershipData?.price || 0;
    
    const confirmed = window.confirm(
      `¿Confirmar que recibiste ${formatCurrency ? formatCurrency(amount) : `Q${amount}`} en efectivo de ${clientName}?`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setProcessingIds(prev => new Set([...prev, membershipId]));
      
      await apiService.paymentService.activateCashMembership(membershipId, {
        notes: `Pago en efectivo recibido de ${clientName}`,
        amount: amount,
        confirmedBy: 'admin'
      });
      
      const successMessage = `¡Membresía activada! Pago de ${formatCurrency ? formatCurrency(amount) : `Q${amount}`} registrado correctamente.`;
      showSuccess && showSuccess(successMessage);
      
      // Remover de la lista local inmediatamente
      setPendingCashMemberships(prev => prev.filter(m => m.id !== membershipId));
      
      // Recargar datos completos
      await loadPendingCashMemberships();
      
      if (onSave) {
        onSave({ 
          type: 'cash_membership_activation',
          membershipId,
          clientName,
          amount
        });
      }
      
    } catch (error) {
      console.error('Error activando membresía:', error);
      const errorMessage = 'Error al activar membresía en efectivo: ' + (error.message || 'Error desconocido');
      showError && showError(errorMessage);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  }, [processingIds, cancellingIds, pendingCashMemberships, loadPendingCashMemberships, onSave]);

  // Función para cancelar una membresía en efectivo
  const handleCancelCashMembership = useCallback(async (membershipId, showSuccess, showError, formatCurrency) => {
    if (cancellingIds.has(membershipId) || processingIds.has(membershipId)) {
      return;
    }

    const membershipData = pendingCashMemberships.find(m => m.id === membershipId);
    
    if (!membershipData) {
      showError && showError('No se encontró la membresía');
      return;
    }
    
    const clientName = membershipData?.user?.name || 'cliente';
    const amount = membershipData?.price || 0;
    
    const confirmed = window.confirm(
      `¿Confirmar que quieres CANCELAR la membresía de ${clientName} por ${formatCurrency ? formatCurrency(amount) : `Q${amount}`}?\n\nEsto marcará que el cliente nunca llegó a pagar.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setCancellingIds(prev => new Set([...prev, membershipId]));
      
      // Intentar usar endpoint específico si existe, sino usar el genérico
      try {
        await apiService.paymentService.cancelCashMembership(membershipId, {
          reason: 'Cliente no llegó a realizar el pago',
          notes: `Membresía cancelada - Cliente ${clientName} no llegó a pagar`,
          cancelledBy: 'admin'
        });
      } catch (error) {
        await apiService.paymentService.cancelCashPayment(membershipId, {
          reason: 'Cliente no llegó a realizar el pago',
          notes: `Membresía cancelada - Cliente ${clientName} no llegó a pagar`,
          cancelledBy: 'admin'
        });
      }
      
      const successMessage = `Membresía de ${clientName} cancelada correctamente.`;
      showSuccess && showSuccess(successMessage);
      
      // Remover de la lista local inmediatamente
      setPendingCashMemberships(prev => prev.filter(m => m.id !== membershipId));
      
      // Recargar datos completos
      await loadPendingCashMemberships();
      
      if (onSave) {
        onSave({ 
          type: 'cash_membership_cancellation',
          membershipId,
          clientName,
          amount
        });
      }
      
    } catch (error) {
      console.error('Error cancelando membresía:', error);
      const errorMessage = 'Error al cancelar membresía: ' + (error.message || 'Error desconocido');
      showError && showError(errorMessage);
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  }, [cancellingIds, processingIds, pendingCashMemberships, loadPendingCashMemberships, onSave]);

  // Función para filtrar y ordenar membresías en efectivo
  const getFilteredCashMemberships = useCallback(() => {
    let filtered = [...pendingCashMemberships];

    // Filtrar por prioridad
    if (cashPriorityFilter !== 'all') {
      filtered = filtered.filter(membership => {
        const priority = getCashMembershipPriority(membership.hoursWaiting || 0);
        return priority === cashPriorityFilter;
      });
    }

    // Filtrar por búsqueda
    if (searchTerm && searchTerm.length >= 2) {
      const searchText = searchTerm.toLowerCase();
      filtered = filtered.filter(membership => {
        const clientInfo = `${membership.user?.name || ''} ${membership.user?.email || ''} ${membership.plan?.name || ''}`.toLowerCase();
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

  // Función para determinar la prioridad de una membresía en efectivo
  const getCashMembershipPriority = useCallback((hoursWaiting) => {
    if (hoursWaiting > 48) {
      return 'very_old';
    } else if (hoursWaiting > 24) {
      return 'old';
    } else {
      return 'normal';
    }
  }, []);

  // Función para obtener configuración de prioridad
  const getCashMembershipPriorityConfig = useCallback((hoursWaiting) => {
    if (hoursWaiting > 48) {
      return {
        priority: 'very_old',
        color: 'red',
        label: 'Muy Antiguo',
        description: 'Más de 2 días - Considerar cancelar',
        canCancel: true
      };
    } else if (hoursWaiting > 24) {
      return {
        priority: 'old',
        color: 'orange',
        label: 'Antiguo',
        description: 'Más de 1 día - Evaluar cancelar',
        canCancel: true
      };
    } else {
      return {
        priority: 'normal',
        color: 'green',
        label: 'Esperando',
        description: 'Cliente puede llegar cuando guste',
        canCancel: false
      };
    }
  }, []);

  // Función para obtener si una membresía es candidata a cancelar
  const isCandidateForCancellation = useCallback((membership) => {
    const hoursWaiting = membership.hoursWaiting || 0;
    return hoursWaiting > 24;
  }, []);

  // Función para obtener el estado de procesamiento
  const isMembershipProcessing = useCallback((membershipId) => {
    return processingIds.has(membershipId) || cancellingIds.has(membershipId);
  }, [processingIds, cancellingIds]);

  // Función para obtener el tipo de procesamiento
  const getProcessingType = useCallback((membershipId) => {
    if (processingIds.has(membershipId)) return 'activating';
    if (cancellingIds.has(membershipId)) return 'cancelling';
    return null;
  }, [processingIds, cancellingIds]);

  // Efecto para recargar cuando cambien los filtros específicos de efectivo
  useEffect(() => {
    loadPendingCashMemberships();
  }, [loadPendingCashMemberships]);

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
    
    // Funciones principales
    loadPendingCashMemberships,
    handleActivateCashMembership,
    handleCancelCashMembership,
    
    // Funciones de filtros
    getFilteredCashMemberships,
    setSearchTerm,
    setCashViewMode,
    setCashSortBy,
    setCashPriorityFilter,
    
    // Utilidades
    getCashMembershipPriority,
    getCashMembershipPriorityConfig,
    isCandidateForCancellation,
    isMembershipProcessing,
    getProcessingType
  };
};

export default useCashMemberships;

// Este hook encapsula toda la lógica específica de membresías en efectivo
// Maneja la carga, activación, filtros y estadísticas de pagos en efectivo
// Incluye gestión de estados de procesamiento para evitar doble activación