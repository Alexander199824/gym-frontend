// src/pages/dashboard/components/PaymentsManager/components/CashMembershipCard.js
// Author: Alexander Echeverria
// Componente de tarjeta para membresías en efectivo pendientes (vista grid)
// Muestra información detallada del cliente, plan y permite activación de membresía

import React from 'react';
import { 
  CheckCircle, Timer, Bird, Mail, Phone, Loader2, 
  CreditCard, Calendar 
} from 'lucide-react';

const CashMembershipCard = ({ 
  membership, 
  onActivate, 
  isProcessing = false, 
  formatCurrency,
  formatDate,
  showSuccess,
  showError 
}) => {
  
  // Determinar si es urgente basado en tiempo de espera
  const isUrgent = (membership.hoursWaiting || 0) > 4;
  
  // Manejar la activación de la membresía
  const handleActivation = () => {
    if (onActivate && formatCurrency) {
      onActivate(membership.id, showSuccess, showError, formatCurrency);
    }
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
    <div className={`bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ${
      isUrgent ? 'ring-2 ring-orange-200 border-orange-300' : 'border-gray-200'
    }`}>
      
      {/* Header con indicador de urgencia */}
      {isUrgent && (
        <div className="bg-orange-50 px-4 py-2 border-b border-orange-200">
          <div className="flex items-center text-orange-700 text-sm">
            <Timer className="w-4 h-4 mr-1" />
            <span className="font-medium">
              Esperando {membership.hoursWaiting?.toFixed(1) || '0.0'} horas
            </span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        
        {/* Información del cliente */}
        <div className="flex items-center mb-4">
          
          {/* Avatar con iniciales */}
          <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-xl font-bold text-green-700">
              {getUserInitials()}
            </span>
          </div>
          
          {/* Datos del cliente */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {membership.user?.name || 'Cliente Anónimo'}
            </h3>
            
            <div className="text-sm text-gray-500 space-y-1">
              {membership.user?.email && (
                <div className="flex items-center truncate">
                  <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{membership.user.email}</span>
                </div>
              )}
              
              {membership.user?.phone && (
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span>{membership.user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Detalles del plan */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            
            {/* Plan */}
            <div>
              <div className="text-gray-500 mb-1">Plan</div>
              <div className="font-medium text-gray-900 truncate" title={membership.plan?.name || 'Plan personalizado'}>
                {membership.plan?.name || 'Plan personalizado'}
              </div>
            </div>
            
            {/* Precio */}
            <div>
              <div className="text-gray-500 mb-1">Precio</div>
              <div className="text-xl font-bold text-green-600 flex items-center">
                <Bird className="w-4 h-4 mr-1" />
                {formatCurrency && formatCurrency(membership.price)}
              </div>
            </div>
            
            {/* Fecha de creación */}
            <div>
              <div className="text-gray-500 mb-1">Creada</div>
              <div className="text-gray-700">
                {formatDate && formatDate(membership.createdAt, 'dd/MM/yyyy')}
              </div>
            </div>
            
            {/* Tiempo de espera */}
            <div>
              <div className="text-gray-500 mb-1">Esperando</div>
              <div className={`font-medium ${isUrgent ? 'text-orange-600' : 'text-gray-700'}`}>
                {membership.hoursWaiting?.toFixed(1) || '0.0'}h
              </div>
            </div>
          </div>
        </div>
        
        {/* Horarios reservados */}
        {membership.schedule && Object.keys(membership.schedule).length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Horarios reservados:</div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="space-y-1">
                {Object.entries(membership.schedule).slice(0, 3).map(([day, slots]) => (
                  <div key={day} className="text-xs">
                    <span className="font-medium text-blue-900 capitalize">
                      {day.substring(0, 3)}:
                    </span>{' '}
                    <span className="text-blue-700">
                      {Array.isArray(slots) 
                        ? slots.map(slot => slot.timeRange || slot).join(', ')
                        : 'Horario no especificado'
                      }
                    </span>
                  </div>
                ))}
                
                {Object.keys(membership.schedule).length > 3 && (
                  <div className="text-xs text-blue-600">
                    +{Object.keys(membership.schedule).length - 3} días más...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Información adicional del plan */}
        {membership.plan?.description && (
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-medium">Descripción:</span> {membership.plan.description}
          </div>
        )}
        
        {/* Botón de activación */}
        <button
          onClick={handleActivation}
          disabled={isProcessing || !membership.canActivate}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm ${
            isProcessing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : (membership.canActivate !== false)
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105'
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
              Recibir {formatCurrency && formatCurrency(membership.price)}
            </>
          )}
        </button>
        
        {/* Información de última actualización */}
        {membership.updatedAt && membership.updatedAt !== membership.createdAt && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            Actualizada: {formatDate && formatDate(membership.updatedAt, 'dd/MM/yyyy HH:mm')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashMembershipCard;

// Este componente representa una membresía pendiente de pago en efectivo en formato de tarjeta
// Muestra toda la información relevante del cliente, plan y tiempo de espera
// Permite la activación directa de la membresía una vez recibido el pago en efectivo