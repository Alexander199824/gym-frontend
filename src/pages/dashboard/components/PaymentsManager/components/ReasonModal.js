// src/pages/dashboard/components/PaymentsManager/components/ReasonModal.js
// Author: Alexander Echeverria
// Modal profesional para pedir razones de cancelación/anulación
// Reemplaza los window.prompt() con una interfaz más elegante

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, MessageSquare, Send, Ban } from 'lucide-react';

const ReasonModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "Motivo requerido",
  subtitle = "Por favor proporciona una razón detallada",
  placeholder = "Describe el motivo...",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning", // 'warning', 'danger', 'info'
  examples = [],
  maxLength = 500,
  minLength = 10,
  clientName = "",
  amount = ""
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  // Configuraciones de tipo
  const typeConfigs = {
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      icon: AlertTriangle
    },
    danger: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200', 
      iconColor: 'text-red-600',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      icon: Ban
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600', 
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      icon: MessageSquare
    }
  };

  const config = typeConfigs[type] || typeConfigs.warning;
  const IconComponent = config.icon;

  // Enfocar textarea cuando se abra el modal
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Limpiar estado cuando se cierre
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Manejar cambios en el textarea
  const handleReasonChange = (e) => {
    const value = e.target.value;
    setReason(value);
    
    // Limpiar errores si el usuario está escribiendo
    if (error && value.trim().length >= minLength) {
      setError('');
    }
  };

  // Validar razón
  const validateReason = () => {
    const trimmedReason = reason.trim();
    
    if (!trimmedReason) {
      setError('La razón es obligatoria');
      return false;
    }
    
    if (trimmedReason.length < minLength) {
      setError(`La razón debe tener al menos ${minLength} caracteres`);
      return false;
    }
    
    if (trimmedReason.length > maxLength) {
      setError(`La razón no puede exceder ${maxLength} caracteres`);
      return false;
    }
    
    return true;
  };

  // Manejar confirmación
  const handleConfirm = async () => {
    if (!validateReason()) {
      textareaRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirm(reason.trim());
    } catch (error) {
      setError('Error al procesar la solicitud');
      console.error('Error en ReasonModal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar teclas
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleConfirm();
    }
  };

  // Manejar clic en ejemplo
  const handleExampleClick = (example) => {
    setReason(example);
    textareaRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${config.bgColor} rounded-lg`}>
                <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          
          {/* Información del cliente/pago si está disponible */}
          {(clientName || amount) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">
                {clientName && <div><strong>Cliente:</strong> {clientName}</div>}
                {amount && <div><strong>Monto:</strong> {amount}</div>}
              </div>
            </div>
          )}

          {/* Campo de texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón detallada *
            </label>
            <textarea
              ref={textareaRef}
              value={reason}
              onChange={handleReasonChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full px-3 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              maxLength={maxLength}
              disabled={isSubmitting}
            />
            
            {/* Contador de caracteres */}
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                Mínimo {minLength} caracteres
              </div>
              <div className={`text-xs ${
                reason.length > maxLength * 0.9 ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {reason.length}/{maxLength}
              </div>
            </div>
          </div>

          {/* Ejemplos */}
          {examples.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ejemplos comunes:
              </label>
              <div className="space-y-1">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            disabled={isSubmitting}
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex items-center space-x-2 ${
              config.buttonColor
            } ${
              (!reason.trim() || isSubmitting) 
                ? 'opacity-50 cursor-not-allowed' 
                : 'shadow-sm hover:shadow-md active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>

        {/* Atajos de teclado */}
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex justify-between">
            <span>Presiona Escape para cancelar</span>
            <span>Ctrl/Cmd + Enter para confirmar</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;