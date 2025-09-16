// src/pages/dashboard/components/PaymentsManager/components/PaymentsTab.js
// Author: Alexander Echeverria
// Componente del tab de historial de pagos con búsqueda y paginación
// Muestra lista completa de transacciones realizadas con filtros y detalles

// src/pages/dashboard/components/PaymentsManager/components/PaymentsTab.js
// Author: Alexander Echeverria
// Componente del tab de historial de pagos con búsqueda y paginación
// MEJORADO: Filtros móviles completamente rediseñados para mejor UX

import React from 'react';
import { 
  Search, CheckCircle, Grid3X3, List, Bird, Coins, 
  Clock, Building, FileText, Timer, CreditCard, Banknote, AlertTriangle, 
  Filter, X, ChevronDown, SlidersHorizontal, Eye
} from 'lucide-react';
import PaymentCard from './PaymentCard';
import PaymentListItem from './PaymentListItem';

const PaymentsTab = ({ 
  payments = [], 
  loading = false, 
  totalPayments = 0,
  processingIds = new Set(),
  searchTerm = '',
  setSearchTerm,
  currentPage = 1,
  totalPages = 1,
  hasNextPage = false,
  hasPrevPage = false,
  handlePageChange,
  handleConfirmPayment,
  handleCancelPayment,
  isPaymentProcessing,
  getProcessingType,
  getPendingPaymentsStats,
  formatCurrency,
  formatDate,
  showSuccess,
  showError,
  onSave 
}) => {

  // Estados locales para filtros y vista
  const [viewMode, setViewMode] = React.useState('list');
  const [sortBy, setSortBy] = React.useState('status');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [methodFilter, setMethodFilter] = React.useState('all');
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Obtener estadísticas de pagos pendientes
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
        case 'status':
          const statusOrder = { 'pending': 0, 'waiting_payment': 1, 'completed': 2, 'failed': 3, 'cancelled': 4 };
          return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = () => {
    return statusFilter !== 'all' || methodFilter !== 'all' || sortBy !== 'status' || (searchTerm && searchTerm.length > 0);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setStatusFilter('all');
    setMethodFilter('all');
    setSortBy('status');
    setSearchTerm && setSearchTerm('');
  };

  const paymentStats = calculatePaymentStats();
  const methodStats = calculateMethodStats();
  const filteredPayments = getFilteredPayments();

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Estadísticas de pagos - RESPONSIVAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Pagos pendientes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 col-span-1">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-900">
              {pendingStats.total}
            </div>
            <div className="text-xs text-yellow-600 leading-tight">Pendientes</div>
            {pendingStats.old > 0 && (
              <div className="text-xs text-orange-600">
                {pendingStats.old} antiguos
              </div>
            )}
          </div>
        </div>
        
        {/* Pagos completados */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 col-span-1">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-900">
              {paymentStats.completed}
            </div>
            <div className="text-xs text-green-600 leading-tight">Completados</div>
          </div>
        </div>
        
        {/* Efectivo */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 col-span-1 sm:col-span-1">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-green-900">
              {methodStats.cash}
            </div>
            <div className="text-xs text-green-600 leading-tight">Efectivo</div>
          </div>
        </div>
        
        {/* Tarjeta */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 col-span-1 sm:col-span-1">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-blue-900">
              {methodStats.card}
            </div>
            <div className="text-xs text-blue-600 leading-tight">Tarjeta</div>
          </div>
        </div>
        
        {/* Transferencia */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 col-span-1 sm:col-span-1">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Building className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-purple-900">
              {methodStats.transfer}
            </div>
            <div className="text-xs text-purple-600 leading-tight">Transfer.</div>
          </div>
        </div>
        
        {/* Total de pagos */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 col-span-1 sm:col-span-1">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {totalPayments}
            </div>
            <div className="text-xs text-gray-600 leading-tight">Total</div>
          </div>
        </div>
      </div>

      {/* CONTROLES PRINCIPALES - REDISEÑADOS PARA MÓVIL */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        
        {/* Header principal - Siempre visible */}
        <div className="p-4">
          
          {/* Búsqueda - Siempre visible */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm && setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controles principales móvil/desktop */}
          <div className="flex flex-col sm:flex-row gap-3">
            
            {/* Panel de controles móvil */}
            <div className="sm:hidden">
              <div className="grid grid-cols-2 gap-3 mb-3">
                
                {/* Selector de vista - PROMINENTE EN MÓVIL */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vista</label>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 p-2.5 flex items-center justify-center text-sm font-medium transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4 mr-1" />
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 p-2.5 flex items-center justify-center text-sm font-medium transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <List className="w-4 h-4 mr-1" />
                      Lista
                    </button>
                  </div>
                </div>

                {/* Botón de filtros con indicador */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filtros</label>
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={`w-full p-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center relative ${
                      hasActiveFilters()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filtros
                    {hasActiveFilters() && (
                      <div className="ml-2 w-2 h-2 bg-white rounded-full"></div>
                    )}
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${
                      showMobileFilters ? 'rotate-180' : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* Indicador de filtros activos */}
              {hasActiveFilters() && !showMobileFilters && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-700 font-medium">Filtros activos</span>
                    </div>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-blue-600">
                    {statusFilter !== 'all' && `Estado: ${statusFilter} • `}
                    {methodFilter !== 'all' && `Método: ${methodFilter} • `}
                    {sortBy !== 'status' && `Orden: ${sortBy} • `}
                    {searchTerm && `Búsqueda activa`}
                  </div>
                </div>
              )}
            </div>

            {/* Controles para desktop */}
            <div className="hidden sm:flex items-center space-x-3 flex-1">
              
              {/* Filtro de estado */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los métodos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
              
              {/* Selector de ordenamiento */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className={`p-2.5 ${
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
                  className={`p-2.5 ${
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
              <div className="text-sm text-gray-500 whitespace-nowrap">
                {filteredPayments.length} pagos
              </div>
              
              {/* Botón limpiar filtros */}
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Panel de filtros móvil expandido */}
        {showMobileFilters && (
          <div className="sm:hidden bg-gray-50 border-t border-gray-200 p-4">
            <div className="space-y-4">
              
              {/* Header del panel */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filtros de búsqueda
                </h4>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Filtro de estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del pago
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completados</option>
                  <option value="failed">Fallidos</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </div>

              {/* Filtro de método */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'Todos', icon: Eye },
                    { value: 'cash', label: 'Efectivo', icon: Banknote },
                    { value: 'card', label: 'Tarjeta', icon: CreditCard },
                    { value: 'transfer', label: 'Transfer.', icon: Building }
                  ].map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => setMethodFilter(method.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center justify-center ${
                          methodFilter === method.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mr-1" />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Ordenamiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="status">Estado (pendientes primero)</option>
                  <option value="date">Fecha de pago</option>
                  <option value="amount">Monto</option>
                  <option value="name">Nombre del cliente</option>
                  <option value="method">Método de pago</option>
                </select>
              </div>
              
              {/* Contador de resultados móvil */}
              <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-sm text-gray-600">
                  {filteredPayments.length} pago{filteredPayments.length !== 1 ? 's' : ''} encontrado{filteredPayments.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-3">
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg font-medium text-sm"
                  >
                    Limpiar filtros
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm"
                >
                  Ver resultados
                </button>
              </div>
            </div>
          </div>
        )}
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
          <Coins className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 px-4">
            {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
              ? 'No se encontraron pagos con ese criterio'
              : 'No hay pagos registrados'
            }
          </h3>
          <p className="text-gray-600 px-4 text-sm sm:text-base">
            {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
              ? 'Intenta con otro criterio de búsqueda o filtro'
              : 'Los pagos aparecerán aquí una vez que se procesen'
            }
          </p>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
      ) : (
        
        /* Lista de pagos - RESPONSIVE GRID */
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6' 
            : 'space-y-4'
        }`}>
          {filteredPayments.map((payment) => {
            const processing = isPaymentProcessing ? isPaymentProcessing(payment.id) : false;
            const processType = getProcessingType ? getProcessingType(payment.id) : null;
            
            return viewMode === 'grid' ? (
              <PaymentCard
                key={payment.id}
                payment={payment}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onConfirmPayment={handleConfirmPayment}
                onCancelPayment={handleCancelPayment}
                isProcessing={processing}
                processingType={processType}
                showSuccess={showSuccess}
                showError={showError}
              />
            ) : (
              <PaymentListItem
                key={payment.id}
                payment={payment}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onConfirmPayment={handleConfirmPayment}
                onCancelPayment={handleCancelPayment}
                isProcessing={processing}
                processingType={processType}
                showSuccess={showSuccess}
                showError={showError}
              />
            );
          })}
        </div>
      )}
      
      {/* Paginación - OPTIMIZADA PARA MÓVIL */}
      {totalPages > 1 && !loading && filteredPayments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            
            {/* Información de paginación */}
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Página <span className="font-medium">{currentPage}</span> de{' '}
              <span className="font-medium">{totalPages}</span>
            </div>
            
            {/* Controles de paginación */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange && handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              
              {/* Números de página - Simplificado para móvil */}
              <div className="hidden sm:flex items-center space-x-1">
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
                      className={`px-3 py-2 text-sm border rounded-md transition-colors ${
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
              
              {/* Indicador simple para móvil */}
              <div className="sm:hidden text-sm text-gray-500">
                {currentPage} / {totalPages}
              </div>
              
              <button
                onClick={() => handlePageChange && handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      {filteredPayments.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 text-center">
            {filteredPayments.length === 1 
              ? 'Mostrando 1 pago'
              : `Mostrando ${filteredPayments.length} pagos`
            }
            {hasActiveFilters() && (
              <span> con filtros aplicados</span>
            )}
          </div>
          
          {/* Resumen de pagos pendientes */}
          {pendingStats.total > 0 && (
            <div className="mt-2 flex items-center justify-center text-sm text-yellow-600">
              <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="font-medium text-center">
                {pendingStats.total} pagos esperando confirmación
                {pendingStats.old > 0 && ` (${pendingStats.old} antiguos)`}
              </span>
            </div>
          )}
          
          {/* Resumen de métodos de pago - Simplificado para móvil */}
          <div className="mt-2 flex items-center justify-center text-sm text-gray-500 space-x-2 sm:space-x-4">
            <span className="flex items-center">
              <Banknote className="w-3 h-3 mr-1" />
              {methodStats.cash}
            </span>
            <span className="flex items-center">
              <CreditCard className="w-3 h-3 mr-1" />
              {methodStats.card}
            </span>
            <span className="flex items-center">
              <Building className="w-3 h-3 mr-1" />
              {methodStats.transfer}
            </span>
          </div>
          
          {/* Nota sobre el historial */}
          <div className="mt-2 text-xs text-center text-gray-500 italic px-4">
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