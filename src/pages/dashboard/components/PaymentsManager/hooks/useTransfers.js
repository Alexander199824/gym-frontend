// src/pages/dashboard/components/PaymentsManager/hooks/useTransfers.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de transferencias bancarias
// Incluye validación, aprobación, rechazo y gestión de estados de procesamiento

import { useState, useEffect } from 'react';
import apiService from '../../../../../services/apiService';

export const useTransfers = (onSave) => {
  // Estados principales de transferencias
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados de procesamiento
  const [processingIds, setProcessingIds] = useState(new Set());

  // Función principal para cargar transferencias pendientes
  const loadPendingTransfers = async () => {
    try {
      console.log('Cargando transferencias pendientes...');
      setLoading(true);
      
      const response = await apiService.paymentService.getPendingTransfers();
      setPendingTransfers(response?.data?.transfers || []);
      
      console.log(`${response?.data?.transfers?.length || 0} transferencias cargadas`);
    } catch (error) {
      console.error('Error cargando transferencias:', error);
      setPendingTransfers([]);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función para validar una transferencia (aprobar o rechazar)
  const handleValidateTransfer = async (paymentId, approved, showSuccess, showError) => {
    if (processingIds.has(paymentId)) return;

    const confirmed = window.confirm(
      approved 
        ? '¿Confirmar que quieres aprobar esta transferencia?' 
        : '¿Confirmar que quieres rechazar esta transferencia?'
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      console.log(`${approved ? 'Aprobando' : 'Rechazando'} transferencia:`, paymentId);
      
      await apiService.paymentService.validateTransfer(
        paymentId, 
        approved, 
        approved ? 'Transferencia aprobada' : 'Transferencia rechazada'
      );
      
      showSuccess(approved ? 'Transferencia aprobada' : 'Transferencia rechazada');
      
      // Remover de la lista local inmediatamente
      setPendingTransfers(prev => prev.filter(t => t.id !== paymentId));
      
      // Recargar datos completos
      await loadPendingTransfers();
      
      if (onSave) {
        onSave({ 
          type: 'transfer_validation', 
          approved,
          transferId: paymentId
        });
      }
      
    } catch (error) {
      console.error('Error validando transferencia:', error);
      showError('Error al procesar transferencia');
      throw error;
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // Función para aprobar una transferencia específicamente
  const handleApproveTransfer = async (paymentId, showSuccess, showError) => {
    await handleValidateTransfer(paymentId, true, showSuccess, showError);
  };

  // Función para rechazar una transferencia específicamente
  const handleRejectTransfer = async (paymentId, showSuccess, showError) => {
    await handleValidateTransfer(paymentId, false, showSuccess, showError);
  };

  // Función para obtener el estado de procesamiento de una transferencia
  const isTransferProcessing = (transferId) => {
    return processingIds.has(transferId);
  };

  // Función para obtener información de prioridad de una transferencia
  const getTransferPriority = (transfer) => {
    const hoursWaiting = transfer.hoursWaiting || 0;
    
    if (hoursWaiting > 24) {
      return {
        level: 'critical',
        color: 'red',
        label: 'Crítica',
        description: 'Más de 24 horas esperando'
      };
    } else if (hoursWaiting > 12) {
      return {
        level: 'high',
        color: 'orange',
        label: 'Alta',
        description: 'Más de 12 horas esperando'
      };
    } else if (hoursWaiting > 4) {
      return {
        level: 'medium',
        color: 'yellow',
        label: 'Media',
        description: 'Más de 4 horas esperando'
      };
    }
    
    return {
      level: 'normal',
      color: 'green',
      label: 'Normal',
      description: 'Recién recibida'
    };
  };

  // Función para ordenar transferencias por prioridad
  const getSortedTransfers = () => {
    return [...pendingTransfers].sort((a, b) => {
      // Ordenar por tiempo de espera descendente (más urgentes primero)
      return (b.hoursWaiting || 0) - (a.hoursWaiting || 0);
    });
  };

  // Función para obtener estadísticas de transferencias
  const getTransferStats = () => {
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
  };

  // Efecto inicial de carga
  useEffect(() => {
    loadPendingTransfers();
  }, []);

  return {
    // Estados principales
    pendingTransfers,
    loading,
    processingIds,
    
    // Funciones principales
    loadPendingTransfers,
    handleValidateTransfer,
    handleApproveTransfer,
    handleRejectTransfer,
    
    // Utilidades
    isTransferProcessing,
    getTransferPriority,
    getSortedTransfers,
    getTransferStats
  };
};

// Este hook encapsula toda la lógica relacionada con transferencias bancarias
// Maneja la validación, aprobación y rechazo de transferencias pendientes
// Incluye utilidades para priorización y estadísticas de transferencias