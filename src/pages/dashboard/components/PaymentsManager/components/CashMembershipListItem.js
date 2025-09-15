// src/pages/dashboard/components/PaymentsManager/components/CashMembershipListItem.js
// Author: Alexander Echeverria
// Componente de item para membresías en efectivo pendientes (vista lista)
// Versión compacta horizontal para mostrar múltiples membresías de forma eficiente

import React from 'react';
import { CheckCircle, Timer, Bird, Phone, Mail, Loader2, X } from 'lucide-react';

const CashMembershipListItem = ({ 
  membership, 
  onActivate, 
  onCancel,
  isProcessing = false,
  processingType = null,
  formatCurrency,
  formatDate 
}) => {
  const isCandidateForCancellation = (membership.hoursWaiting || 0) > 24;
  const isVeryOld = (membership.hoursWaiting || 0) > 48;
  
  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
      isVeryOld ? 'border-red-300 bg-red-50' : 
      isCandidateForCancellation ? 'border-orange-300 bg-orange-50' : 
      'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <span className="text-lg font-bold text-green-700">
              {membership.user?.name?.[0] || 'A'}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {membership.user?.name || 'Cliente Anónimo'}
              </h3>
              {isCandidateForCancellation && (
                <div className={`flex items-center text-sm ml-2 ${
                  isVeryOld ? 'text-red-600' : 'text-orange-600'
                }`}>
                  <Timer className="w-4 h-4 mr-1" />
                  <span>{membership.hoursWaiting?.toFixed(1) || '0.0'}h</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="font-semibold text-green-600">
                <Bird className="w-4 h-4 inline mr-1" />
                {formatCurrency && formatCurrency(membership.price)}
              </span>
              {membership.user?.email && (
                <span className="truncate max-w-40">
                  <Mail className="w-3 h-3 inline mr-1" />
                  {membership.user.email}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0 flex space-x-2">
          {/* Botón de recibir */}
          <button
            onClick={() => onActivate && onActivate(membership.id)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isProcessing && processingType === 'activating'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isProcessing && processingType === 'activating' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Recibir'
            )}
          </button>
          
          {/* Botón de cancelar (si es candidato) */}
          {(isCandidateForCancellation || membership.canCancel) && (
            <button
              onClick={() => onCancel && onCancel(membership.id)}
              disabled={isProcessing || !onCancel}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                isProcessing && processingType === 'cancelling'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : isVeryOld
                    ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                    : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
              }`}
              title={onCancel ? "Cancelar - Cliente no llegó" : "Funcionalidad en desarrollo"}
            >
              {isProcessing && processingType === 'cancelling' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashMembershipListItem;