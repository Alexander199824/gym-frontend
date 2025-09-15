// src/pages/dashboard/components/PaymentsManager/hooks/useCashMemberships.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de membresías en efectivo
// Incluye activación, filtros, estadísticas y gestión de estados de procesamiento

import { useState, useEffect } from 'react';
import apiService from '../../../../../services/apiService';

export const useCashMemberships = (onSave) => {
  // Estados principales de membresías en efectivo
  const [pendingCashMemberships, setPendingCashMemberships] = useState([]);
  const [cashMembershipStats, setCashMembershipStats] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Estados de procesamiento
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Estados de filtros específicos para efectivo
  const [searchTerm, setSearchTerm] = useState('');
  const [cashViewMode, setCashViewMode] = useState('grid'); // 'grid' | 'list'
  const [cashSortBy, setCashSortBy] = useState('waiting_time');
  const [cashPriorityFilter, setCashPriorityFilter] = useState('all');

  // Función principal para cargar membresías en efectivo pendientes
  const loadPendingCashMemberships = async () => {
    try {
      console.log('Cargando membresías en efectivo pendientes...');
      setLoading(true);
      
      const response = await apiService.paymentService.getPendingCashMemberships({
        search: searchTerm,
        sortBy: cashSortBy,
        priority: cashPriorityFilter === 'all' ? undefined : cashPriorityFilter
      });
      
      setPendingCashMemberships(response?.data?.memberships || []);
      
      // Cargar estadísticas específicas
      const statsResponse = await apiService.paymentService.getCashMembershipStats();
      setCashMembershipStats(statsResponse?.data || {});
      
      console.log(`${response?.data?.memberships?.length || 0} membresías en efectivo cargadas`);
    } catch (error) {
      console.error('Error cargando membresías en efectivo:', error);
      setPendingCashMemberships([]);
      setCashMembershipStats({});
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para activar una membresía en efectivo
  const handleActivateCashMembership = async (membershipId, showSuccess, showError, formatCurrency) => {
    if (processingIds.has(membershipId)) return;

    const membershipData = pendingCashMemberships.find(m => m.id === membershipId);
    
    const confirmed = window.confirm(
      `¿Confirmar que recibiste ${formatCurrency(membershipData?.price || 0)} en efectivo de ${membershipData?.user?.name || 'cliente'}?`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, membershipId]));
      
      console.log('Activando membresía:', membershipId);
      
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
      console.error('Error activando membresía:', error);
      showError('Error al activar membresía en efectivo');
      throw error;
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  };

  // Función para filtrar y ordenar membresías en efectivo
  const getFilteredCashMemberships = () => {
    let filtered = [...pendingCashMemberships];

    // Filtrar por prioridad
    if (cashPriorityFilter !== 'all') {
      filtered = filtered.filter(membership => {
        const priority = getCashMembershipPriority(membership.hoursWaiting || 0);
        return priority === cashPriorityFilter;
      });
    }

    // Filtrar por búsqueda
    if (searchTerm) {
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
          return (b.price || 0) - (a.price || 0);
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

  // Función para determinar la prioridad de una membresía
  const getCashMembershipPriority = (hoursWaiting) => {
    return hoursWaiting > 4 ? 'urgent' : 'normal';
  };

  // Función para obtener configuración de prioridad
  const getCashMembershipPriorityConfig = (hoursWaiting) => {
    if (hoursWaiting > 4) {
      return {
        priority: 'urgent',
        color: 'orange',
        label: 'Urgente'
      };
    }
    return {
      priority: 'normal',
      color: 'green',
      label: 'Normal'
    };
  };

  // Efecto para recargar cuando cambien los filtros específicos de efectivo
  useEffect(() => {
    loadPendingCashMemberships();
  }, [cashSortBy, cashPriorityFilter]);

  // Efecto para recargar cuando cambie el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPendingCashMemberships();
    }, 300); // Debounce de 300ms

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
    
    // Estados de filtros
    searchTerm,
    cashViewMode,
    cashSortBy,
    cashPriorityFilter,
    
    // Funciones principales
    loadPendingCashMemberships,
    handleActivateCashMembership,
    
    // Funciones de filtros
    getFilteredCashMemberships,
    setSearchTerm,
    setCashViewMode,
    setCashSortBy,
    setCashPriorityFilter,
    
    // Utilidades
    getCashMembershipPriority,
    getCashMembershipPriorityConfig
  };
};

// Este hook encapsula toda la lógica específica de membresías en efectivo
// Maneja la carga, activación, filtros y estadísticas de pagos en efectivo
// Incluye gestión de estados de procesamiento para evitar doble activación