// src/pages/dashboard/components/PaymentsManager/hooks/useConfirmationModal.js
// Author: Alexander Echeverria
// Hook personalizado para manejar el estado del modal de confirmación
// Proporciona una interfaz Promise-based para reemplazar window.confirm()

import { useState, useCallback } from 'react';

const useConfirmationModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    config: {},
    resolveRef: null,
    rejectRef: null,
    isLoading: false
  });

  // Función principal para mostrar el modal y obtener confirmación
  const askForConfirmation = useCallback((config = {}) => {
    return new Promise((resolve, reject) => {
      const defaultConfig = {
        title: "Confirmar acción",
        message: "¿Estás seguro de realizar esta acción?",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        type: "warning",
        clientName: "",
        amount: "",
        reason: "",
        emailNote: false
      };

      setModalState({
        isOpen: true,
        config: { ...defaultConfig, ...config },
        resolveRef: resolve,
        rejectRef: reject,
        isLoading: false
      });
    });
  }, []);

  // Configuraciones predefinidas para diferentes tipos de confirmación

  // Confirmación para activar/confirmar pago en efectivo
  const confirmCashPayment = useCallback((clientName = "", amount = "") => {
    return askForConfirmation({
      title: "Confirmar Pago Recibido",
      message: "¿Confirmar que recibiste el pago en efectivo?",
      confirmText: "✅ Confirmar Pago",
      type: "success",
      clientName,
      amount,
      emailNote: true
    });
  }, [askForConfirmation]);

  // Confirmación para cancelar pago con razón
  const confirmCashCancellation = useCallback((clientName = "", amount = "", reason = "") => {
    return askForConfirmation({
      title: "Confirmar Cancelación",
      message: "¿Confirmar la cancelación de este pago?",
      confirmText: "❌ Cancelar Pago",
      type: "danger",
      clientName,
      amount,
      reason,
      emailNote: true
    });
  }, [askForConfirmation]);

  // Confirmación para aprobar transferencia
  const confirmTransferApproval = useCallback((clientName = "", amount = "") => {
    return askForConfirmation({
      title: "Aprobar Transferencia",
      message: "¿Confirmar que quieres aprobar esta transferencia?",
      confirmText: "✅ Aprobar",
      type: "success",
      clientName,
      amount,
      emailNote: true
    });
  }, [askForConfirmation]);

  // Confirmación para rechazar transferencia con razón
  const confirmTransferRejection = useCallback((clientName = "", amount = "", reason = "") => {
    return askForConfirmation({
      title: "Rechazar Transferencia",
      message: "¿Confirmar el rechazo de esta transferencia?",
      confirmText: "❌ Rechazar",
      type: "danger",
      clientName,
      amount,
      reason,
      emailNote: true
    });
  }, [askForConfirmation]);

  // Confirmación para activar membresía en efectivo
  const confirmMembershipActivation = useCallback((clientName = "", amount = "") => {
    return askForConfirmation({
      title: "Activar Membresía",
      message: "¿Confirmar que recibiste el pago y activar la membresía?",
      confirmText: "✅ Activar Membresía",
      type: "success",
      clientName,
      amount,
      emailNote: true
    });
  }, [askForConfirmation]);

  // Confirmación para anular membresía con razón
  const confirmMembershipAnnulation = useCallback((clientName = "", amount = "", reason = "") => {
    return askForConfirmation({
      title: "Anular Membresía",
      message: "¿Confirmar la anulación de esta membresía?",
      confirmText: "❌ Anular Membresía",
      type: "danger",
      clientName,
      amount,
      reason,
      emailNote: true
    });
  }, [askForConfirmation]);

  // Manejar confirmación del modal
  const handleConfirm = useCallback(async () => {
    if (modalState.resolveRef) {
      setModalState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Resolver la promesa inmediatamente
        modalState.resolveRef(true);
      } catch (error) {
        console.error('Error en confirmación:', error);
      }
    }
    
    // Cerrar modal después de un breve delay para mostrar el loading
    setTimeout(() => {
      setModalState({
        isOpen: false,
        config: {},
        resolveRef: null,
        rejectRef: null,
        isLoading: false
      });
    }, 100);
  }, [modalState.resolveRef]);

  // Manejar cierre/cancelación del modal
  const handleClose = useCallback(() => {
    if (modalState.rejectRef) {
      modalState.rejectRef(new Error('Confirmation cancelled'));
    }
    
    setModalState({
      isOpen: false,
      config: {},
      resolveRef: null,
      rejectRef: null,
      isLoading: false
    });
  }, [modalState.rejectRef]);

  return {
    // Estado del modal
    isConfirmationOpen: modalState.isOpen,
    confirmationConfig: modalState.config,
    isConfirmationLoading: modalState.isLoading,
    
    // Funciones principales
    askForConfirmation,
    
    // Funciones predefinidas específicas
    confirmCashPayment,
    confirmCashCancellation,
    confirmTransferApproval,
    confirmTransferRejection,
    confirmMembershipActivation,
    confirmMembershipAnnulation,
    
    // Handlers del modal
    handleConfirmationConfirm: handleConfirm,
    handleConfirmationClose: handleClose
  };
};

export default useConfirmationModal;