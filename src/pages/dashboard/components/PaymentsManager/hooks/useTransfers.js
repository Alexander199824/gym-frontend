// src/pages/dashboard/components/PaymentsManager/hooks/useTransfers.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de transferencias bancarias
// Incluye validación, aprobación, rechazo y gestión de estados de procesamiento

// src/pages/dashboard/components/PaymentsManager/hooks/useTransfers.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de transferencias bancarias
// ACTUALIZADO: Ahora usa modales profesionales en lugar de window.confirm() y window.prompt()

import { useState, useEffect, useCallback } from 'react';
import apiService from '../../../../../services/apiService';
import useReasonModal from './useReasonModal';
import useConfirmationModal from './useConfirmationModal';

const useTransfers = (onSave) => {
  // Estados principales de transferencias
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [transferStats, setTransferStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    normal: 0,
    totalAmount: 0,
    avgAmount: 0,
    avgHours: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Estados de procesamiento
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Estados de filtros específicos para transferencias
  const [searchTerm, setSearchTerm] = useState('');
  const [transferViewMode, setTransferViewMode] = useState('grid');
  const [transferSortBy, setTransferSortBy] = useState('waiting_time');
  const [transferPriorityFilter, setTransferPriorityFilter] = useState('all');

  // Hooks para modales profesionales
  const {
    isModalOpen,
    modalConfig,
    askForRejectionReason,
    handleConfirm: handleModalConfirm,
    handleClose: handleModalClose
  } = useReasonModal();

  const {
    isConfirmationOpen,
    confirmationConfig,
    isConfirmationLoading,
    confirmTransferApproval,
    confirmTransferRejection,
    handleConfirmationConfirm,
    handleConfirmationClose
  } = useConfirmationModal();

  // Función para calcular estadísticas de transferencias
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

    return {
      total,
      critical,
      high,
      medium,
      normal,
      totalAmount,
      avgAmount,
      avgHours
    };
  }, []);

  // Función principal para cargar transferencias pendientes
  const loadPendingTransfers = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await apiService.paymentService.getPendingTransfers({
        search: searchTerm,
        sortBy: transferSortBy,
        priority: transferPriorityFilter === 'all' ? undefined : transferPriorityFilter
      });
      
      if (response?.success && response.data) {
        const transfers = response.data.transfers || [];
        
        // Procesar transferencias para asegurar campos necesarios
        const processedTransfers = transfers.map(transfer => ({
          ...transfer,
          id: transfer.id || transfer.paymentId,
          amount: parseFloat(transfer.amount || 0),
          hoursWaiting: transfer.hoursWaiting || 0,
          user: transfer.user || {
            name: transfer.clientName || 'Cliente Anónimo',
            email: transfer.clientEmail || transfer.user?.email || '',
            phone: transfer.clientPhone || transfer.user?.phone || ''
          },
          transferProof: transfer.transferProof || false,
          priority: transfer.priority || getPriorityByHours(transfer.hoursWaiting || 0)
        }));
        
        setPendingTransfers(processedTransfers);
        
        // Calcular estadísticas
        const calculatedStats = calculateTransferStats(processedTransfers);
        setTransferStats(calculatedStats);
        
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
          avgHours: 0
        });
      }
      
    } catch (error) {
      console.error('Error cargando transferencias:', error);
      setPendingTransfers([]);
      setTransferStats({
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        normal: 0,
        totalAmount: 0,
        avgAmount: 0,
        avgHours: 0
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, transferSortBy, transferPriorityFilter, calculateTransferStats]);

  // FUNCIÓN PRINCIPAL: Validar transferencia - ACTUALIZADA CON MODALES PROFESIONALES
  const handleValidateTransfer = useCallback(async (paymentId, approved, showSuccess, showError) => {
    if (processingIds.has(paymentId)) return;

    const transfer = pendingTransfers.find(t => t.id === paymentId);
    const clientName = transfer?.user?.name || 'cliente';
    const amount = transfer?.amount || 0;
    const formattedAmount = `Q${amount}`;
    
    // Lógica para aprobación y rechazo
    if (approved) {
      // APROBAR - Usar modal profesional en lugar de window.confirm()
      try {
        const confirmed = await confirmTransferApproval(clientName, formattedAmount);
        
        if (!confirmed) return;

        setProcessingIds(prev => new Set([...prev, paymentId]));
        
        // MISMO ENDPOINT Y LÓGICA QUE ANTES
        await apiService.paymentService.approveTransfer(paymentId);
        
        showSuccess && showSuccess(
          `¡Transferencia APROBADA! ${clientName} - ${formattedAmount} → Status: completed + Email automático`
        );
        
        // Remover de la lista local inmediatamente
        setPendingTransfers(prev => prev.filter(t => t.id !== paymentId));
        
        // Recargar datos completos
        await loadPendingTransfers();
        
        if (onSave) {
          onSave({ 
            type: 'transfer_approval',
            transferId: paymentId,
            clientName,
            amount,
            action: 'approved'
          });
        }
        
      } catch (error) {
        if (error.message === 'Confirmation cancelled') {
          // Usuario canceló la confirmación, no mostrar error
          return;
        }
        
        console.error('Error aprobando transferencia:', error);
        showError && showError('Error al aprobar transferencia: ' + (error.message || 'Error desconocido'));
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(paymentId);
          return newSet;
        });
      }
      
    } else {
      // RECHAZAR - Usar modales profesionales en lugar de window.prompt() y window.confirm()
      try {
        // PASO 1: Pedir razón con modal profesional
        const reason = await askForRejectionReason(clientName, formattedAmount);
        
        // PASO 2: Confirmar con modal profesional (NO window.confirm())
        const confirmed = await confirmTransferRejection(clientName, formattedAmount, reason);
        
        if (!confirmed) return;

        setProcessingIds(prev => new Set([...prev, paymentId]));
        
        // MISMO ENDPOINT Y LÓGICA QUE ANTES
        await apiService.paymentService.rejectTransfer(paymentId, reason);
        
        showSuccess && showSuccess(
          `Transferencia RECHAZADA: ${clientName} → Status: cancelled + Email automático con motivo`
        );
        
        // Remover de la lista local inmediatamente
        setPendingTransfers(prev => prev.filter(t => t.id !== paymentId));
        
        // Recargar datos completos
        await loadPendingTransfers();
        
        if (onSave) {
          onSave({ 
            type: 'transfer_rejection',
            transferId: paymentId,
            clientName,
            amount,
            reason,
            action: 'rejected'
          });
        }
        
      } catch (error) {
        if (error.message === 'Modal cancelled' || error.message === 'Confirmation cancelled') {
          // Usuario canceló algún modal, no mostrar error
          return;
        }
        
        console.error('Error rechazando transferencia:', error);
        showError && showError('Error al rechazar transferencia: ' + (error.message || 'Error desconocido'));
      } finally {
        setProcessingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(paymentId);
          return newSet;
        });
      }
    }
  }, [processingIds, pendingTransfers, loadPendingTransfers, onSave, askForRejectionReason, confirmTransferApproval, confirmTransferRejection]);

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

  // Función para determinar la prioridad de una transferencia
  const getTransferPriority = useCallback((hoursWaiting) => {
    if (hoursWaiting > 24) {
      return 'critical';
    } else if (hoursWaiting > 12) {
      return 'high';
    } else if (hoursWaiting > 4) {
      return 'medium';
    } else {
      return 'normal';
    }
  }, []);

  // Función auxiliar para calcular prioridad por horas
  const getPriorityByHours = (hours) => {
    if (hours > 24) return 'critical';
    if (hours > 12) return 'high'; 
    if (hours > 4) return 'medium';
    return 'normal';
  };

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
    
    // Estados de ambos modales
    isModalOpen,
    modalConfig,
    isConfirmationOpen,
    confirmationConfig,
    isConfirmationLoading,
    
    // Funciones principales - ACTUALIZADAS CON MODALES PROFESIONALES
    loadPendingTransfers,
    handleValidateTransfer, // FUNCIÓN PRINCIPAL QUE USA AMBOS MODALES
    
    // Funciones de ambos modales
    handleModalConfirm,
    handleModalClose,
    handleConfirmationConfirm,
    handleConfirmationClose,
    
    // Funciones de filtros
    getFilteredTransfers,
    setSearchTerm,
    setTransferViewMode,
    setTransferSortBy,
    setTransferPriorityFilter,
    
    // Utilidades
    isTransferProcessing,
    getProcessingType,
    getTransferPriority
  };
};

export default useTransfers;

// Este hook encapsula toda la lógica relacionada con transferencias bancarias
// Maneja la validación, aprobación y rechazo de transferencias pendientes
// Incluye utilidades para priorización y estadísticas de transferencias