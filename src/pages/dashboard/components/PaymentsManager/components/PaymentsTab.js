// src/pages/dashboard/components/PaymentsManager/components/PaymentsTab.js
// Author: Alexander Echeverria
// Componente del tab de historial de pagos con búsqueda y paginación
// Muestra lista completa de transacciones realizadas con filtros y detalles

// src/pages/dashboard/components/PaymentsManager/components/PaymentsTab.js
// Author: Alexander Echeverria
// Componente del tab de historial de pagos con búsqueda y paginación
// ACTUALIZADO: Integradas funciones para confirmar/cancelar pagos pendientes

import React from 'react';
import { 
  Search, CheckCircle, Grid3X3, List, Bird, Coins, 
  Clock, Building, FileText, Timer, CreditCard, Banknote, AlertTriangle
} from 'lucide-react';
import PaymentCard from './PaymentCard';
import PaymentListItem from './PaymentListItem';

const PaymentsTab = ({ 
  payments = [], 
  loading = false, 
  totalPayments = 0,
  processingIds = new Set(), // NUEVO
  searchTerm = '',
  setSearchTerm,
  currentPage = 1,
  totalPages = 1,
  hasNextPage = false,
  hasPrevPage = false,
  handlePageChange,
  handleConfirmPayment, // NUEVO
  handleCancelPayment, // NUEVO
  isPaymentProcessing, // NUEVO
  getProcessingType, // NUEVO
  getPendingPaymentsStats, // NUEVO
  formatCurrency,
  formatDate,
  showSuccess, // NUEVO
  showError, // NUEVO
  onSave 
}) => {

  // Estados locales para filtros y vista (esto idealmente debería venir del hook)
  const [viewMode, setViewMode] = React.useState('list');
  const [sortBy, setSortBy] = React.useState('date');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [methodFilter, setMethodFilter] = React.useState('all');

  // NUEVO: Obtener estadísticas de pagos pendientes
  const pendingStats = getPendingPaymentsStats ? getPendingPaymentsStats() : {
    total: 0,
    old: 0,
    totalAmount: 0,
    avgAmount: 0
  };

  // Calcular estadísticas de los pagos
  const calculatePaymentStats = () => {
    if (!payments || payments.length === 0) {
      return {
        completed: 0,
        pending: 0,
        failed: 0
      };
    }

    const completed = payments.filter(p => (p.status || 'completed') === 'completed').length;
    const pending = payments.filter(p => 
      p.status === 'pending' || p.status === 'waiting_payment'
    ).length;
    const failed = payments.filter(p => p.status === 'failed').length;

    return {
      completed,
      pending,
      failed
    };
  };

  // Obtener estadísticas por método de pago
  const calculateMethodStats = () => {
    if (!payments || payments.length === 0) {
      return { cash: 0, card: 0, transfer: 0 };
    }

    return {
      cash: payments.filter(p => p.paymentMethod === 'cash').length,
      card: payments.filter(p => p.paymentMethod === 'card').length,
      transfer: payments.filter(p => p.paymentMethod === 'transfer').length
    };
  };

  // Filtrar pagos según los filtros aplicados
  const getFilteredPayments = () => {
    let filtered = [...payments];

    // Filtrar por estado
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // Incluir tanto 'pending' como 'waiting_payment'
        filtered = filtered.filter(payment => 
          payment.status === 'pending' || payment.status === 'waiting_payment'
        );
      } else {
        filtered = filtered.filter(payment => (payment.status || 'completed') === statusFilter);
      }
    }

    // Filtrar por método de pago
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === methodFilter);
    }

    // Filtrar por búsqueda
    if (searchTerm && searchTerm.length >= 2) {
      const searchText = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => {
        const clientInfo = `${payment.user?.name || ''} ${payment.user?.firstName || ''} ${payment.user?.lastName || ''} ${payment.user?.email || ''} ${payment.concept || ''} ${payment.reference || ''}`.toLowerCase();
        return clientInfo.includes(searchText);
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt);
        case 'amount':
          return (b.amount || 0) - (a.amount || 0);
        case 'name':
          const nameA = a.user?.name || a.user?.firstName || '';
          const nameB = b.user?.name || b.user?.firstName || '';
          return nameA.localeCompare(nameB);
        case 'method':
          return (a.paymentMethod || '').localeCompare(b.paymentMethod || '');
        case 'status': // NUEVO: Ordenar por estado (pendientes primero)
          const statusOrder = { 'pending': 0, 'waiting_payment': 1, 'completed': 2, 'failed': 3, 'cancelled': 4 };
          return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const paymentStats = calculatePaymentStats();
  const methodStats = calculateMethodStats();
  const filteredPayments = getFilteredPayments();

  return (
    <div className="space-y-6">
      
      {/* ACTUALIZADO: Estadísticas de pagos - Agregada sección de pendientes */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        
        {/* Pagos pendientes - NUEVO */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-900">
              {pendingStats.total}
            </div>
            <div className="text-xs text-yellow-600">Pendientes</div>
            {pendingStats.old > 0 && (
              <div className="text-xs text-orange-600">
                {pendingStats.old} antiguos
              </div>
            )}
          </div>
        </div>
        
        {/* Pagos completados */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              {paymentStats.completed}
            </div>
            <div className="text-xs text-green-600">Completados</div>
          </div>
        </div>
        
        {/* Efectivo */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-xl font-bold text-green-900">
              {methodStats.cash}
            </div>
            <div className="text-xs text-green-600">Efectivo</div>
          </div>
        </div>
        
        {/* Tarjeta */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-900">
              {methodStats.card}
            </div>
            <div className="text-xs text-blue-600">Tarjeta</div>
          </div>
        </div>
        
        {/* Transferencia */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-purple-900">
              {methodStats.transfer}
            </div>
            <div className="text-xs text-purple-600">Transferencia</div>
          </div>
        </div>
        
        {/* Total de pagos */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {totalPayments}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Controles de filtros y vista */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white rounded-lg p-4 border border-gray-200">
        
        {/* Campo de búsqueda */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        
        {/* Controles de filtros y vista */}
        <div className="flex items-center space-x-3">
          
          {/* Filtro de estado - ACTUALIZADO */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completados</option>
            <option value="failed">Fallidos</option>
            <option value="cancelled">Cancelados</option>
          </select>

          {/* Filtro de método */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los métodos</option>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
          </select>
          
          {/* Selector de ordenamiento - ACTUALIZADO */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="status">Estado (pendientes primero)</option>
            <option value="date">Fecha de pago</option>
            <option value="amount">Monto</option>
            <option value="name">Nombre</option>
            <option value="method">Método</option>
          </select>
          
          {/* Selector de vista */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              title="Vista en cuadrícula"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              title="Vista en lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Contador de resultados */}
          <div className="text-sm text-gray-500">
            {filteredPayments.length} pagos
          </div>
        </div>
      </div>

      {/* Contenido principal de pagos */}
      {loading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
          <Timer className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Cargando pagos...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        
        /* Estado vacío */
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Coins className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
              ? 'No se encontraron pagos con ese criterio'
              : 'No hay pagos registrados'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
              ? 'Intenta con otro criterio de búsqueda o filtro'
              : 'Los pagos aparecerán aquí una vez que se procesen'
            }
          </p>
        </div>
        
      ) : (
        
        /* Lista de pagos - ACTUALIZADA con nuevas props */
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
          {filteredPayments.map((payment) => {
            // NUEVO: Obtener estado de procesamiento
            const processing = isPaymentProcessing ? isPaymentProcessing(payment.id) : false;
            const processType = getProcessingType ? getProcessingType(payment.id) : null;
            
            return viewMode === 'grid' ? (
              <PaymentCard
                key={payment.id}
                payment={payment}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onConfirmPayment={handleConfirmPayment} // NUEVO
                onCancelPayment={handleCancelPayment} // NUEVO
                isProcessing={processing} // NUEVO
                processingType={processType} // NUEVO
                showSuccess={showSuccess} // NUEVO
                showError={showError} // NUEVO
              />
            ) : (
              <PaymentListItem
                key={payment.id}
                payment={payment}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onConfirmPayment={handleConfirmPayment} // NUEVO
                onCancelPayment={handleCancelPayment} // NUEVO
                isProcessing={processing} // NUEVO
                processingType={processType} // NUEVO
                showSuccess={showSuccess} // NUEVO
                showError={showError} // NUEVO
              />
            );
          })}
        </div>
      )}
      
      {/* Paginación */}
      {totalPages > 1 && !loading && filteredPayments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
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
                          ? 'bg-blue-600 text-white border-blue-600'
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

      {/* Información adicional - ACTUALIZADA */}
      {filteredPayments.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 text-center">
            {filteredPayments.length === 1 
              ? 'Mostrando 1 pago'
              : `Mostrando ${filteredPayments.length} pagos`
            }
            {(searchTerm || statusFilter !== 'all' || methodFilter !== 'all') && (
              <span> con los filtros aplicados</span>
            )}
          </div>
          
          {/* NUEVO: Resumen de pagos pendientes */}
          {pendingStats.total > 0 && (
            <div className="mt-2 flex items-center justify-center text-sm text-yellow-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {pendingStats.total} pagos esperando confirmación
                {pendingStats.old > 0 && ` (${pendingStats.old} antiguos)`}
              </span>
            </div>
          )}
          
          {/* Resumen de métodos de pago */}
          <div className="mt-2 flex items-center justify-center text-sm text-gray-500 space-x-4">
            <span>💵 {methodStats.cash} efectivo</span>
            <span>💳 {methodStats.card} tarjeta</span>
            <span>🏦 {methodStats.transfer} transferencia</span>
          </div>
          
          {/* Nota sobre el historial */}
          <div className="mt-2 text-xs text-center text-gray-500 italic">
            Historial completo de todas las transacciones. Los pagos pendientes aparecen destacados y pueden ser gestionados.
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;
// Este componente maneja la visualización del historial completo de pagos
// ACTUALIZADO: Ahora incluye funcionalidad para gestionar pagos pendientes
// Incluye búsqueda, filtros, paginación y vista detallada de cada transacción
// Este componente maneja la visualización del historial completo de pagos
// Incluye búsqueda, filtros, paginación y vista detallada de cada transacción
// Proporciona una interfaz clara para revisar todo el historial financiero