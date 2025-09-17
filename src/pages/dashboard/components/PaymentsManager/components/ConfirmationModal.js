// src/pages/dashboard/components/PaymentsManager/components/ConfirmationModal.js
// Author: Alexander Echeverria
// Modal profesional para confirmaciones críticas
// Reemplaza window.confirm() con diseño moderno y accesible

import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, Ban, Mail, DollarSign } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "Confirmar acción",
  message = "¿Estás seguro de realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning", // 'warning', 'danger', 'success', 'info'
  clientName = "",
  amount = "",
  reason = "",
  emailNote = false,
  isLoading = false
}) => {
  const confirmButtonRef = useRef(null);

  // Configuraciones de tipo
  const typeConfigs = {
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      icon: AlertTriangle
    },
    danger: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200', 
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: Ban
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      icon: CheckCircle
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      icon: CheckCircle
    }
  };

  const config = typeConfigs[type] || typeConfigs.warning;
  const IconComponent = config.icon;

  // Enfocar botón de confirmar cuando se abra el modal
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Manejar teclas
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        
        {/* Header con icono */}
        <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-6`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 ${config.iconBg} rounded-full flex-shrink-0`}>
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
        </div>

        {/* Body con detalles */}
        <div className="px-6 py-6 space-y-4">
          
          {/* Información del cliente y monto */}
          {(clientName || amount) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                {clientName && (
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-16">Cliente:</span>
                    <span className="text-gray-900 font-medium">{clientName}</span>
                  </div>
                )}
                {amount && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="font-medium text-gray-700 w-14">Monto:</span>
                    <span className="text-gray-900 font-bold">{amount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Razón si está disponible */}
          {reason && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm">
                <span className="font-medium text-blue-900">Razón:</span>
                <div className="mt-1 text-blue-800 italic">"{reason}"</div>
              </div>
            </div>
          )}

          {/* Nota sobre email automático */}
          {emailNote && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-indigo-800">
                  <span className="font-medium">Notificación automática:</span>
                  <div className="mt-1">Se enviará un email al cliente informando sobre esta acción</div>
                </div>
              </div>
            </div>
          )}

          {/* Advertencia adicional para acciones críticas */}
          {type === 'danger' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-800">
                <span className="font-medium">⚠️ Acción irreversible:</span>
                <div className="mt-1">Esta acción no se puede deshacer una vez confirmada</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-gray-50 border-t flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex items-center justify-center ${
              config.buttonColor
            } ${
              isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'shadow-sm hover:shadow-md active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>

        {/* Atajos de teclado */}
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex justify-between">
            <span>Presiona Escape para cancelar</span>
            <span>Enter para confirmar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;