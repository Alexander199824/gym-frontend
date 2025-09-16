// src/pages/dashboard/components/PaymentsManager/hooks/usePaymentsData.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de carga y gestión de pagos
// Incluye paginación, búsqueda y filtros de historial de pagos
// src/pages/dashboard/components/PaymentsManager/hooks/usePaymentsData.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de carga y gestión de pagos
// ACTUALIZADO: Ahora usa ReasonModal en lugar de window.prompt()

import { useState, useEffect } from 'react';
import apiService from '../../../../../services/apiService';
import useReasonModal from './useReasonModal';

const usePaymentsData = (onSave) => {
  // Estados principales de pagos
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPayments, setTotalPayments] = useState(0);
  
  // Estados de procesamiento para pagos pendientes
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Estados de filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 20;

  // Hook para el modal de razones
  const {
    isModalOpen,
    modalConfig,
    askForCancellationReason,
    handleConfirm: handleModalConfirm,
    handleClose: handleModalClose
  } = useReasonModal();

  // Función principal para cargar pagos
  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: paymentsPerPage,
        search: searchTerm || undefined
      };
      
      const response = await apiService.paymentService.getPayments(params);
      
      if (response?.data) {
        if (response.data.payments && Array.isArray(response.data.payments)) {
          setPayments(response.data.payments);
          setTotalPayments(response.data.pagination?.total || response.data.payments.length);
        } else if (Array.isArray(response.data)) {
          setPayments(response.data);
          setTotalPayments(response.data.length);
        }
      }
    } catch (error) {
      console.error('Error cargando pagos:', error);
      setPayments([]);
      setTotalPayments(0);
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PRINCIPAL: Confirmar pago pendiente - SIN CAMBIOS
  const handleConfirmPayment = async (paymentId, clientName, amount, showSuccess, showError) => {
    if (processingIds.has(paymentId)) return;

    // Confirmar sin pedir razón como en el test
    const confirmed = window.confirm(
      `¿Confirmar que el pago de ${clientName} por ${amount} se realizó correctamente?\n\n✅ Se enviará email de confirmación automáticamente`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      // Determinar el método de pago para usar el endpoint correcto
      const payment = payments.find(p => p.id === paymentId);
      const paymentMethod = payment?.paymentMethod || 'cash';
      
      if (paymentMethod === 'cash') {
        // Usar endpoint de efectivo
        await apiService.paymentService.activateCashMembership(paymentId);
      } else if (paymentMethod === 'transfer') {
        // Usar endpoint de transferencias
        await apiService.paymentService.approveTransfer(paymentId);
      } else {
        // Para otros métodos, intentar endpoint genérico
        await apiService.paymentService.activateCashMembership(paymentId);
      }
      
      showSuccess(
        `¡Pago CONFIRMADO! ${clientName} - ${amount} → Status: completed + Email automático`
      );
      
      // Actualizar el pago en la lista local inmediatamente
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'completed', paymentDate: new Date().toISOString() }
          : payment
      ));
      
      // Recargar datos completos
      await loadPayments();
      
      if (onSave) {
        onSave({ 
          type: 'payment_confirmation',
          paymentId,
          clientName,
          amount,
          method: paymentMethod
        });
      }
      
    } catch (error) {
      console.error('Error confirmando pago:', error);
      showError('Error al confirmar pago: ' + (error.message || 'Error desconocido'));
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // FUNCIÓN PRINCIPAL: Cancelar pago pendiente - ACTUALIZADA CON MODAL
  const handleCancelPayment = async (paymentId, clientName, amount, showSuccess, showError) => {
    if (processingIds.has(paymentId)) return;

    try {
      // USAR EL MODAL EN LUGAR DE window.prompt()
      const reason = await askForCancellationReason(clientName, amount);
      
      const confirmed = window.confirm(
        `¿Confirmar CANCELACIÓN del pago de ${clientName} por ${amount}?\n\nRazón: "${reason}"\n\n❌ Se enviará email de cancelación automáticamente`
      );
      
      if (!confirmed) return;

      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      // Determinar el método de pago para usar el endpoint correcto
      const payment = payments.find(p => p.id === paymentId);
      const paymentMethod = payment?.paymentMethod || 'cash';
      
      if (paymentMethod === 'cash') {
        // Usar endpoint de efectivo
        await apiService.paymentService.cancelCashPayment(paymentId, reason);
      } else if (paymentMethod === 'transfer') {
        // Usar endpoint de transferencias
        await apiService.paymentService.rejectTransfer(paymentId, reason);
      } else {
        // Para otros métodos, intentar endpoint de efectivo
        await apiService.paymentService.cancelCashPayment(paymentId, reason);
      }
      
      showSuccess(
        `Pago CANCELADO: ${clientName} → Status: cancelled + Email automático con motivo`
      );
      
      // Actualizar el pago en la lista local inmediatamente
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'cancelled' }
          : payment
      ));
      
      // Recargar datos completos
      await loadPayments();
      
      if (onSave) {
        onSave({ 
          type: 'payment_cancellation',
          paymentId,
          clientName,
          amount,
          reason,
          method: paymentMethod
        });
      }
      
    } catch (error) {
      if (error.message === 'Modal cancelled') {
        // Usuario canceló el modal, no mostrar error
        return;
      }
      
      console.error('Error cancelando pago:', error);
      showError('Error al cancelar pago: ' + (error.message || 'Error desconocido'));
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // Función para obtener el estado de procesamiento de un pago
  const isPaymentProcessing = (paymentId) => {
    return processingIds.has(paymentId);
  };

  // Función para obtener el tipo de procesamiento
  const getProcessingType = (paymentId) => {
    if (processingIds.has(paymentId)) {
      return 'processing';
    }
    return null;
  };

  // Función para buscar pagos
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // Función para cambiar página
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Función para obtener estadísticas de pagos pendientes
  const getPendingPaymentsStats = () => {
    const pendingPayments = payments.filter(p => 
      p.status === 'pending' || p.status === 'waiting_payment'
    );
    
    const totalPending = pendingPayments.length;
    const totalAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgAmount = totalPending > 0 ? totalAmount / totalPending : 0;
    
    // Calcular cuántos llevan más de X horas esperando
    const now = new Date();
    const oldPending = pendingPayments.filter(p => {
      if (!p.createdAt) return false;
      const created = new Date(p.createdAt);
      const hoursDiff = (now - created) / (1000 * 60 * 60);
      return hoursDiff > 24;
    }).length;
    
    return {
      total: totalPending,
      old: oldPending,
      totalAmount,
      avgAmount
    };
  };

  // Función para filtrar solo pagos pendientes
  const getPendingPayments = () => {
    return payments.filter(p => 
      p.status === 'pending' || p.status === 'waiting_payment'
    );
  };

  // Función para determinar si un pago puede ser gestionado
  const canManagePayment = (payment) => {
    return payment.status === 'pending' || payment.status === 'waiting_payment';
  };

  // Calcular información de paginación
  const totalPages = Math.ceil(totalPayments / paymentsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Efecto para cargar pagos cuando cambien los filtros
  useEffect(() => {
    loadPayments();
  }, [currentPage, searchTerm]);

  // Efecto inicial de carga
  useEffect(() => {
    loadPayments();
  }, []);

  return {
    // Estados principales
    payments,
    loading,
    totalPayments,
    processingIds,
    
    // Estados de filtros
    searchTerm,
    currentPage,
    paymentsPerPage,
    
    // Estados del modal
    isModalOpen,
    modalConfig,
    
    // Información de paginación
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // Funciones principales
    loadPayments,
    handleSearch,
    handlePageChange,
    
    // Funciones de gestión de pagos - CON MODAL PROFESIONAL
    handleConfirmPayment,   // CONFIRMAR automático según método
    handleCancelPayment,    // CANCELAR con modal profesional
    isPaymentProcessing,
    getProcessingType,
    
    // Funciones del modal
    handleModalConfirm,
    handleModalClose,
    
    // Funciones de análisis
    getPendingPaymentsStats,
    getPendingPayments,
    canManagePayment,
    
    // Función para actualizar búsqueda
    setSearchTerm: handleSearch
  };
};

export default usePaymentsData;

// Este hook encapsula toda la lógica relacionada con la gestión de pagos
// ACTUALIZADO: Ahora incluye funciones para confirmar y cancelar pagos pendientes
// Maneja la carga de datos, paginación, búsqueda y utilidades de formateo
// Este hook encapsula toda la lógica relacionada con la gestión de pagos
// Maneja la carga de datos, paginación, búsqueda y utilidades de formateo
// Permite reutilizar esta lógica en diferentes componentes si es necesario