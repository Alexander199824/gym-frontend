// src/pages/dashboard/components/PaymentsManager/components/PaymentsTab.js
// Author: Alexander Echeverria
// Componente del tab de historial de pagos con búsqueda y paginación
// Muestra lista completa de transacciones realizadas con filtros y detalles

import React from 'react';
import { 
  Search, Coins, Calendar, Eye, Loader2, Bird,
  CreditCard, Banknote, Building 
} from 'lucide-react';

const PaymentsTab = ({ 
  payments, 
  loading, 
  totalPayments,
  searchTerm,
  setSearchTerm,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  handlePageChange,
  getPaymentMethodIcon,
  getStatusColor,
  formatCurrency,
  formatDate,
  onSave 
}) => {

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

  // Función para manejar la visualización de un pago
  const handleViewPayment = (payment) => {
    console.log('Ver detalles del pago:', payment);
    // Aquí se puede implementar un modal o navegación a detalles
  };

  return (
    <div className="space-y-6">
      
      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          
          {/* Campo de búsqueda */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pagos por cliente, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
          </div>
          
          {/* Información de resultados */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              {loading ? 'Cargando...' : `${totalPayments} pagos total`}
            </span>
            {totalPages > 1 && (
              <span>
                Página {currentPage} de {totalPages}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Lista de pagos */}
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
            {/* Lista de pagos */}
            <div className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    
                    {/* Información principal del pago */}
                    <div className="flex items-center flex-1">
                      
                      {/* Icono del método de pago */}
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        {renderPaymentMethodIcon(payment.paymentMethod)}
                      </div>
                      
                      {/* Detalles del pago */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {payment.user ? 
                              `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || payment.user.name || 'Cliente' : 
                              'Cliente Anónimo'
                            }
                          </h4>
                          
                          {/* Monto del pago */}
                          <div className="text-lg font-bold text-gray-900 flex items-center">
                            <Bird className="w-4 h-4 mr-1 text-green-600" />
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>
                        
                        {/* Información adicional */}
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(payment.paymentDate || payment.createdAt, 'dd/MM/yyyy HH:mm')}
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(payment.status || 'completed')}`}>
                            {payment.status === 'completed' ? 'Completado' :
                             payment.status === 'pending' ? 'Pendiente' :
                             payment.status === 'failed' ? 'Fallido' :
                             payment.status === 'cancelled' ? 'Cancelado' :
                             'Completado'
                            }
                          </span>
                          
                          {payment.paymentMethod && (
                            <span className="text-xs text-gray-400">
                              {payment.paymentMethod === 'cash' ? 'Efectivo' :
                               payment.paymentMethod === 'card' ? 'Tarjeta' :
                               payment.paymentMethod === 'transfer' ? 'Transferencia' :
                               payment.paymentMethod === 'mobile' ? 'Móvil' :
                               'Desconocido'
                              }
                            </span>
                          )}
                          
                          {payment.user?.email && (
                            <span className="text-xs text-gray-400 truncate max-w-32">
                              {payment.user.email}
                            </span>
                          )}
                        </div>
                        
                        {/* Plan o concepto del pago */}
                        {payment.concept && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">Concepto:</span> {payment.concept}
                          </div>
                        )}
                      </div>
                      
                      {/* Botón de acciones */}
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                      onClick={() => handlePageChange(currentPage - 1)}
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
                            onClick={() => handlePageChange(pageNum)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
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