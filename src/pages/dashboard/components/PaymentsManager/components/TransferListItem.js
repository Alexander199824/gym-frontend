// src/pages/dashboard/components/PaymentsManager/components/TransferListItem.js
// Author: Alexander Echeverria
// Componente de item para transferencias pendientes (vista lista)
// NUEVO: Basado en CashMembershipListItem pero adaptado para transferencias

// src/pages/dashboard/components/PaymentsManager/components/TransferListItem.js
// Author: Alexander Echeverria
// Componente de item para transferencias pendientes (vista lista)
// OPTIMIZADO: Completamente responsive para móvil con layout adaptativo

import React, { useState } from 'react';
import { 
  Check, X, Timer, Bird, Phone, Mail, Loader2, Building,
  ChevronDown, ChevronUp, Calendar, User, Clock, 
  FileText, CreditCard, ExternalLink
} from 'lucide-react';

const TransferListItem = ({ 
  transfer, 
  onApprove, 
  onReject,
  isProcessing = false,
  processingType = null,
  formatCurrency,
  formatDate 
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
      validating: { label: 'Validando', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock }
    };
    return configs[status] || configs.pending;
  };

  // Determinar prioridad basada en tiempo de espera
  const getPriority = () => {
    const hours = transfer.hoursWaiting || 0;
    if (hours > 24) return { level: 'critical', color: 'red', label: 'Crítica' };
    if (hours > 12) return { level: 'high', color: 'orange', label: 'Alta' };
    if (hours > 4) return { level: 'medium', color: 'yellow', label: 'Media' };
    return { level: 'normal', color: 'purple', label: 'Normal' };
  };

  const priority = getPriority();
  const statusConfig = getStatusConfig(transfer.status || 'pending');
  const StatusIcon = statusConfig.icon;
  const isCritical = priority.level === 'critical';
  const isHigh = priority.level === 'high';
  const isMedium = priority.level === 'medium';
  
  // Mostrar tiempo si existe
  const hasWaitingTime = (transfer.hoursWaiting || 0) > 0;

  // Función para formatear tiempo de forma detallada
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
      isCritical ? 'border-red-300 bg-red-50' : 
      isHigh ? 'border-orange-300 bg-orange-50' : 
      isMedium ? 'border-yellow-300 bg-yellow-50' :
      'border-gray-200 hover:shadow-md'
    }`}>
      
      {/* Header principal (siempre visible) - OPTIMIZADO PARA MÓVIL */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            
            {/* Avatar */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <span className="text-sm sm:text-lg font-bold text-purple-700">
                {transfer.user?.name?.[0] || transfer.user?.firstName?.[0] || 'T'}
              </span>
            </div>
            
            {/* Información principal */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {transfer.user?.name || 
                     `${transfer.user?.firstName || ''} ${transfer.user?.lastName || ''}`.trim() || 
                     'Cliente Anónimo'}
                  </h3>
                  
                  {/* Badge de estado del pago */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusConfig.color} ${statusConfig.bg}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">{statusConfig.label}</span>
                    <span className="sm:hidden">
                      {statusConfig.label === 'Pendiente' ? 'Pend.' : statusConfig.label.slice(0, 4)}
                    </span>
                  </span>
                </div>
                
                {/* Mostrar tiempo SIEMPRE que exista */}
                {hasWaitingTime && (
                  <div className={`flex items-center text-sm mt-1 sm:mt-0 sm:ml-2 ${
                    isCritical ? 'text-red-600' : 
                    isHigh ? 'text-orange-600' : 
                    isMedium ? 'text-yellow-600' :
                    'text-purple-600'
                  }`}>
                    <Timer className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span>{transfer.hoursWaiting?.toFixed(1) || '0.0'}h</span>
                    {/* Indicador de prioridad para móvil */}
                    {isCritical && <span className="ml-1 text-xs font-bold sm:hidden">CRÍTICA</span>}
                    {isHigh && <span className="ml-1 text-xs font-bold sm:hidden">ALTA</span>}
                    {isMedium && <span className="ml-1 text-xs font-bold sm:hidden">MEDIA</span>}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-gray-600">
                <span className="font-semibold text-purple-600 flex items-center">
                  <Bird className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{formatCurrency && formatCurrency(transfer.amount)}</span>
                </span>
                
                {transfer.reference && (
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                    {transfer.reference}
                  </span>
                )}
                
                {transfer.user?.email && (
                  <span className="truncate min-w-0 sm:max-w-40">
                    <Mail className="w-3 h-3 inline mr-1" />
                    {transfer.user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Controles del lado derecho */}
          <div className="ml-2 sm:ml-4 flex-shrink-0 flex items-center space-x-2">
            
            {/* Botón de expandir */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
              title={isExpanded ? 'Contraer información' : 'Ver más información'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {/* Botones de acción - Solo mostrar si está pendiente */}
            {transfer.status === 'pending' && (
              <>
                {/* Botón de aprobar */}
                <button
                  onClick={() => onApprove && onApprove(transfer.id, true)}
                  disabled={isProcessing}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isProcessing && processingType === 'approving'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                  }`}
                >
                  {isProcessing && processingType === 'approving' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Aprobar</span>
                    </>
                  )}
                </button>
                
                {/* Botón de rechazar */}
                <button
                  onClick={() => onReject && onReject(transfer.id, false)}
                  disabled={isProcessing}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    isProcessing && processingType === 'rejecting'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 active:scale-95'
                  }`}
                >
                  {isProcessing && processingType === 'rejecting' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
            
            {/* Indicador para pagos ya procesados */}
            {transfer.status !== 'pending' && (
              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                transfer.status === 'completed' ? 'bg-green-100 text-green-800' :
                transfer.status === 'failed' ? 'bg-red-100 text-red-800' :
                transfer.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {transfer.status === 'completed' ? 'Completada' :
                 transfer.status === 'failed' ? 'Fallida' :
                 transfer.status === 'cancelled' ? 'Cancelada' :
                 'En proceso'}
              </div>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                
                {/* Email */}
                {transfer.user?.email && (
                  <div className="flex items-start space-x-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">Email</div>
                      <div className="text-gray-600 break-all">{transfer.user.email}</div>
                    </div>
                  </div>
                )}
                
                {/* Teléfono */}
                {transfer.user?.phone && (
                  <div className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Teléfono</div>
                      <div className="text-gray-600">{transfer.user.phone}</div>
                    </div>
                  </div>
                )}
                
                {/* Referencia */}
                {transfer.reference && (
                  <div className="flex items-start space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Referencia</div>
                      <div className="text-gray-600 font-mono text-xs sm:text-sm">{transfer.reference}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información temporal MEJORADA */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Información Temporal Detallada
              </h5>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">Fecha de transferencia</div>
                    <div className="text-gray-600 text-xs sm:text-sm break-words">
                      {formatDetailedTime(transfer.paymentDate || transfer.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Timer className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    isCritical ? 'text-red-500' : 
                    isHigh ? 'text-orange-500' : 
                    isMedium ? 'text-yellow-500' :
                    'text-purple-500'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">Tiempo esperando</div>
                    <div className={`font-medium ${
                      isCritical ? 'text-red-600' : 
                      isHigh ? 'text-orange-600' : 
                      isMedium ? 'text-yellow-600' :
                      'text-purple-600'
                    }`}>
                      {transfer.hoursWaiting?.toFixed(1) || '0.0'} horas
                    </div>
                    {/* Descripción de prioridad */}
                    <div className="text-xs text-gray-500 mt-1">
                      {isCritical ? 'Requiere atención inmediata' :
                       isHigh ? 'Revisar pronto' :
                       isMedium ? 'Revisar cuando sea posible' :
                       'Recién recibida'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                  <div className="text-gray-600 mt-1 text-xs sm:text-sm">
                    {transfer.status === 'pending' ? 'Esperando validación del comprobante de transferencia' :
                     transfer.status === 'validating' ? 'Transferencia en proceso de validación' :
                     transfer.status === 'completed' ? 'Transferencia procesada y completada exitosamente' :
                     transfer.status === 'failed' ? 'La transferencia no pudo ser procesada' :
                     transfer.status === 'cancelled' ? 'Transferencia cancelada por el administrador' :
                     'Estado desconocido del pago'}
                  </div>
                </div>
              </div>
            </div>

            {/* Comprobante de transferencia - RESPONSIVE */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Comprobante de Transferencia
              </h5>
              
              {transfer.transferProof ? (
                <div className="space-y-3">
                  {/* Vista previa del comprobante - ADAPTATIVA */}
                  <div className="w-full max-w-xs h-20 sm:h-24 bg-white rounded border overflow-hidden">
                    <img
                      src={transfer.transferProof}
                      alt="Comprobante"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(transfer.transferProof, '_blank')}
                    />
                  </div>
                  <a 
                    href={transfer.transferProof} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ver comprobante completo
                  </a>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Sin comprobante subido</p>
                </div>
              )}
            </div>

            {/* Información de membresía */}
            {transfer.membership && (
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Membresía Asociada
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">Tipo</div>
                    <div className="text-gray-600 text-xs sm:text-sm">{transfer.membership.type}</div>
                  </div>
                  {transfer.membership.startDate && (
                    <div>
                      <div className="font-medium text-gray-900">Inicio</div>
                      <div className="text-gray-600 text-xs sm:text-sm">
                        {formatDate && formatDate(transfer.membership.startDate, 'dd/MM/yyyy')}
                      </div>
                    </div>
                  )}
                  {transfer.membership.endDate && (
                    <div>
                      <div className="font-medium text-gray-900">Vencimiento</div>
                      <div className="text-gray-600 text-xs sm:text-sm">
                        {formatDate && formatDate(transfer.membership.endDate, 'dd/MM/yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información de quien registró */}
            {transfer.registeredByUser && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Registrado por
                </h5>
                
                <div className="text-sm">
                  <span className="text-gray-600">
                    {transfer.registeredByUser.firstName} {transfer.registeredByUser.lastName}
                    <span className="text-gray-400 ml-2">({transfer.registeredByUser.role})</span>
                  </span>
                </div>
              </div>
            )}

            {/* Descripción y notas */}
            {(transfer.description || transfer.notes) && (
              <div className="bg-orange-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Notas
                </h5>
                
                <div className="space-y-2 text-sm">
                  {transfer.description && (
                    <div>
                      <span className="font-medium text-gray-700">Descripción:</span>
                      <div className="text-gray-600 mt-1 text-xs sm:text-sm">{transfer.description}</div>
                    </div>
                  )}
                  
                  {transfer.notes && (
                    <div>
                      <span className="font-medium text-gray-700">Notas:</span>
                      <div className="text-gray-600 mt-1 text-xs sm:text-sm">{transfer.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ID y información técnica */}
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-500 space-y-1">
                <div><span className="font-medium">ID:</span> {transfer.id}</div>
                {transfer.reference && (
                  <div><span className="font-medium">Referencia:</span> {transfer.reference}</div>
                )}
                {/* Información de prioridad */}
                <div>
                  <span className="font-medium">Prioridad:</span> 
                  <span className={`ml-1 ${
                    isCritical ? 'text-red-600 font-bold' : 
                    isHigh ? 'text-orange-600 font-bold' : 
                    isMedium ? 'text-yellow-600 font-bold' :
                    'text-purple-600'
                  }`}>
                    {priority.label}
                  </span>
                </div>
                <div><span className="font-medium">Estado:</span> {statusConfig.label}</div>
              </div>
            </div>

            {/* Nota sobre validación */}
            <div className="text-xs text-center text-gray-500 italic bg-white rounded-lg p-3">
              {transfer.status === 'pending' ? 
                'Revisa cuidadosamente el comprobante antes de aprobar. Una vez aprobado, el pago se marcará como completado.' :
                'Esta transferencia ya ha sido procesada.'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferListItem;