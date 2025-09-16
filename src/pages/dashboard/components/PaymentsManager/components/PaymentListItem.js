// src/pages/dashboard/components/PaymentsManager/components/PaymentListItem.js
// Author: Alexander Echeverria
// Componente de item para pagos del historial (vista lista)
// Basado en TransferListItem pero adaptado para el historial de pagos

// src/pages/dashboard/components/PaymentsManager/components/PaymentListItem.js
// Author: Alexander Echeverria
// Componente de item para pagos del historial (vista lista)
// ACTUALIZADO: Agregados botones para confirmar/cancelar pagos pendientes

import React, { useState } from 'react';
import { 
  Check, X, Timer, Bird, Phone, Mail, Building,
  ChevronDown, ChevronUp, Calendar, User, Clock, 
  FileText, CreditCard, ExternalLink, Banknote, Smartphone, Loader2
} from 'lucide-react';

const PaymentListItem = ({ 
  payment, 
  formatCurrency,
  formatDate,
  onConfirmPayment,
  onCancelPayment,
  isProcessing = false,
  processingType = null,
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
    return configs[status] || configs.completed;
  };

  // Función para obtener configuración del método de pago
  const getPaymentMethodConfig = (method) => {
    const configs = {
      cash: { label: 'Efectivo', color: 'text-green-600', bg: 'bg-green-50', icon: Banknote },
      card: { label: 'Tarjeta', color: 'text-blue-600', bg: 'bg-blue-50', icon: CreditCard },
      transfer: { label: 'Transferencia', color: 'text-purple-600', bg: 'bg-purple-50', icon: Building },
      mobile: { label: 'Pago Móvil', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Smartphone }
    };
    return configs[method] || configs.cash;
  };

  // Función para obtener configuración del tipo de pago
  const getPaymentTypeConfig = (type) => {
    const configs = {
      membership: { label: 'Membresía', icon: Building, description: 'Pago de cuota mensual' },
      daily: { label: 'Pago Diario', icon: Calendar, description: 'Acceso por día' },
      bulk_daily: { label: 'Pago Múltiple', icon: Calendar, description: 'Varios días' },
      store_cash_delivery: { label: 'Tienda (Efectivo)', icon: Banknote, description: 'Compra en tienda' },
      store_card_delivery: { label: 'Tienda (Tarjeta)', icon: CreditCard, description: 'Compra en tienda' },
      store_online: { label: 'Tienda (Online)', icon: Building, description: 'Compra online' },
      store_transfer: { label: 'Tienda (Transferencia)', icon: Building, description: 'Compra en tienda' }
    };
    return configs[type] || configs.membership;
  };

  const statusConfig = getStatusConfig(payment.status || 'completed');
  const methodConfig = getPaymentMethodConfig(payment.paymentMethod);
  const typeConfig = getPaymentTypeConfig(payment.paymentType || payment.concept?.toLowerCase() || 'membership');
  const StatusIcon = statusConfig.icon;
  const MethodIcon = methodConfig.icon;
  const TypeIcon = typeConfig.icon;
  
  // NUEVO: Determinar si el pago está pendiente
  const isPendingPayment = payment.status === 'pending' || payment.status === 'waiting_payment';
  
  // Calcular tiempo desde el pago
  const getTimeSincePayment = () => {
    if (!payment.paymentDate && !payment.createdAt) return null;
    
    const paymentDate = new Date(payment.paymentDate || payment.createdAt);
    const now = new Date();
    const diffTime = now - paymentDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'hoy';
    }
  };

  // NUEVO: Manejar confirmación de pago
  const handleConfirmPayment = () => {
    if (onConfirmPayment && !isProcessing) {
      const clientName = payment.user?.name || 
                        `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim() || 
                        'cliente';
      onConfirmPayment(payment.id, clientName, payment.amount, showSuccess, showError);
    }
  };

  // NUEVO: Manejar cancelación de pago
  const handleCancelPayment = () => {
    if (onCancelPayment && !isProcessing) {
      const clientName = payment.user?.name || 
                        `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim() || 
                        'cliente';
      onCancelPayment(payment.id, clientName, payment.amount, showSuccess, showError);
    }
  };

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
    <div className={`bg-white border rounded-lg transition-all duration-200 hover:shadow-md ${
      isPendingPayment ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
    }`}>
      
      {/* Header principal (siempre visible) */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${methodConfig.bg}`}>
              <span className={`text-lg font-bold ${methodConfig.color}`}>
                {payment.user?.name?.[0] || payment.user?.firstName?.[0] || 'C'}
              </span>
            </div>
            
            {/* Información principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {payment.user?.name || 
                     `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim() || 
                     'Cliente Anónimo'}
                  </h3>
                  
                  {/* Badge de estado del pago */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </span>
                </div>
                
                {/* Tiempo desde el pago */}
                <div className="flex items-center text-sm text-gray-500 ml-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{getTimeSincePayment()}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className={`font-semibold ${methodConfig.color}`}>
                  <Bird className="w-4 h-4 inline mr-1" />
                  {formatCurrency && formatCurrency(payment.amount)}
                </span>
                
                <span className={`flex items-center ${methodConfig.color}`}>
                  <MethodIcon className="w-4 h-4 mr-1" />
                  {methodConfig.label}
                </span>
                
                <span className="flex items-center text-gray-500">
                  <TypeIcon className="w-4 h-4 mr-1" />
                  {typeConfig.label}
                </span>
                
                {payment.user?.email && (
                  <span className="truncate max-w-40">
                    <Mail className="w-3 h-3 inline mr-1" />
                    {payment.user.email}
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
            
            {/* NUEVO: Botones de acción para pagos pendientes */}
            {isPendingPayment && (onConfirmPayment || onCancelPayment) && (
              <>
                {/* Botón de confirmar */}
                {onConfirmPayment && (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isProcessing && processingType === 'confirming'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isProcessing && processingType === 'confirming' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirmar'
                    )}
                  </button>
                )}
                
                {/* Botón de cancelar */}
                {onCancelPayment && (
                  <button
                    onClick={handleCancelPayment}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      isProcessing && processingType === 'cancelling'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                    }`}
                  >
                    {isProcessing && processingType === 'cancelling' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </>
            )}
            
            {/* Indicador para pagos ya procesados */}
            {!isPendingPayment && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                payment.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {payment.status === 'completed' ? 'Procesado' :
                 payment.status === 'failed' ? 'Fallido' :
                 payment.status === 'cancelled' ? 'Cancelado' :
                 'Completado'}
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
            {payment.user && (
              <div className="bg-white rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Información del Cliente
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  
                  {/* Email */}
                  {payment.user.email && (
                    <div className="flex items-start space-x-2">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Email</div>
                        <div className="text-gray-600 break-all">{payment.user.email}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Teléfono */}
                  {payment.user.phone && (
                    <div className="flex items-start space-x-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Teléfono</div>
                        <div className="text-gray-600">{payment.user.phone}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Referencia */}
                  {payment.reference && (
                    <div className="flex items-start space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">Referencia</div>
                        <div className="text-gray-600 font-mono">{payment.reference}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información temporal MEJORADA */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Información Temporal Detallada
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {isPendingPayment ? 'Fecha de creación' : 'Fecha de pago'}
                    </div>
                    <div className="text-gray-600">
                      {formatDetailedTime(payment.paymentDate || payment.createdAt)}
                    </div>
                  </div>
                </div>
                
                {payment.createdAt && payment.paymentDate !== payment.createdAt && (
                  <div className="flex items-start space-x-2">
                    <Timer className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Fecha de creación</div>
                      <div className="text-gray-600">
                        {formatDetailedTime(payment.createdAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información del método de pago */}
            <div className={`${methodConfig.bg} rounded-lg p-4`}>
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <MethodIcon className="w-4 h-4 mr-2" />
                Detalles de {methodConfig.label}
              </h5>
              
              {payment.paymentMethod === 'transfer' && (
                <div className="space-y-3 text-sm">
                  {payment.transferProof && (
                    <div>
                      <span className="font-medium text-gray-700">Comprobante:</span>
                      <div className="mt-1">
                        <a 
                          href={payment.transferProof} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Ver comprobante completo
                        </a>
                      </div>
                    </div>
                  )}
                  {payment.reference && (
                    <div>
                      <span className="font-medium text-gray-700">Referencia:</span>
                      <span className="ml-2 font-mono text-gray-600">{payment.reference}</span>
                    </div>
                  )}
                </div>
              )}
              
              {payment.paymentMethod === 'card' && (
                <div className="space-y-3 text-sm">
                  {payment.cardLast4 && (
                    <div>
                      <span className="font-medium text-gray-700">Tarjeta:</span>
                      <span className="ml-2 font-mono text-gray-600">**** **** **** {payment.cardLast4}</span>
                    </div>
                  )}
                  {payment.cardTransactionId && (
                    <div>
                      <span className="font-medium text-gray-700">ID de transacción:</span>
                      <span className="ml-2 font-mono text-gray-600">{payment.cardTransactionId}</span>
                    </div>
                  )}
                </div>
              )}
              
              {payment.paymentMethod === 'cash' && (
                <div className="text-sm">
                  <div className="flex items-center text-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    <span>
                      {isPendingPayment 
                        ? 'Esperando confirmación de pago en efectivo'
                        : 'Pago en efectivo recibido y confirmado'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Resto de información expandida (mantener igual)... */}
            
            {/* NUEVO: Nota sobre pagos pendientes */}
            {isPendingPayment && (
              <div className="text-xs text-center text-gray-500 italic bg-white rounded-lg p-3">
                Este pago está esperando confirmación. Utiliza los botones de arriba para confirmar si el pago se realizó o cancelarlo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentListItem;