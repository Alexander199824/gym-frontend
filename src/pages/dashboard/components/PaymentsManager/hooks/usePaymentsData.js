// src/pages/dashboard/components/PaymentsManager/hooks/usePaymentsData.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de carga y gestión de pagos
// Incluye paginación, búsqueda y filtros de historial de pagos

// src/pages/dashboard/components/PaymentsManager/hooks/usePaymentsData.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de carga y gestión de pagos
// Incluye paginación, búsqueda y filtros de historial de pagos

import { useState, useEffect } from 'react';
import apiService from '../../../../../services/apiService';

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

  // Función para confirmar un pago pendiente
  const handleConfirmPayment = async (paymentId, clientName, amount, showSuccess, showError) => {
    if (processingIds.has(paymentId)) return;

    const confirmed = window.confirm(
      `¿Confirmar que el pago de ${clientName} por ${amount} se realizó correctamente?`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      // Llamada al API para confirmar el pago
      await apiService.paymentService.confirmPayment(paymentId, {
        notes: `Pago confirmado para ${clientName}`,
        confirmedBy: 'admin'
      });
      
      showSuccess(
        `¡Pago confirmado! El pago de ${clientName} ha sido marcado como completado.`
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
          amount
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

  // Función para cancelar un pago pendiente
  const handleCancelPayment = async (paymentId, clientName, amount, showSuccess, showError) => {
    if (processingIds.has(paymentId)) return;

    const confirmed = window.confirm(
      `¿Confirmar que quieres CANCELAR el pago de ${clientName} por ${amount}?\n\nEsto marcará el pago como cancelado.`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      // Llamada al API para cancelar el pago
      await apiService.paymentService.cancelPayment(paymentId, {
        reason: 'Pago cancelado por administrador',
        notes: `Pago de ${clientName} cancelado`,
        cancelledBy: 'admin'
      });
      
      showSuccess(
        `Pago cancelado. El pago de ${clientName} ha sido marcado como cancelado.`
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
          amount
        });
      }
      
    } catch (error) {
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

  // Función para obtener icono del método de pago
  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: 'Banknote',
      card: 'CreditCard',
      transfer: 'Building',
      mobile: 'Building'
    };
    return icons[method] || 'CreditCard';
  };

  // Función para obtener color del estado
  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      failed: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100',
      waiting_payment: 'text-orange-600 bg-orange-100'
    };
    return colors[status] || colors.completed;
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
    
    // Información de paginación
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // Funciones principales
    loadPayments,
    handleSearch,
    handlePageChange,
    
    // Funciones de gestión de pagos
    handleConfirmPayment,
    handleCancelPayment,
    isPaymentProcessing,
    getProcessingType,
    
    // Funciones de análisis
    getPendingPaymentsStats,
    getPendingPayments,
    canManagePayment,
    
    // Utilidades
    getPaymentMethodIcon,
    getStatusColor,
    
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