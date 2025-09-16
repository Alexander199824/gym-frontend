// src/pages/dashboard/components/PaymentsManager/hooks/useReasonModal.js
// Author: Alexander Echeverria
// Hook personalizado para manejar el estado del modal de razones
// Proporciona una interfaz Promise-based para reemplazar window.prompt()

import { useState, useCallback } from 'react';

const useReasonModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    config: {},
    resolveRef: null,
    rejectRef: null
  });

  // Función principal para mostrar el modal y obtener la razón
  const askForReason = useCallback((config = {}) => {
    return new Promise((resolve, reject) => {
      const defaultConfig = {
        title: "Motivo requerido",
        subtitle: "Por favor proporciona una razón detallada",
        placeholder: "Describe el motivo...",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        type: "warning",
        examples: [],
        maxLength: 500,
        minLength: 10,
        clientName: "",
        amount: ""
      };

      setModalState({
        isOpen: true,
        config: { ...defaultConfig, ...config },
        resolveRef: resolve,
        rejectRef: reject
      });
    });
  }, []);

  // Configuraciones predefinidas para diferentes tipos de cancelación
  const askForCancellationReason = useCallback((clientName = "", amount = "") => {
    return askForReason({
      title: "Razón de Cancelación",
      subtitle: "Explica por qué se está cancelando este pago",
      placeholder: "Describe la razón de la cancelación...",
      confirmText: "Cancelar Pago",
      type: "danger",
      examples: [
        "Cliente canceló la solicitud",
        "Error en el registro del pago",
        "Pago duplicado detectado",
        "Cliente no se presentó",
        "Información incorrecta proporcionada"
      ],
      clientName,
      amount
    });
  }, [askForReason]);

  const askForRejectionReason = useCallback((clientName = "", amount = "") => {
    return askForReason({
      title: "Razón de Rechazo",
      subtitle: "Explica por qué se está rechazando esta transferencia",
      placeholder: "Describe la razón del rechazo...",
      confirmText: "Rechazar Transferencia", 
      type: "danger",
      examples: [
        "Comprobante ilegible o de baja calidad",
        "Monto incorrecto en el comprobante",
        "Transferencia duplicada",
        "Comprobante falsificado o alterado",
        "No corresponde a nuestros datos bancarios",
        "Fecha del comprobante muy antigua"
      ],
      clientName,
      amount
    });
  }, [askForReason]);

  const askForAnnulationReason = useCallback((clientName = "", amount = "") => {
    return askForReason({
      title: "Razón de Anulación",
      subtitle: "Explica por qué se está anulando esta membresía",
      placeholder: "Describe la razón de la anulación...",
      confirmText: "Anular Membresía",
      type: "warning",
      examples: [
        "Cliente no se presentó a pagar",
        "Cliente canceló su membresía",
        "Error en el registro",
        "Información duplicada",
        "Cliente solicitó anulación"
      ],
      clientName,
      amount
    });
  }, [askForReason]);

  // Manejar confirmación del modal
  const handleConfirm = useCallback(async (reason) => {
    if (modalState.resolveRef) {
      modalState.resolveRef(reason);
    }
    
    setModalState({
      isOpen: false,
      config: {},
      resolveRef: null,
      rejectRef: null
    });
  }, [modalState.resolveRef]);

  // Manejar cierre/cancelación del modal
  const handleClose = useCallback(() => {
    if (modalState.rejectRef) {
      modalState.rejectRef(new Error('Modal cancelled'));
    }
    
    setModalState({
      isOpen: false,
      config: {},
      resolveRef: null,
      rejectRef: null
    });
  }, [modalState.rejectRef]);

  return {
    // Estado del modal
    isModalOpen: modalState.isOpen,
    modalConfig: modalState.config,
    
    // Funciones principales
    askForReason,
    askForCancellationReason,
    askForRejectionReason,
    askForAnnulationReason,
    
    // Handlers del modal
    handleConfirm,
    handleClose
  };
};

export default useReasonModal;