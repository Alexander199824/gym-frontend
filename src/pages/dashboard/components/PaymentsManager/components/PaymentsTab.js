// src/pages/dashboard/components/PaymentsManager/components/PaymentsTab.js
// Author: Alexander Echeverria
// Componente del tab de historial de pagos con búsqueda y paginación
// Muestra lista completa de transacciones realizadas con filtros y detalles

// src/pages/dashboard/components/PaymentsManager/components/PaymentsTab.js
// Author: Alexander Echeverria
// Componente del tab de historial de pagos con búsqueda y paginación
// MEJORADO: Ahora muestra información detallada como en el test y otros tabs

// src/pages/dashboard/components/PaymentsManager/components/PaymentsTab.js
// Author: Alexander Echeverria
// Componente del tab de historial de pagos con búsqueda y paginación
// MEJORADO: Ahora muestra información detallada como en el test y otros tabs

import React, { useState } from 'react';
import { 
  Search, Coins, Calendar, Eye, Loader2, Bird, CreditCard, 
  Banknote, Building, User, Mail, Phone, Clock, Timer, 
  FileText, ChevronDown, ChevronUp, ExternalLink, Check,
  X, AlertCircle
} from 'lucide-react';

const PaymentsTab = ({ 
  payments = [], 
  loading = false, 
  totalPayments = 0,
  searchTerm = '',
  setSearchTerm,
  currentPage = 1,
  totalPages = 1,
  hasNextPage = false,
  hasPrevPage = false,
  handlePageChange,
  getPaymentMethodIcon,
  getStatusColor,
  formatCurrency,
  formatDate,
  onSave 
}) => {

  // Estado para controlar qué pagos están expandidos
  const [expandedPayments, setExpandedPayments] = useState(new Set());

  // Función para alternar expansión de pago
  const togglePaymentExpansion = (paymentId) => {
    setExpandedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  // Función para obtener el icono del método de pago
  const renderPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-5 h-5 text-green-600" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'transfer':
      case 'mobile':
        return <Building className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  // Función para obtener configuración del método de pago
  const getPaymentMethodConfig = (method) => {
    const configs = {
      cash: { label: 'Efectivo', color: 'text-green-600', bg: 'bg-green-50' },
      card: { label: 'Tarjeta', color: 'text-blue-600', bg: 'bg-blue-50' },
      transfer: { label: 'Transferencia', color: 'text-purple-600', bg: 'bg-purple-50' },
      mobile: { label: 'Pago Móvil', color: 'text-indigo-600', bg: 'bg-indigo-50' }
    };
    return configs[method] || configs.cash;
  };

  // Función para obtener configuración del estado
  const getStatusConfig = (status) => {
    const configs = {
      completed: { label: 'Completado', color: 'text-green-600', bg: 'bg-green-100', icon: Check },
      pending: { label: 'Pendiente', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
      failed: { label: 'Fallido', color: 'text-red-600', bg: 'bg-red-100', icon: X },
      cancelled: { label: 'Cancelado', color: 'text-gray-600', bg: 'bg-gray-100', icon: X }
    };
    return configs[status] || configs.completed;
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

  // Función para manejar la visualización de un pago
  const handleViewPayment = (payment) => {
    togglePaymentExpansion(payment.id);
  };

  return (
    <div className="space-y-6">
      
      {/* Barra de búsqueda y filtros mejorada */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          
          {/* Campo de búsqueda */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pagos por cliente, email, referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
          </div>
          
          {/* Información de resultados */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4" />
              <span>
                {loading ? 'Cargando...' : `${totalPayments} pagos total`}
              </span>
            </div>
            {totalPages > 1 && (
              <span>
                Página {currentPage} de {totalPages}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Lista de pagos mejorada */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
            <span className="text-gray-600">Cargando pagos...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron pagos con ese criterio' : 'No hay pagos registrados'}
            </p>
          </div>
        ) : (
          <>
            {/* Lista de pagos con información expandible */}
            <div className="divide-y divide-gray-200">
              {payments.map((payment) => {
                const isExpanded = expandedPayments.has(payment.id);
                const methodConfig = getPaymentMethodConfig(payment.paymentMethod);
                const statusConfig = getStatusConfig(payment.status || 'completed');
                const typeConfig = getPaymentTypeConfig(payment.paymentType || payment.concept?.toLowerCase() || 'membership');
                const StatusIcon = statusConfig.icon;
                const TypeIcon = typeConfig.icon;

                return (
                  <div key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                    
                    {/* Header del pago (siempre visible) */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        
                        {/* Información principal del pago */}
                        <div className="flex items-center flex-1">
                          
                          {/* Icono del método de pago */}
                          <div className={`w-12 h-12 ${methodConfig.bg} rounded-full flex items-center justify-center mr-4`}>
                            {renderPaymentMethodIcon(payment.paymentMethod)}
                          </div>
                          
                          {/* Detalles del pago */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-lg font-medium text-gray-900">
                                  {payment.user ? 
                                    `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || payment.user.name || 'Cliente' : 
                                    'Cliente Anónimo'
                                  }
                                </h4>
                                
                                {/* Estado del pago */}
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </span>
                              </div>
                              
                              {/* Monto del pago */}
                              <div className="text-xl font-bold text-gray-900 flex items-center">
                                <Bird className="w-5 h-5 mr-1 text-green-600" />
                                {formatCurrency && formatCurrency(payment.amount)}
                              </div>
                            </div>
                            
                            {/* Información adicional resumida */}
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                              {/* Fecha */}
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate && formatDate(payment.paymentDate || payment.createdAt, 'dd/MM/yyyy HH:mm')}
                              </div>
                              
                              {/* Método de pago */}
                              <span className={`${methodConfig.color} font-medium`}>
                                {methodConfig.label}
                              </span>
                              
                              {/* Tipo de pago */}
                              <div className="flex items-center">
                                <TypeIcon className="w-4 h-4 mr-1" />
                                {typeConfig.label}
                              </div>
                              
                              {/* Email del cliente (si existe) */}
                              {payment.user?.email && (
                                <span className="text-xs text-gray-400 truncate max-w-32">
                                  {payment.user.email}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Botón de expandir/contraer */}
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors duration-150 ml-4"
                            title={isExpanded ? "Contraer detalles" : "Ver detalles"}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
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
                              {renderPaymentMethodIcon(payment.paymentMethod)}
                              <span className="ml-2">Detalles de {methodConfig.label}</span>
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  
                  {/* Información de paginación */}
                  <div className="text-sm text-gray-700">
                    Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </div>
                  
                  {/* Controles de paginación */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange && handlePageChange(currentPage - 1)}
                      disabled={!hasPrevPage}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    {/* Números de página */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange && handlePageChange(pageNum)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentPage === pageNum
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange && handlePageChange(currentPage + 1)}
                      disabled={!hasNextPage}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentsTab;

// Este componente maneja la visualización del historial completo de pagos
// Incluye búsqueda, filtros, paginación y vista detallada de cada transacción
// Proporciona una interfaz clara para revisar todo el historial financiero