// src/pages/dashboard/components/PaymentsManager/hooks/useCashMemberships.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de membresías en efectivo
// Incluye activación, filtros, estadísticas y gestión de estados de procesamiento

import { useState, useEffect } from 'react';
import apiService from '../../../../../services/apiService';

const useCashMemberships = (onSave) => {
  // Estados principales de membresías en efectivo
  const [pendingCashMemberships, setPendingCashMemberships] = useState([]);
  const [cashMembershipStats, setCashMembershipStats] = useState({
    total: 0,
    old: 0, // Cambiado de "urgent" a "old" - para identificar cuáles cancelar
    totalAmount: 0,
    avgAmount: 0,
    avgHours: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Estados de procesamiento
  const [processingIds, setProcessingIds] = useState(new Set());
  const [cancellingIds, setCancellingIds] = useState(new Set()); // NUEVO: Para cancelaciones
  
  // Estados de filtros específicos para efectivo
  const [searchTerm, setSearchTerm] = useState('');
  const [cashViewMode, setCashViewMode] = useState('grid');
  const [cashSortBy, setCashSortBy] = useState('waiting_time');
  const [cashPriorityFilter, setCashPriorityFilter] = useState('all');

  // Función principal para cargar membresías en efectivo pendientes
  const loadPendingCashMemberships = async () => {
    try {
      console.log('💵 useCashMemberships: Cargando membresías en efectivo pendientes...');
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
          canActivate: true,
          canCancel: true // NUEVO: Todos los pagos en efectivo pueden cancelarse
        }));
        
        setPendingCashMemberships(processedMemberships);
        
        // Calcular estadísticas corregidas (sin urgentes, pero con "antiguos")
        const calculatedStats = calculateCashStats(processedMemberships);
        setCashMembershipStats(calculatedStats);
        
        console.log(`✅ ${processedMemberships.length} membresías en efectivo cargadas`);
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
      console.error('❌ Error cargando membresías en efectivo:', error);
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
  };

  // Función para calcular estadísticas de efectivo (CORREGIDA)
  const calculateCashStats = (memberships) => {
    const total = memberships.length;
    // CAMBIADO: No hay "urgentes" en efectivo, pero sí "antiguos" (más de 24h para considerar cancelar)
    const old = memberships.filter(m => (m.hoursWaiting || 0) > 24).length;
    const totalAmount = memberships.reduce((sum, m) => sum + (m.price || m.amount || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;
    const avgHours = total > 0 ? 
      memberships.reduce((sum, m) => sum + (m.hoursWaiting || 0), 0) / total : 0;

    return {
      total,
      old, // Membresías que llevan más de 24h (candidatas a cancelar)
      totalAmount,
      avgAmount,
      avgHours
    };
  };

  // Función para activar una membresía en efectivo
  const handleActivateCashMembership = async (membershipId, showSuccess, showError, formatCurrency) => {
    if (processingIds.has(membershipId)) return;

    const membershipData = pendingCashMemberships.find(m => m.id === membershipId);
    
    if (!membershipData) {
      showError('No se encontró la membresía');
      return;
    }
    
    const confirmed = window.confirm(
      `¿Confirmar que recibiste ${formatCurrency(membershipData?.price || 0)} en efectivo de ${membershipData?.user?.name || 'cliente'}?`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, membershipId]));
      
      console.log('💵 Activando membresía:', membershipId);
      
      await apiService.paymentService.activateCashMembership(membershipId, {
        notes: `Pago en efectivo recibido de ${membershipData?.user?.name || 'cliente'}`
      });
      
      showSuccess(
        `¡Membresía activada! Pago de ${formatCurrency(membershipData?.price || 0)} registrado correctamente.`
      );
      
      // Remover de la lista local inmediatamente
      setPendingCashMemberships(prev => prev.filter(m => m.id !== membershipId));
      
      // Recargar datos completos
      await loadPendingCashMemberships();
      
      if (onSave) {
        onSave({ 
          type: 'cash_membership_activation',
          membershipId,
          clientName: membershipData?.user?.name || 'Cliente',
          amount: membershipData?.price || 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error activando membresía:', error);
      showError('Error al activar membresía en efectivo: ' + (error.message || 'Error desconocido'));
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  };

  // NUEVA: Función para cancelar una membresía en efectivo
  const handleCancelCashMembership = async (membershipId, showSuccess, showError, formatCurrency) => {
    if (cancellingIds.has(membershipId)) return;

    const membershipData = pendingCashMemberships.find(m => m.id === membershipId);
    
    if (!membershipData) {
      showError('No se encontró la membresía');
      return;
    }
    
    const confirmed = window.confirm(
      `¿Confirmar que quieres CANCELAR la membresía de ${membershipData?.user?.name || 'cliente'} por ${formatCurrency(membershipData?.price || 0)}?\n\nEsto marcará que el cliente nunca llegó a pagar.`
    );
    
    if (!confirmed) return;

    try {
      setCancellingIds(prev => new Set([...prev, membershipId]));
      
      console.log('❌ Cancelando membresía en efectivo:', membershipId);
      
      // Intentar usar endpoint específico si existe, sino usar el genérico
      try {
        await apiService.paymentService.cancelCashMembership(membershipId, {
          reason: 'Cliente no llegó a realizar el pago',
          notes: `Membresía cancelada - Cliente ${membershipData?.user?.name || 'anónimo'} no llegó a pagar`
        });
      } catch (error) {
        // Fallback: usar endpoint genérico de cancelación
        console.log('⚠️ Usando endpoint genérico de cancelación...');
        await apiService.paymentService.cancelCashPayment(membershipId, {
          reason: 'Cliente no llegó a realizar el pago',
          notes: `Membresía cancelada - Cliente ${membershipData?.user?.name || 'anónimo'} no llegó a pagar`
        });
      }
      
      showSuccess(
        `Membresía de ${membershipData?.user?.name || 'cliente'} cancelada correctamente.`
      );
      
      // Remover de la lista local inmediatamente
      setPendingCashMemberships(prev => prev.filter(m => m.id !== membershipId));
      
      // Recargar datos completos
      await loadPendingCashMemberships();
      
      if (onSave) {
        onSave({ 
          type: 'cash_membership_cancellation',
          membershipId,
          clientName: membershipData?.user?.name || 'Cliente',
          amount: membershipData?.price || 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error cancelando membresía:', error);
      showError('Error al cancelar membresía: ' + (error.message || 'Error desconocido'));
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  };

  // Función para filtrar y ordenar membresías en efectivo
  const getFilteredCashMemberships = () => {
    let filtered = [...pendingCashMemberships];

    // Filtrar por prioridad CORREGIDA
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
  };

  // CORREGIDA: Función para determinar la prioridad de una membresía en efectivo
  const getCashMembershipPriority = (hoursWaiting) => {
    // NUEVO: En efectivo no hay "urgente", solo "old" para identificar candidatos a cancelar
    if (hoursWaiting > 48) {
      return 'very_old'; // Más de 2 días - muy candidato a cancelar
    } else if (hoursWaiting > 24) {
      return 'old'; // Más de 1 día - candidato a cancelar
    } else {
      return 'normal'; // Esperando normal
    }
  };

  // CORREGIDA: Función para obtener configuración de prioridad
  const getCashMembershipPriorityConfig = (hoursWaiting) => {
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
  };

  // Función para obtener si una membresía es candidata a cancelar
  const isCandidateForCancellation = (membership) => {
    const hoursWaiting = membership.hoursWaiting || 0;
    return hoursWaiting > 24; // Más de 24 horas
  };

  // Función para obtener el estado de procesamiento
  const isMembershipProcessing = (membershipId) => {
    return processingIds.has(membershipId) || cancellingIds.has(membershipId);
  };

  // Función para obtener el tipo de procesamiento
  const getProcessingType = (membershipId) => {
    if (processingIds.has(membershipId)) return 'activating';
    if (cancellingIds.has(membershipId)) return 'cancelling';
    return null;
  };

  // Efecto para recargar cuando cambien los filtros específicos de efectivo
  useEffect(() => {
    loadPendingCashMemberships();
  }, [cashSortBy, cashPriorityFilter]);

  // Efecto para recargar cuando cambie el término de búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length === 0 || searchTerm.length >= 2) {
        loadPendingCashMemberships();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Efecto inicial de carga
  useEffect(() => {
    loadPendingCashMemberships();
  }, []);

  return {
    // Estados principales
    pendingCashMemberships,
    cashMembershipStats,
    loading,
    processingIds,
    cancellingIds, // NUEVO
    
    // Estados de filtros
    searchTerm,
    cashViewMode,
    cashSortBy,
    cashPriorityFilter,
    
    // Funciones principales
    loadPendingCashMemberships,
    handleActivateCashMembership,
    handleCancelCashMembership, // NUEVA
    
    // Funciones de filtros
    getFilteredCashMemberships,
    setSearchTerm,
    setCashViewMode,
    setCashSortBy,
    setCashPriorityFilter,
    
    // Utilidades CORREGIDAS
    getCashMembershipPriority,
    getCashMembershipPriorityConfig,
    isCandidateForCancellation, // NUEVA
    isMembershipProcessing, // NUEVA
    getProcessingType // NUEVA
  };
};

export default useCashMemberships;

// Este hook encapsula toda la lógica específica de membresías en efectivo
// Maneja la carga, activación, filtros y estadísticas de pagos en efectivo
// Incluye gestión de estados de procesamiento para evitar doble activación