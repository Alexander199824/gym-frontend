// src/pages/dashboard/components/PaymentsManager/hooks/usePaymentsData.js
// Author: Alexander Echeverria
// Hook personalizado para manejar toda la lógica de carga y gestión de pagos
// Incluye paginación, búsqueda y filtros de historial de pagos

// src/pages/dashboard/components/PaymentsManager/hooks/usePaymentsData.js
// ACTUALIZADO: Para usar la misma lógica del test en el historial general de pagos

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

  // FUNCIÓN PRINCIPAL: Confirmar pago pendiente - LÓGICA DEL TEST
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

  // FUNCIÓN PRINCIPAL: Cancelar pago pendiente - LÓGICA DEL TEST
  const handleCancelPayment = async (paymentId, clientName, amount, showSuccess, showError) => {
    if (processingIds.has(paymentId)) return;

    // Pedir razón obligatoria como en el test
    const reason = window.prompt(
      `Razón DETALLADA de cancelación (OBLIGATORIA para email al cliente):\n\nEjemplos: "Cliente canceló", "Error en el registro", "Pago duplicado"`
    );
    
    if (!reason || !reason.trim()) {
      showError('La razón de cancelación es obligatoria');
      return;
    }

    const confirmed = window.confirm(
      `¿Confirmar CANCELACIÓN del pago de ${clientName} por ${amount}?\n\nRazón: "${reason.trim()}"\n\n❌ Se enviará email de cancelación automáticamente`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      // Determinar el método de pago para usar el endpoint correcto
      const payment = payments.find(p => p.id === paymentId);
      const paymentMethod = payment?.paymentMethod || 'cash';
      
      if (paymentMethod === 'cash') {
        // Usar endpoint de efectivo
        await apiService.paymentService.cancelCashPayment(paymentId, reason.trim());
      } else if (paymentMethod === 'transfer') {
        // Usar endpoint de transferencias
        await apiService.paymentService.rejectTransfer(paymentId, reason.trim());
      } else {
        // Para otros métodos, intentar endpoint de efectivo
        await apiService.paymentService.cancelCashPayment(paymentId, reason.trim());
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
          reason: reason.trim(),
          method: paymentMethod
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
    
    // Funciones de gestión de pagos - USA LÓGICA DEL TEST
    handleConfirmPayment,   // CONFIRMAR automático según método
    handleCancelPayment,    // CANCELAR con razón obligatoria
    isPaymentProcessing,
    getProcessingType,
    
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