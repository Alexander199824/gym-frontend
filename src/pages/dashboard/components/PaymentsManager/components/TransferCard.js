// src/pages/dashboard/components/PaymentsManager/components/TransferCard.js
// Author: Alexander Echeverria
// Componente de tarjeta para transferencias pendientes (vista grid)

// src/pages/dashboard/components/PaymentsManager/components/TransferCard.js
// Author: Alexander Echeverria
// Componente de tarjeta para transferencias pendientes (vista grid)
// OPTIMIZADO: Completamente responsive para móvil con touch-friendly buttons

import React, { useState } from 'react';
import { 
  Check, X, Timer, Bird, Mail, Phone, Loader2, Building, 
  Calendar, User, Clock, FileText, ChevronDown, ChevronUp,
  AlertTriangle, ExternalLink, CreditCard
} from 'lucide-react';

const TransferCard = ({ 
  transfer, 
  onApprove, 
  onReject,
  isProcessing = false,
  processingType = null,
  formatCurrency,
  formatDate,
  showSuccess,
  showError 
}) => {

  // Estado para expandir/contraer información detallada
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Determinar prioridad basada en tiempo de espera
  const getPriority = () => {
    const hours = transfer.hoursWaiting || 0;
    if (hours > 24) return { level: 'critical', color: 'red', label: 'Crítica' };
    if (hours > 12) return { level: 'high', color: 'orange', label: 'Alta' };
    if (hours > 4) return { level: 'medium', color: 'yellow', label: 'Media' };
    return { level: 'normal', color: 'purple', label: 'Normal' };
  };
  
  const priority = getPriority();
  const isCritical = priority.level === 'critical';
  const isHigh = priority.level === 'high';
  const isMedium = priority.level === 'medium';
  
  // Determinar si debe mostrar header de tiempo
  const shouldShowTimeHeader = (transfer.hoursWaiting || 0) > 0;
  
  // Manejar la aprobación de la transferencia
  const handleApproval = () => {
    if (onApprove && formatCurrency) {
      onApprove(transfer.id, true, showSuccess, showError);
    }
  };
  
  // Manejar el rechazo de la transferencia
  const handleRejection = () => {
    if (onReject && formatCurrency) {
      onReject(transfer.id, false, showSuccess, showError);
    }
  };
  
  // Generar iniciales del usuario
  const getUserInitials = () => {
    if (!transfer.user?.name) return 'T';
    const names = transfer.user.name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}` 
      : names[0][0];
  };

  // Función para obtener clase CSS según prioridad
  const getCardClasses = () => {
    if (isCritical) {
      return 'bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ring-2 ring-red-200 border-red-300';
    } else if (isHigh) {
      return 'bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ring-2 ring-orange-200 border-orange-300';
    } else if (isMedium) {
      return 'bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ring-2 ring-yellow-200 border-yellow-300';
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
      
      {/* Header con indicador de tiempo - RESPONSIVE */}
      {shouldShowTimeHeader && (
        <div className={`px-4 py-2 sm:py-3 border-b ${
          isCritical 
            ? 'bg-red-50 border-red-200' 
            : isHigh
              ? 'bg-orange-50 border-orange-200'
              : isMedium
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-purple-50 border-purple-200'
        }`}>
          <div className={`flex items-center justify-between text-sm ${
            isCritical ? 'text-red-700' : 
            isHigh ? 'text-orange-700' : 
            isMedium ? 'text-yellow-700' : 
            'text-purple-700'
          }`}>
            <div className="flex items-center min-w-0">
              <Timer className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="font-medium truncate">
                {isCritical 
                  ? `Crítica: ${transfer.hoursWaiting?.toFixed(1) || '0.0'} horas`
                  : isHigh
                    ? `Alta prioridad: ${transfer.hoursWaiting?.toFixed(1) || '0.0'} horas`
                    : isMedium
                      ? `Prioridad media: ${transfer.hoursWaiting?.toFixed(1) || '0.0'} horas`
                      : `Esperando: ${transfer.hoursWaiting?.toFixed(1) || '0.0'} horas`
                }
              </span>
            </div>
            <span className="text-xs whitespace-nowrap ml-2">
              {isCritical ? 'Requiere atención inmediata' : 
               isHigh ? 'Revisar pronto' : 
               isMedium ? 'Revisar cuando sea posible' :
               'Recién recibida'}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        
        {/* Información del cliente - OPTIMIZADO PARA MÓVIL */}
        <div className="flex items-start mb-4 space-x-3">
          
          {/* Avatar con iniciales */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg sm:text-xl font-bold text-purple-700">
              {getUserInitials()}
            </span>
          </div>
          
          {/* Datos del cliente */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight pr-2">
              {transfer.user?.name || 
               `${transfer.user?.firstName || ''} ${transfer.user?.lastName || ''}`.trim() || 
               'Cliente Anónimo'}
            </h3>
            
            <div className="text-sm text-gray-500 space-y-1 mt-1">
              {transfer.user?.email && (
                <div className="flex items-center min-w-0">
                  <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{transfer.user.email}</span>
                </div>
              )}
              
              {transfer.reference && (
                <div className="flex items-center">
                  <CreditCard className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="font-mono text-xs">{transfer.reference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botón para expandir/contraer - MEJORADO PARA TOUCH */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50 flex-shrink-0"
            title={isExpanded ? 'Contraer información' : 'Ver más información'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Detalles de la transferencia - OPTIMIZADO PARA MÓVIL */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            
            {/* Monto */}
            <div className="col-span-2">
              <div className="text-gray-500 mb-1">Monto a transferir</div>
              <div className="text-lg sm:text-2xl font-bold text-purple-600 flex items-center">
                <Bird className="w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {formatCurrency && formatCurrency(transfer.amount)}
                </span>
              </div>
            </div>
            
            {/* Fecha de transferencia */}
            <div>
              <div className="text-gray-500 mb-1">Fecha</div>
              <div className="text-gray-700 text-xs sm:text-sm">
                {formatDate && formatDate(transfer.paymentDate || transfer.createdAt, 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
            
            {/* Tiempo de espera */}
            <div>
              <div className="text-gray-500 mb-1">Esperando</div>
              <div className={`font-medium ${
                isCritical ? 'text-red-600' : 
                isHigh ? 'text-orange-600' : 
                isMedium ? 'text-yellow-600' :
                'text-purple-600'
              }`}>
                {transfer.hoursWaiting?.toFixed(1) || '0.0'}h
              </div>
            </div>
          </div>
        </div>

        {/* Información expandida */}
        {isExpanded && (
          <div className="space-y-4 mb-4">
            
            {/* Información temporal detallada */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Información Temporal
              </h5>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">Fecha de transferencia</div>
                    <div className="text-gray-600 text-xs sm:text-sm break-words">
                      {formatDetailedTime(transfer.paymentDate || transfer.createdAt)}
                    </div>
                  </div>
                </div>
                
                {transfer.updatedAt && transfer.updatedAt !== transfer.createdAt && (
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">Última actualización</div>
                      <div className="text-gray-600 text-xs sm:text-sm break-words">
                        {formatDetailedTime(transfer.updatedAt)}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-2">
                  <Timer className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Estado actual</div>
                    <div className="text-gray-600 text-xs sm:text-sm">
                      Esperando validación del comprobante
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de membresía detallada */}
            {transfer.membership && (
              <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Detalles de la Membresía
                </h5>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              </div>
            )}

            {/* Información de quién registró */}
            {transfer.registeredByUser && (
              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Información de Registro
                </h5>
                
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Registrado por:</span>
                    <div className="text-gray-600 text-xs sm:text-sm">
                      {transfer.registeredByUser.firstName} {transfer.registeredByUser.lastName}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Rol:</span>
                    <div className="text-gray-600 text-xs sm:text-sm capitalize">{transfer.registeredByUser.role}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción y notas */}
            {(transfer.description || transfer.notes) && (
              <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Notas y Descripción
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

            {/* ID de la transferencia - COMPACTO */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 space-y-1">
                <div><span className="font-medium">ID:</span> {transfer.id}</div>
                {transfer.reference && (
                  <div><span className="font-medium">Referencia:</span> {transfer.reference}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comprobante de transferencia - OPTIMIZADO PARA MÓVIL */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Comprobante de Transferencia
          </h5>
          
          {transfer.transferProof ? (
            <div className="space-y-2">
              {/* Vista previa del comprobante - RESPONSIVE */}
              <div className="w-full h-20 sm:h-24 bg-white rounded border overflow-hidden">
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
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver comprobante completo
              </a>
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Sin comprobante subido</p>
            </div>
          )}
        </div>
        
        {/* Botones de acción - OPTIMIZADOS PARA MÓVIL */}
        <div className="space-y-3">
          
          {/* Botón principal: Aprobar - TOUCH-FRIENDLY */}
          <button
            onClick={handleApproval}
            disabled={isProcessing}
            className={`w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-medium transition-all flex items-center justify-center text-sm sm:text-base ${
              isProcessing && processingType === 'approving'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl active:scale-95'
            }`}
          >
            {isProcessing && processingType === 'approving' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Aprobando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  Aprobar {formatCurrency && formatCurrency(transfer.amount)}
                </span>
              </>
            )}
          </button>
          
          {/* Botón secundario: Rechazar - TOUCH-FRIENDLY */}
          <button
            onClick={handleRejection}
            disabled={isProcessing}
            className={`w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-medium transition-all flex items-center justify-center text-sm sm:text-base border-2 ${
              isProcessing && processingType === 'rejecting'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400 active:scale-95'
            }`}
          >
            {isProcessing && processingType === 'rejecting' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Rechazando...</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Rechazar transferencia</span>
              </>
            )}
          </button>
        </div>
        
        {/* Nota explicativa */}
        <div className="mt-3 text-xs text-center text-gray-500 italic">
          Revisa cuidadosamente el comprobante antes de aprobar la transferencia
        </div>
      </div>
    </div>
  );
};

export default TransferCard;