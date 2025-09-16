// src/pages/dashboard/components/PaymentsManager/components/CashMembershipCard.js
// Author: Alexander Echeverria
// Componente de tarjeta para membresías en efectivo pendientes (vista grid)
// Muestra información detallada del cliente, plan y permite activación de membresía

// src/pages/dashboard/components/PaymentsManager/components/CashMembershipCard.js
// Author: Alexander Echeverria
// Componente de tarjeta para membresías en efectivo pendientes (vista grid)
// MEJORADO: Botones de "Confirmar" y "Anular" siempre visibles y mejor integrados

import React, { useState } from 'react';
import { 
  CheckCircle, Timer, Bird, Mail, Phone, Loader2, CreditCard, 
  Calendar, X, AlertTriangle, User, Clock, Building, FileText,
  MapPin, Eye, EyeOff, ChevronDown, ChevronUp, Check, Ban
} from 'lucide-react';

const CashMembershipCard = ({ 
  membership, 
  onActivate, 
  onCancel,
  isProcessing = false,
  processingType = null,
  formatCurrency,
  formatDate,
  showSuccess,
  showError 
}) => {

  // Estado para expandir/contraer información detallada
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Función para obtener configuración del estado del pago
  const getStatusConfig = (status) => {
    const configs = {
      completed: { label: 'Completado', color: 'text-green-600', bg: 'bg-green-100', icon: Check },
      pending: { label: 'Pendiente', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
      failed: { label: 'Fallido', color: 'text-red-600', bg: 'bg-red-100', icon: X },
      cancelled: { label: 'Cancelado', color: 'text-gray-600', bg: 'bg-gray-100', icon: X },
      waiting_payment: { label: 'Esperando Pago', color: 'text-orange-600', bg: 'bg-orange-100', icon: Timer }
    };
    return configs[status] || configs.pending;
  };
  
  // Determinar si es candidato a cancelar (no urgente)
  const isCandidateForCancellation = (membership.hoursWaiting || 0) > 24;
  const isVeryOld = (membership.hoursWaiting || 0) > 48;
  
  // MEJORADO: Siempre considerar que los pagos en efectivo son pendientes por defecto
  const effectiveStatus = membership.status || 'pending';
  const statusConfig = getStatusConfig(effectiveStatus);
  const StatusIcon = statusConfig.icon;
  
  // MEJORADO: Determinar si puede ser procesado (más permisivo)
  const canProcess = effectiveStatus === 'pending' || 
                    effectiveStatus === 'waiting_payment' || 
                    !membership.status; // Si no tiene status, asumimos que es pendiente
  
  // Manejar la confirmación del pago (activación de la membresía)
  const handleConfirmPayment = () => {
    if (!onActivate) {
      console.warn('No se proporcionó función onActivate');
      showError && showError('Función de activación no disponible');
      return;
    }
    
    if (isProcessing) {
      console.log('Ya se está procesando esta membresía');
      return;
    }
    
    // Llamar a la función con todos los parámetros necesarios
    onActivate(membership.id, showSuccess, showError, formatCurrency);
  };
  
  // Manejar la anulación de la membresía
  const handleCancelPayment = () => {
    if (!onCancel) {
      console.warn('No se proporcionó función onCancel');
      showError && showError('Función de cancelación no disponible');
      return;
    }
    
    if (isProcessing) {
      console.log('Ya se está procesando esta membresía');
      return;
    }
    
    // Llamar a la función con todos los parámetros necesarios
    onCancel(membership.id, showSuccess, showError, formatCurrency);
  };
  
  // Generar iniciales del usuario
  const getUserInitials = () => {
    if (!membership.user?.name) return 'A';
    const names = membership.user.name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}` 
      : names[0][0];
  };

  // Función para obtener clase CSS según tiempo de espera
  const getCardClasses = () => {
    if (isVeryOld) {
      return 'bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ring-2 ring-red-200 border-red-300';
    } else if (isCandidateForCancellation) {
      return 'bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ring-2 ring-orange-200 border-orange-300';
    }
    return 'bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border-gray-200';
  };

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
    <div className={getCardClasses()}>
      
      {/* Header con indicador de tiempo */}
      {isCandidateForCancellation && (
        <div className={`px-4 py-2 border-b ${
          isVeryOld 
            ? 'bg-red-50 border-red-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className={`flex items-center justify-between text-sm ${
            isVeryOld ? 'text-red-700' : 'text-orange-700'
          }`}>
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {isVeryOld 
                  ? `Muy antiguo: ${membership.hoursWaiting?.toFixed(1) || '0.0'} horas`
                  : `Esperando: ${membership.hoursWaiting?.toFixed(1) || '0.0'} horas`
                }
              </span>
            </div>
            <span className="text-xs">
              {isVeryOld ? 'Considerar anular' : 'Evaluar anular'}
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {membership.user?.name || 'Cliente Anónimo'}
              </h3>
              
              {/* Badge de estado del pago */}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </span>
            </div>
            
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

          {/* Botón para expandir/contraer */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? 'Contraer información' : 'Ver más información'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Detalles del plan - información básica */}
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
                {formatDate && formatDate(membership.createdAt, 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
            
            {/* Tiempo de espera */}
            <div>
              <div className="text-gray-500 mb-1">Esperando</div>
              <div className={`font-medium ${
                isVeryOld ? 'text-red-600' : 
                isCandidateForCancellation ? 'text-orange-600' : 
                'text-gray-700'
              }`}>
                {membership.hoursWaiting?.toFixed(1) || '0.0'}h
              </div>
            </div>
          </div>
        </div>

        {/* Información expandida */}
        {isExpanded && (
          <div className="space-y-4 mb-4">
            
            {/* Información del estado del pago */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <StatusIcon className="w-4 h-4 mr-2" />
                Estado del Pago
              </h5>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Estado actual:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Descripción:</span>
                  <div className="text-gray-600 mt-1">
                    {canProcess ? 
                      'Cliente puede llegar cuando guste a realizar el pago en efectivo' :
                     effectiveStatus === 'completed' ? 
                      'Pago en efectivo recibido y membresía activada' :
                     effectiveStatus === 'cancelled' ? 
                      'Membresía cancelada - Cliente no llegó a pagar' :
                     effectiveStatus === 'failed' ? 
                      'El pago no pudo ser procesado' :
                      'Estado del pago en efectivo'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Información temporal detallada */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Información Temporal
              </h5>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Fecha de creación</div>
                    <div className="text-gray-600">
                      {formatDetailedTime(membership.createdAt)}
                    </div>
                  </div>
                </div>
                
                {membership.updatedAt && membership.updatedAt !== membership.createdAt && (
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Última actualización</div>
                      <div className="text-gray-600">
                        {formatDetailedTime(membership.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-2">
                  <Timer className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Estado actual</div>
                    <div className="text-gray-600">
                      Cliente puede llegar cuando guste durante el día
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de membresía detallada */}
            {(membership.plan?.description || membership.membership) && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Detalles de la Membresía
                </h5>
                
                <div className="space-y-2 text-sm">
                  {membership.plan?.description && (
                    <div>
                      <span className="font-medium text-gray-700">Descripción del plan:</span>
                      <div className="text-gray-600 mt-1">{membership.plan.description}</div>
                    </div>
                  )}
                  
                  {membership.membership && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {membership.membership.startDate && (
                        <div>
                          <span className="font-medium text-gray-700">Fecha de inicio:</span>
                          <div className="text-gray-600">
                            {formatDate && formatDate(membership.membership.startDate, 'dd/MM/yyyy')}
                          </div>
                        </div>
                      )}
                      
                      {membership.membership.endDate && (
                        <div>
                          <span className="font-medium text-gray-700">Fecha de vencimiento:</span>
                          <div className="text-gray-600">
                            {formatDate && formatDate(membership.membership.endDate, 'dd/MM/yyyy')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Horarios reservados */}
            {membership.schedule && Object.keys(membership.schedule).length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Horarios Reservados
                </h5>
                
                <div className="space-y-2">
                  {Object.entries(membership.schedule).map(([day, slots]) => (
                    <div key={day} className="flex items-center space-x-3 text-sm">
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
                </div>
              </div>
            )}

            {/* Información de quién registró */}
            {membership.registeredByUser && (
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Información de Registro
                </h5>
                
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Registrado por:</span>
                    <div className="text-gray-600">
                      {membership.registeredByUser.firstName} {membership.registeredByUser.lastName}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Rol:</span>
                    <div className="text-gray-600 capitalize">{membership.registeredByUser.role}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción y notas */}
            {(membership.description || membership.notes) && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Notas y Descripción
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

            {/* Información del ID de la membresía */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 space-y-1">
                <div><span className="font-medium">ID de Membresía:</span> {membership.id}</div>
                {membership.paymentType && (
                  <div><span className="font-medium">Tipo de Pago:</span> {membership.paymentType}</div>
                )}
                <div><span className="font-medium">Estado:</span> {statusConfig.label}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* MEJORADO: Botones SIEMPRE visibles para pagos en efectivo pendientes */}
        {canProcess && (
          <div className="space-y-3 mb-4">
            
            {/* Botón CONFIRMAR - Verde */}
            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm ${
                isProcessing && processingType === 'activating'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isProcessing && processingType === 'activating' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Pago de {formatCurrency && formatCurrency(membership.price)}
                </>
              )}
            </button>
            
            {/* Botón ANULAR - Rojo */}
            <button
              onClick={handleCancelPayment}
              disabled={isProcessing}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm border-2 ${
                isProcessing && processingType === 'cancelling'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                  : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400'
              }`}
            >
              {isProcessing && processingType === 'cancelling' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Anulando...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Anular Pago
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Mensaje para pagos ya procesados */}
        {!canProcess && (
          <div className={`text-center py-3 px-4 rounded-lg text-sm ${
            effectiveStatus === 'completed' ? 'bg-green-100 text-green-800' :
            effectiveStatus === 'failed' ? 'bg-red-100 text-red-800' :
            effectiveStatus === 'cancelled' ? 'bg-gray-100 text-gray-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {effectiveStatus === 'completed' ? '✅ Pago en efectivo confirmado' :
             effectiveStatus === 'failed' ? '❌ Pago fallido' :
             effectiveStatus === 'cancelled' ? '⚪ Membresía anulada' :
             '🔄 Membresía en proceso'}
          </div>
        )}

        {/* Información adicional sobre el monto */}
        {canProcess && (
          <div className="mt-3 bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Monto a recibir: </span>
              <span className="text-lg font-bold text-blue-900">
                {formatCurrency && formatCurrency(membership.price)}
              </span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              El cliente puede llegar cuando guste durante el día
            </div>
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