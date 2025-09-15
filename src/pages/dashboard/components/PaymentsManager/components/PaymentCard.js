// src/pages/dashboard/components/PaymentsManager/components/PaymentCard.js
// Author: Alexander Echeverria
// Componente de tarjeta para pagos del historial (vista grid)
// Basado en TransferCard pero adaptado para el historial de pagos

import React, { useState } from 'react';
import { 
  Check, X, Timer, Bird, Mail, Phone, Building, 
  Calendar, User, Clock, FileText, ChevronDown, ChevronUp,
  ExternalLink, CreditCard, Banknote, Smartphone
} from 'lucide-react';

const PaymentCard = ({ 
  payment, 
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
      cancelled: { label: 'Cancelado', color: 'text-gray-600', bg: 'bg-gray-100', icon: X }
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
      
      {/* Header con indicador de tiempo reciente */}
      {getTimeSincePayment() === 'hoy' && (
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
              <div className="text-gray-500 mb-1">Monto pagado</div>
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
              <div className="text-gray-500 mb-1">Fecha de pago</div>
              <div className="text-gray-700">
                {formatDate && formatDate(payment.paymentDate || payment.createdAt, 'dd/MM/yyyy HH:mm')}
                <span className="text-gray-500 ml-2">({getTimeSincePayment()})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información expandida */}
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
                    <div className="font-medium text-gray-900">Fecha de pago</div>
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

            {/* Información específica por método de pago */}
            <div className={`${methodConfig.bg} rounded-lg p-4`}>
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <MethodIcon className="w-4 h-4 mr-2" />
                <span>Detalles de {methodConfig.label}</span>
              </h5>
              
              {payment.paymentMethod === 'transfer' && (
                <div className="space-y-2 text-sm">
                  {payment.transferProof && (
                    <div>
                      <span className="font-medium text-gray-700">Comprobante:</span>
                      <div className="mt-1">
                        <a 
                          href={payment.transferProof} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 underline"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Ver comprobante
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
                <div className="space-y-2 text-sm">
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
                    <span>Pago en efectivo recibido y confirmado</span>
                  </div>
                </div>
              )}
            </div>

            {/* Información de membresía o concepto */}
            {(payment.membership || payment.concept || payment.description) && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <TypeIcon className="w-4 h-4 mr-2" />
                  {payment.membership ? 'Membresía Asociada' : 'Concepto del Pago'}
                </h5>
                
                <div className="space-y-2 text-sm">
                  {payment.membership && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="font-medium text-gray-900">Tipo</div>
                        <div className="text-gray-600">{payment.membership.type}</div>
                      </div>
                      {payment.membership.startDate && (
                        <div>
                          <div className="font-medium text-gray-900">Inicio</div>
                          <div className="text-gray-600">
                            {formatDate && formatDate(payment.membership.startDate, 'dd/MM/yyyy')}
                          </div>
                        </div>
                      )}
                      {payment.membership.endDate && (
                        <div>
                          <div className="font-medium text-gray-900">Vencimiento</div>
                          <div className="text-gray-600">
                            {formatDate && formatDate(payment.membership.endDate, 'dd/MM/yyyy')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {payment.concept && (
                    <div>
                      <span className="font-medium text-gray-700">Concepto:</span>
                      <span className="ml-2 text-gray-600">{payment.concept}</span>
                    </div>
                  )}
                  
                  {payment.description && (
                    <div>
                      <span className="font-medium text-gray-700">Descripción:</span>
                      <span className="ml-2 text-gray-600">{payment.description}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información del registro */}
            {payment.registeredByUser && (
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Información de Registro
                </h5>
                
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Registrado por:</span>
                    <span className="ml-2 text-gray-600">
                      {payment.registeredByUser.firstName} {payment.registeredByUser.lastName}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Rol:</span>
                    <span className="ml-2 text-gray-600 capitalize">{payment.registeredByUser.role}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notas adicionales */}
            {payment.notes && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Notas
                </h5>
                <div className="text-sm text-gray-600">{payment.notes}</div>
              </div>
            )}

            {/* ID del pago */}
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-xs text-gray-500">
                <span className="font-medium">ID del Pago:</span> {payment.id}
              </div>
            </div>
          </div>
        )}
        
        {/* Indicador de estado para pagos procesados */}
        <div className={`text-center py-3 px-4 rounded-lg text-sm ${
          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
          payment.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {payment.status === 'completed' ? '✅ Pago completado exitosamente' :
           payment.status === 'failed' ? '❌ Pago fallido' :
           payment.status === 'cancelled' ? '⚪ Pago cancelado' :
           payment.status === 'pending' ? '🔄 Pago pendiente' :
           '✅ Pago procesado'}
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;