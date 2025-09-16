// src/pages/dashboard/components/PaymentsManager/components/TransfersTab.js
// Author: Alexander Echeverria
// Componente del tab de transferencias bancarias pendientes de validación
// Permite aprobar o rechazar transferencias con confirmación y feedback visual

// src/pages/dashboard/components/PaymentsManager/components/TransfersTab.js
// Author: Alexander Echeverria
// Componente del tab de transferencias bancarias pendientes de validación
// MEJORADO: Filtros móviles completamente rediseñados para mejor UX

import React from 'react';
import { 
  Search, CheckCircle, Grid3X3, List, Bird, AlertTriangle, 
  Clock, Building, FileText, Timer, Filter, X, SlidersHorizontal,
  ChevronDown, Eye, TrendingUp
} from 'lucide-react';
import TransferCard from './TransferCard';
import TransferListItem from './TransferListItem';

const TransfersTab = ({ 
  pendingTransfers = [],
  transferStats = {},
  loading = false,
  searchTerm = '',
  setSearchTerm,
  transferViewMode = 'grid',
  setTransferViewMode,
  transferSortBy = 'waiting_time',
  setTransferSortBy,
  transferPriorityFilter = 'all',
  setTransferPriorityFilter,
  getFilteredTransfers,
  handleValidateTransfer,
  processingIds = new Set(),
  isTransferProcessing,
  getProcessingType,
  formatCurrency,
  formatDate,
  showSuccess,
  showError,
  onSave 
}) => {

  // Estados locales para filtros móviles
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Obtener las transferencias filtradas
  const filteredTransfers = getFilteredTransfers ? getFilteredTransfers() : pendingTransfers;

  // Verificar si hay filtros activos
  const hasActiveFilters = () => {
    return transferPriorityFilter !== 'all' || 
           transferSortBy !== 'waiting_time' || 
           (searchTerm && searchTerm.length > 0);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setTransferPriorityFilter && setTransferPriorityFilter('all');
    setTransferSortBy && setTransferSortBy('waiting_time');
    setSearchTerm && setSearchTerm('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Estadísticas de transferencias - RESPONSIVAS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total esperando */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-900">
              {transferStats.total || 0}
            </div>
            <div className="text-xs text-purple-600 leading-tight">Esperando</div>
          </div>
        </div>
        
        {/* Críticas */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-900">
              {transferStats.critical || 0}
            </div>
            <div className="text-xs text-red-600 leading-tight">Críticas</div>
            <div className="text-xs text-red-500">+24h</div>
          </div>
        </div>
        
        {/* Total en quetzales */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-blue-900 flex items-center justify-center">
              <Bird className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {formatCurrency && formatCurrency(transferStats.totalAmount || 0)}
              </span>
            </div>
            <div className="text-xs text-blue-600">Total GTQ</div>
          </div>
        </div>
        
        {/* Promedio */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-purple-900 flex items-center justify-center">
              <Bird className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {formatCurrency && formatCurrency(transferStats.avgAmount || 0)}
              </span>
            </div>
            <div className="text-xs text-purple-600">Promedio</div>
          </div>
        </div>
        
        {/* Tiempo promedio */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {(transferStats.avgHours || 0).toFixed(1)}h
            </div>
            <div className="text-xs text-gray-600">Tiempo Prom.</div>
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
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
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
                      onClick={() => setTransferViewMode && setTransferViewMode('grid')}
                      className={`flex-1 p-2.5 flex items-center justify-center text-sm font-medium transition-colors ${
                        transferViewMode === 'grid'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4 mr-1" />
                      Cards
                    </button>
                    <button
                      onClick={() => setTransferViewMode && setTransferViewMode('list')}
                      className={`flex-1 p-2.5 flex items-center justify-center text-sm font-medium transition-colors ${
                        transferViewMode === 'list'
                          ? 'bg-purple-600 text-white'
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
                        ? 'bg-purple-600 text-white'
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
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="text-sm text-purple-700 font-medium">Filtros activos</span>
                    </div>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-purple-600">
                    {transferPriorityFilter !== 'all' && `Prioridad: ${transferPriorityFilter} • `}
                    {transferSortBy !== 'waiting_time' && `Orden: ${transferSortBy} • `}
                    {searchTerm && `Búsqueda activa`}
                  </div>
                </div>
              )}
            </div>

            {/* Controles para desktop */}
            <div className="hidden sm:flex items-center space-x-3 flex-1">
              
              {/* Filtro de prioridad */}
              <select
                value={transferPriorityFilter}
                onChange={(e) => setTransferPriorityFilter && setTransferPriorityFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todas</option>
                <option value="normal">Normales</option>
                <option value="high">Prioridad alta</option>
                <option value="critical">Críticas (+24h)</option>
              </select>
              
              {/* Selector de ordenamiento */}
              <select
                value={transferSortBy}
                onChange={(e) => setTransferSortBy && setTransferSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="waiting_time">Tiempo de espera</option>
                <option value="amount">Monto</option>
                <option value="name">Nombre</option>
                <option value="created">Fecha de creación</option>
              </select>
              
              {/* Selector de vista */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setTransferViewMode && setTransferViewMode('grid')}
                  className={`p-2.5 ${
                    transferViewMode === 'grid' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setTransferViewMode && setTransferViewMode('list')}
                  className={`p-2.5 ${
                    transferViewMode === 'list' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Vista en lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {/* Contador de resultados */}
              <div className="text-sm text-gray-500 whitespace-nowrap">
                {filteredTransfers.length} transferencias
              </div>
              
              {/* Botón limpiar filtros */}
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium whitespace-nowrap"
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
              
              {/* Filtro de prioridad móvil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por prioridad
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'Todas', icon: Eye, color: 'gray' },
                    { value: 'normal', label: 'Normales', icon: Clock, color: 'purple' },
                    { value: 'high', label: 'Altas', icon: TrendingUp, color: 'orange' },
                    { value: 'critical', label: 'Críticas', icon: AlertTriangle, color: 'red' }
                  ].map((priority) => {
                    const IconComponent = priority.icon;
                    const colorClasses = {
                      gray: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                      purple: 'border-purple-500 bg-purple-50 text-purple-700',
                      orange: 'border-orange-500 bg-orange-50 text-orange-700',
                      red: 'border-red-500 bg-red-50 text-red-700'
                    };
                    
                    return (
                      <button
                        key={priority.value}
                        onClick={() => setTransferPriorityFilter && setTransferPriorityFilter(priority.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex flex-col items-center justify-center ${
                          transferPriorityFilter === priority.value
                            ? colorClasses[priority.color]
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mb-1" />
                        {priority.label}
                        {priority.value === 'critical' && (
                          <span className="text-xs mt-1">+24h</span>
                        )}
                        {priority.value === 'high' && (
                          <span className="text-xs mt-1">+12h</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Ordenamiento móvil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={transferSortBy}
                  onChange={(e) => setTransferSortBy && setTransferSortBy(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="waiting_time">Tiempo de espera (mayor a menor)</option>
                  <option value="amount">Monto (mayor a menor)</option>
                  <option value="name">Nombre del cliente</option>
                  <option value="created">Fecha de creación</option>
                </select>
              </div>
              
              {/* Contador de resultados móvil */}
              <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                <span className="text-sm text-gray-600">
                  {filteredTransfers.length} transferencia{filteredTransfers.length !== 1 ? 's' : ''} encontrada{filteredTransfers.length !== 1 ? 's' : ''}
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
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm"
                >
                  Ver resultados
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal de transferencias */}
      {filteredTransfers.length === 0 ? (
        
        /* Estado vacío */
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 px-4">
            {searchTerm || transferPriorityFilter !== 'all'
              ? 'No se encontraron transferencias con ese criterio'
              : 'Excelente! No hay transferencias esperando validación'
            }
          </h3>
          <p className="text-gray-600 px-4 text-sm sm:text-base">
            {searchTerm || transferPriorityFilter !== 'all'
              ? 'Intenta con otro criterio de búsqueda o filtro'
              : 'Todas las transferencias han sido procesadas'
            }
          </p>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
      ) : (
        
        /* Lista de transferencias - RESPONSIVE GRID */
        <div className={`${
          transferViewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
            : 'space-y-4'
        }`}>
          {filteredTransfers.map((transfer) => {
            const isProcessing = isTransferProcessing ? isTransferProcessing(transfer.id) : false;
            const processingType = getProcessingType ? getProcessingType(transfer.id) : null;
            
            return transferViewMode === 'grid' ? (
              <TransferCard
                key={transfer.id}
                transfer={transfer}
                onApprove={handleValidateTransfer}
                onReject={handleValidateTransfer}
                isProcessing={isProcessing}
                processingType={processingType}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                showSuccess={showSuccess}
                showError={showError}
              />
            ) : (
              <TransferListItem
                key={transfer.id}
                transfer={transfer}
                onApprove={handleValidateTransfer}
                onReject={handleValidateTransfer}
                isProcessing={isProcessing}
                processingType={processingType}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            );
          })}
        </div>
      )}
      
      {/* Información adicional */}
      {filteredTransfers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 text-center">
            {filteredTransfers.length === 1 
              ? 'Mostrando 1 transferencia pendiente'
              : `Mostrando ${filteredTransfers.length} transferencias pendientes`
            }
            {hasActiveFilters() && (
              <span> con filtros aplicados</span>
            )}
          </div>
          
          {/* Resumen de transferencias críticas */}
          {transferStats.critical > 0 && (
            <div className="mt-2 flex items-center justify-center text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="font-medium text-center">
                {transferStats.critical} transferencias llevan más de 24 horas esperando
              </span>
            </div>
          )}
          
          {/* Nota sobre validación */}
          <div className="mt-2 text-xs text-center text-gray-500 italic px-4">
            Revisa cuidadosamente cada comprobante antes de aprobar. Una vez aprobado, el pago se marcará como completado.
          </div>
        </div>
      )}
    </div>
  );
};

export default TransfersTab;

// Este componente maneja el tab completo de transferencias bancarias pendientes
// Incluye estadísticas, priorización por tiempo de espera y acciones de validación
// Proporciona feedback visual claro sobre la urgencia de cada transferencia