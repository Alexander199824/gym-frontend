// src/pages/dashboard/components/PaymentsManager/components/CashMembershipListItem.js
// Author: Alexander Echeverria
// Componente de item para membresías en efectivo pendientes (vista lista)
// Versión compacta horizontal para mostrar múltiples membresías de forma eficiente

import React from 'react';
import { 
  CheckCircle, Timer, Bird, Mail, Phone, Loader2,
  CreditCard, Calendar, User 
} from 'lucide-react';

const CashMembershipListItem = ({ 
  membership, 
  onActivate, 
  isProcessing, 
  formatCurrency, 
  formatDate,
  showSuccess,
  showError 
}) => {
  
  // Determinar si es urgente basado en tiempo de espera
  const isUrgent = (membership.hoursWaiting || 0) > 4;
  
  // Manejar la activación de la membresía
  const handleActivation = () => {
    onActivate(membership.id, showSuccess, showError, formatCurrency);
  };
  
  // Generar iniciales del usuario
  const getUserInitials = () => {
    if (!membership.user?.name) return 'A';
    const names = membership.user.name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}` 
      : names[0][0];
  };

  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
      isUrgent ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        
        {/* Información principal */}
        <div className="flex items-center flex-1 min-w-0">
          
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <span className="text-lg font-bold text-green-700">
              {getUserInitials()}
            </span>
          </div>
          
          {/* Detalles del cliente y membresía */}
          <div className="flex-1 min-w-0">
            
            {/* Línea superior: Nombre y tiempo de espera */}
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {membership.user?.name || 'Cliente Anónimo'}
              </h3>
              
              {isUrgent && (
                <div className="flex items-center text-orange-600 text-sm ml-2">
                  <Timer className="w-4 h-4 mr-1" />
                  <span className="font-medium">
                    {membership.hoursWaiting?.toFixed(1) || '0.0'}h
                  </span>
                </div>
              )}
            </div>
            
            {/* Línea inferior: Información detallada */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              
              {/* Plan */}
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                <span className="truncate max-w-32" title={membership.plan?.name || 'Plan personalizado'}>
                  {membership.plan?.name || 'Plan personalizado'}
                </span>
              </div>
              
              {/* Precio */}
              <div className="flex items-center font-semibold text-green-600">
                <Bird className="w-4 h-4 mr-1" />
                <span>{formatCurrency(membership.price)}</span>
              </div>
              
              {/* Fecha de creación */}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(membership.createdAt, 'dd/MM HH:mm')}</span>
              </div>
              
              {/* Email */}
              {membership.user?.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  <span className="truncate max-w-40" title={membership.user.email}>
                    {membership.user.email}
                  </span>
                </div>
              )}
              
              {/* Teléfono */}
              {membership.user?.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{membership.user.phone}</span>
                </div>
              )}
            </div>
            
            {/* Información adicional si no es urgente */}
            {!isUrgent && (membership.hoursWaiting || 0) > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Esperando {membership.hoursWaiting?.toFixed(1) || '0.0'} horas
              </div>
            )}
          </div>
        </div>
        
        {/* Botón de acción */}
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleActivation}
            disabled={isProcessing || !membership.canActivate}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center text-sm ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : (membership.canActivate !== false)
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Recibir Efectivo
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Información adicional expandida para casos especiales */}
      {membership.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Notas:</span> {membership.notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashMembershipListItem;

// Este componente representa una membresía pendiente de pago en efectivo en formato de lista
// Diseñado para vista compacta que permite mostrar muchas membresías de forma eficiente
// Mantiene la información esencial visible y permite activación rápida