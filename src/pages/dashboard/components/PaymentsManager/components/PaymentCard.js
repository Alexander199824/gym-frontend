// src/pages/dashboard/components/PaymentsManager/components/PaymentCard.js
// Author: Alexander Echeverria
// Componente de tarjeta para pagos del historial (vista grid)
// Basado en TransferCard pero adaptado para el historial de pagos

// src/pages/dashboard/components/PaymentsManager/components/PaymentCard.js
// Author: Alexander Echeverria
// Componente de tarjeta para pagos del historial (vista grid)
// ACTUALIZADO: Agregados botones para confirmar/cancelar pagos pendientes

import React, { useState } from 'react';
import { 
  Check, X, Timer, Bird, Mail, Phone, Building, 
  Calendar, User, Clock, FileText, ChevronDown, ChevronUp,
  ExternalLink, CreditCard, Banknote, Smartphone, Loader2
} from 'lucide-react';

const PaymentCard = ({ 
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
  
  // NUEVO: Determinar si el pago está pendiente y puede ser confirmado/cancelado
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
  
  // Generar iniciales del usuario
  const getUserInitials = () => {
    const name = payment.user?.name || 
                 `${payment.user?.firstName || ''} ${payment.user?.lastName || ''}`.trim();
    if (!name) return 'C';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}` 
      : names[0][0];
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
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border-gray-200">
      
      {/* NUEVO: Header con indicador para pagos pendientes */}
      {isPendingPayment && (
        <div className="px-4 py-2 border-b bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between text-sm text-yellow-700">
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-1" />
              <span className="font-medium">Pago Pendiente</span>
            </div>
            <span className="text-xs">Requiere confirmación</span>
          </div>
        </div>
      )}
      
      {/* Header con indicador de tiempo reciente (solo para completados) */}
      {!isPendingPayment && getTimeSincePayment() === 'hoy' && (
        <div className="px-4 py-2 border-b bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between text-sm text-blue-700">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span className="font-medium">Pago reciente</span>
            </div>
            <span className="text-xs">Procesado hoy</span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        
        {/* Información del cliente */}
        <div className="flex items-center mb-4">
          
          {/* Avatar con iniciales */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 ${methodConfig.bg}`}>
            <span className={`text-xl font-bold ${methodConfig.color}`}>
              {getUserInitials()}
            </span>
          </div>
          
          {/* Datos del cliente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
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
            
            <div className="text-sm text-gray-500 space-y-1">
              {payment.user?.email && (
                <div className="flex items-center truncate">
                  <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{payment.user.email}</span>
                </div>
              )}
              
              {payment.reference && (
                <div className="flex items-center">
                  <CreditCard className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="font-mono text-xs">{payment.reference}</span>
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
        
        {/* Detalles del pago - información básica */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            
            {/* Monto */}
            <div className="col-span-2">
              <div className="text-gray-500 mb-1">Monto {isPendingPayment ? 'esperado' : 'pagado'}</div>
              <div className={`text-2xl font-bold flex items-center ${methodConfig.color}`}>
                <Bird className="w-5 h-5 mr-1" />
                {formatCurrency && formatCurrency(payment.amount)}
              </div>
            </div>
            
            {/* Método de pago */}
            <div>
              <div className="text-gray-500 mb-1">Método</div>
              <div className={`flex items-center ${methodConfig.color} font-medium`}>
                <MethodIcon className="w-4 h-4 mr-1" />
                {methodConfig.label}
              </div>
            </div>
            
            {/* Tipo de pago */}
            <div>
              <div className="text-gray-500 mb-1">Tipo</div>
              <div className="flex items-center text-gray-700 font-medium">
                <TypeIcon className="w-4 h-4 mr-1" />
                {typeConfig.label}
              </div>
            </div>
            
            {/* Fecha de pago */}
            <div className="col-span-2">
              <div className="text-gray-500 mb-1">
                {isPendingPayment ? 'Fecha de creación' : 'Fecha de pago'}
              </div>
              <div className="text-gray-700">
                {formatDate && formatDate(payment.paymentDate || payment.createdAt, 'dd/MM/yyyy HH:mm')}
                {!isPendingPayment && (
                  <span className="text-gray-500 ml-2">({getTimeSincePayment()})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información expandida (mantener igual que antes) */}
        {isExpanded && (
          <div className="space-y-4 mb-4">
            
            {/* Información del cliente detallada */}
            {payment.user && (
              <div className="bg-white border rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Información del Cliente
                </h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  
                  {/* Nombre completo */}
                  <div>
                    <div className="font-medium text-gray-900">Nombre completo</div>
                    <div className="text-gray-600">
                      {`${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || payment.user.name || 'N/A'}
                    </div>
                  </div>

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
                </div>
              </div>
            )}

            {/* Información temporal detallada */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Información Temporal
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                
                {/* Fecha de pago */}
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
                
                {/* Fecha de creación (si es diferente) */}
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

            {/* Resto de la información expandida (mantener igual)... */}
            {/* Información específica por método de pago, membresía, etc. */}
          </div>
        )}
        
        {/* NUEVO: Botones de acción para pagos pendientes */}
        {isPendingPayment && (onConfirmPayment || onCancelPayment) && (
          <div className="space-y-3 mb-4">
            
            {/* Botón principal: Confirmar pago */}
            {onConfirmPayment && (
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm ${
                  isProcessing && processingType === 'confirming'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isProcessing && processingType === 'confirming' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Pago de {formatCurrency && formatCurrency(payment.amount)}
                  </>
                )}
              </button>
            )}
            
            {/* Botón secundario: Cancelar pago */}
            {onCancelPayment && (
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
                    Cancelando...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Pago
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Indicador de estado para pagos procesados */}
        <div className={`text-center py-3 px-4 rounded-lg text-sm ${
          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
          payment.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
          payment.status === 'pending' || payment.status === 'waiting_payment' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {payment.status === 'completed' ? '✅ Pago completado exitosamente' :
           payment.status === 'failed' ? '❌ Pago fallido' :
           payment.status === 'cancelled' ? '⚪ Pago cancelado' :
           payment.status === 'pending' || payment.status === 'waiting_payment' ? '🔄 Esperando confirmación del pago' :
           '✅ Pago procesado'}
        </div>
        
        {/* NUEVO: Nota explicativa para pagos pendientes */}
        {isPendingPayment && (
          <div className="mt-3 text-xs text-center text-gray-500 italic">
            Utiliza los botones de arriba para confirmar si el pago se realizó o cancelarlo
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCard;