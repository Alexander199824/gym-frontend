// src/pages/dashboard/components/PaymentsManager/components/CashMembershipListItem.js
// Author: Alexander Echeverria
// Componente de item para membresías en efectivo pendientes (vista lista)
// Versión compacta horizontal para mostrar múltiples membresías de forma eficiente

// src/pages/dashboard/components/PaymentsManager/components/CashMembershipListItem.js
// Author: Alexander Echeverria
// Componente de item para membresías en efectivo pendientes (vista lista)
// MEJORADO: Ahora incluye información expandible como la tarjeta

import React, { useState } from 'react';
import { 
  CheckCircle, Timer, Bird, Phone, Mail, Loader2, X, 
  ChevronDown, ChevronUp, Calendar, User, Clock, Building, 
  FileText, CreditCard
} from 'lucide-react';

const CashMembershipListItem = ({ 
  membership, 
  onActivate, 
  onCancel,
  isProcessing = false,
  processingType = null,
  formatCurrency,
  formatDate 
}) => {

  // Estado para expandir/contraer información detallada
  const [isExpanded, setIsExpanded] = useState(false);

  const isCandidateForCancellation = (membership.hoursWaiting || 0) > 24;
  const isVeryOld = (membership.hoursWaiting || 0) > 48;

  // Función para formatear tiempo de forma más detallada
  const formatDetailedTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    const formattedDate = formatDate ? formatDate(dateString, 'dd/MM/yyyy HH:mm') : date.toLocaleString();
    
    let timeAgo = '';
    if (diffDays > 0) {
      timeAgo = `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      timeAgo = `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      timeAgo = `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else {
      timeAgo = 'ahora mismo';
    }
    
    return `${formattedDate} (${timeAgo})`;
  };

  return (
    <div className={`bg-white border rounded-lg transition-all duration-200 ${
      isVeryOld ? 'border-red-300 bg-red-50' : 
      isCandidateForCancellation ? 'border-orange-300 bg-orange-50' : 
      'border-gray-200 hover:shadow-md'
    }`}>
      
      {/* Header principal (siempre visible) */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <span className="text-lg font-bold text-green-700">
                {membership.user?.name?.[0] || 'A'}
              </span>
            </div>
            
            {/* Información principal */}
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
                
                <span className="text-gray-500">
                  {membership.plan?.name || 'Plan personalizado'}
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
          
          {/* Controles del lado derecho */}
          <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
            
            {/* Botón de expandir */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={isExpanded ? 'Contraer información' : 'Ver más información'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
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

      {/* Información expandida */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-4 pt-4">
            
            {/* Información del cliente detallada */}
            <div className="bg-white rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Información del Cliente
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                
                {/* Email */}
                {membership.user?.email && (
                  <div className="flex items-start space-x-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Email</div>
                      <div className="text-gray-600 break-all">{membership.user.email}</div>
                    </div>
                  </div>
                )}
                
                {/* Teléfono */}
                {membership.user?.phone && (
                  <div className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Teléfono</div>
                      <div className="text-gray-600">{membership.user.phone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información temporal */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Información Temporal
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Fecha de creación</div>
                    <div className="text-gray-600">
                      {formatDetailedTime(membership.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Timer className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Tiempo esperando</div>
                    <div className={`font-medium ${
                      isVeryOld ? 'text-red-600' : 
                      isCandidateForCancellation ? 'text-orange-600' : 
                      'text-gray-600'
                    }`}>
                      {membership.hoursWaiting?.toFixed(1) || '0.0'} horas
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del plan */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Detalles del Plan
              </h5>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Plan:</span>
                  <span className="ml-2 text-gray-600">{membership.plan?.name || 'Plan personalizado'}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Precio:</span>
                  <span className="ml-2 text-green-600 font-semibold">
                    {formatCurrency && formatCurrency(membership.price)}
                  </span>
                </div>
                
                {membership.plan?.description && (
                  <div>
                    <span className="font-medium text-gray-700">Descripción:</span>
                    <div className="text-gray-600 mt-1">{membership.plan.description}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Horarios (si existen) */}
            {membership.schedule && Object.keys(membership.schedule).length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Horarios Reservados
                </h5>
                
                <div className="space-y-1 text-sm">
                  {Object.entries(membership.schedule).slice(0, 3).map(([day, slots]) => (
                    <div key={day} className="flex items-center space-x-3">
                      <span className="font-medium text-indigo-900 capitalize min-w-[80px]">
                        {day}:
                      </span>
                      <span className="text-indigo-700">
                        {Array.isArray(slots) 
                          ? slots.map(slot => slot.timeRange || slot).join(', ')
                          : 'Horario no especificado'
                        }
                      </span>
                    </div>
                  ))}
                  
                  {Object.keys(membership.schedule).length > 3 && (
                    <div className="text-xs text-indigo-600 mt-2">
                      +{Object.keys(membership.schedule).length - 3} días más...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información de quien registró */}
            {membership.registeredByUser && (
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Registrado por
                </h5>
                
                <div className="text-sm">
                  <span className="text-gray-600">
                    {membership.registeredByUser.firstName} {membership.registeredByUser.lastName}
                    <span className="text-gray-400 ml-2">({membership.registeredByUser.role})</span>
                  </span>
                </div>
              </div>
            )}

            {/* Notas y descripción */}
            {(membership.description || membership.notes) && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Notas
                </h5>
                
                <div className="space-y-2 text-sm">
                  {membership.description && (
                    <div>
                      <span className="font-medium text-gray-700">Descripción:</span>
                      <div className="text-gray-600 mt-1">{membership.description}</div>
                    </div>
                  )}
                  
                  {membership.notes && (
                    <div>
                      <span className="font-medium text-gray-700">Notas:</span>
                      <div className="text-gray-600 mt-1">{membership.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ID y información técnica */}
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-500 space-y-1">
                <div><span className="font-medium">ID:</span> {membership.id}</div>
                {membership.paymentType && (
                  <div><span className="font-medium">Tipo:</span> {membership.paymentType}</div>
                )}
              </div>
            </div>

            {/* Nota sobre la naturaleza del efectivo */}
            <div className="text-xs text-center text-gray-500 italic bg-white rounded-lg p-3">
              El cliente puede llegar a pagar cuando guste durante el día
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashMembershipListItem;