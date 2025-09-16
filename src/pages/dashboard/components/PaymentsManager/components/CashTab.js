// src/pages/dashboard/components/PaymentsManager/components/CashTab.js
// Author: Alexander Echeverria
// Componente completo del tab de efectivo con estadísticas, filtros y lista de membresías
// Maneja tanto vista grid como lista y todos los controles de filtrado

// src/pages/dashboard/components/PaymentsManager/components/CashTab.js
// Author: Alexander Echeverria
// Componente completo del tab de efectivo con estadísticas, filtros y lista de membresías
// MEJORADO: Filtros móviles completamente rediseñados para mejor UX

import React from 'react';
import { 
  Search, CheckCircle, Grid3X3, List, Bird, Clock, Filter, X,
  SlidersHorizontal, ChevronDown, Timer, AlertTriangle, Eye
} from 'lucide-react';
import CashMembershipCard from './CashMembershipCard';
import CashMembershipListItem from './CashMembershipListItem';

const CashTab = ({ 
  pendingCashMemberships = [],
  cashMembershipStats = {},
  loading = false,
  searchTerm = '',
  setSearchTerm,
  cashViewMode = 'grid',
  setCashViewMode,
  cashSortBy = 'waiting_time',
  setCashSortBy,
  cashPriorityFilter = 'all',
  setCashPriorityFilter,
  getFilteredCashMemberships,
  handleActivateCashMembership,
  handleCancelCashMembership,
  processingIds = new Set(),
  cancellingIds = new Set(),
  isMembershipProcessing,
  getProcessingType,
  formatCurrency,
  formatDate,
  showSuccess,
  showError,
  onSave 
}) => {

  // Estados locales para filtros móviles
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Obtener las membresías filtradas
  const filteredMemberships = getFilteredCashMemberships ? getFilteredCashMemberships() : pendingCashMemberships;

  // Función wrapper para activación
  const handleActivateWrapper = (membershipId, showSuccess, showError, formatCurrency) => {
    if (!handleActivateCashMembership) {
      showError && showError('Función de activación no disponible');
      return;
    }
    
    handleActivateCashMembership(membershipId, showSuccess, showError, formatCurrency);
  };

  // Función wrapper para cancelación
  const handleCancelWrapper = (membershipId, showSuccess, showError, formatCurrency) => {
    if (!handleCancelCashMembership) {
      showError && showError('Función de cancelación no disponible');
      return;
    }
    
    handleCancelCashMembership(membershipId, showSuccess, showError, formatCurrency);
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = () => {
    return cashPriorityFilter !== 'all' || 
           cashSortBy !== 'waiting_time' || 
           (searchTerm && searchTerm.length > 0);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setCashPriorityFilter && setCashPriorityFilter('all');
    setCashSortBy && setCashSortBy('waiting_time');
    setSearchTerm && setSearchTerm('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Estadísticas de efectivo - OPTIMIZADO PARA MÓVIL */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total esperando */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 col-span-1">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-900">
              {cashMembershipStats.total || 0}
            </div>
            <div className="text-xs text-green-600 leading-tight">Esperando</div>
          </div>
        </div>
        
        {/* "Antiguos" en lugar de "Urgentes" */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 col-span-1">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-900">
              {cashMembershipStats.old || 0}
            </div>
            <div className="text-xs text-orange-600 leading-tight">Antiguos</div>
            <div className="text-xs text-orange-500">+24h</div>
          </div>
        </div>
        
        {/* Total en quetzales */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 col-span-2 sm:col-span-1">
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-blue-900 flex items-center justify-center">
              <Bird className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {formatCurrency && formatCurrency(cashMembershipStats.totalAmount || 0)}
              </span>
            </div>
            <div className="text-xs text-blue-600">Total GTQ</div>
          </div>
        </div>
        
        {/* Promedio - Oculto en móvil pequeño, visible en sm+ */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 col-span-1 hidden sm:block">
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-purple-900 flex items-center justify-center">
              <Bird className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {formatCurrency && formatCurrency(cashMembershipStats.avgAmount || 0)}
              </span>
            </div>
            <div className="text-xs text-purple-600">Promedio</div>
          </div>
        </div>
        
        {/* Tiempo promedio - Oculto en móvil pequeño, visible en lg+ */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 col-span-1 hidden lg:block">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {(cashMembershipStats.avgHours || 0).toFixed(1)}h
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
              placeholder="Buscar por nombre, email o plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
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
                      onClick={() => setCashViewMode && setCashViewMode('grid')}
                      className={`flex-1 p-2.5 flex items-center justify-center text-sm font-medium transition-colors ${
                        cashViewMode === 'grid'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4 mr-1" />
                      Cards
                    </button>
                    <button
                      onClick={() => setCashViewMode && setCashViewMode('list')}
                      className={`flex-1 p-2.5 flex items-center justify-center text-sm font-medium transition-colors ${
                        cashViewMode === 'list'
                          ? 'bg-green-600 text-white'
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
                        ? 'bg-green-600 text-white'
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-700 font-medium">Filtros activos</span>
                    </div>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      Limpiar
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-green-600">
                    {cashPriorityFilter !== 'all' && `Prioridad: ${cashPriorityFilter} • `}
                    {cashSortBy !== 'waiting_time' && `Orden: ${cashSortBy} • `}
                    {searchTerm && `Búsqueda activa`}
                  </div>
                </div>
              )}
            </div>

            {/* Controles para desktop */}
            <div className="hidden sm:flex items-center space-x-3 flex-1">
              
              {/* Filtro de prioridad */}
              <select
                value={cashPriorityFilter}
                onChange={(e) => setCashPriorityFilter && setCashPriorityFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Todas</option>
                <option value="normal">Esperando normal</option>
                <option value="old">Antiguos (+24h)</option>
                <option value="very_old">Muy antiguos (+48h)</option>
              </select>
              
              {/* Selector de ordenamiento */}
              <select
                value={cashSortBy}
                onChange={(e) => setCashSortBy && setCashSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="waiting_time">Tiempo de espera</option>
                <option value="amount">Monto</option>
                <option value="name">Nombre</option>
                <option value="created">Fecha de creación</option>
              </select>
              
              {/* Selector de vista */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCashViewMode && setCashViewMode('grid')}
                  className={`p-2.5 ${
                    cashViewMode === 'grid' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setCashViewMode && setCashViewMode('list')}
                  className={`p-2.5 ${
                    cashViewMode === 'list' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Vista en lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {/* Contador de resultados */}
              <div className="text-sm text-gray-500 whitespace-nowrap">
                {filteredMemberships.length} membresías
              </div>
              
              {/* Botón limpiar filtros */}
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-green-600 hover:text-green-800 font-medium whitespace-nowrap"
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
                  Filtrar por tiempo de espera
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'Todas', icon: Eye, color: 'gray' },
                    { value: 'normal', label: 'Normal', icon: Clock, color: 'green' },
                    { value: 'old', label: 'Antiguos', icon: Timer, color: 'orange' },
                    { value: 'very_old', label: 'Críticos', icon: AlertTriangle, color: 'red' }
                  ].map((priority) => {
                    const IconComponent = priority.icon;
                    const colorClasses = {
                      gray: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                      green: 'border-green-500 bg-green-50 text-green-700',
                      orange: 'border-orange-500 bg-orange-50 text-orange-700',
                      red: 'border-red-500 bg-red-50 text-red-700'
                    };
                    
                    return (
                      <button
                        key={priority.value}
                        onClick={() => setCashPriorityFilter && setCashPriorityFilter(priority.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex flex-col items-center justify-center ${
                          cashPriorityFilter === priority.value
                            ? colorClasses[priority.color]
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mb-1" />
                        {priority.label}
                        {priority.value === 'old' && (
                          <span className="text-xs mt-1">+24h</span>
                        )}
                        {priority.value === 'very_old' && (
                          <span className="text-xs mt-1">+48h</span>
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
                  value={cashSortBy}
                  onChange={(e) => setCashSortBy && setCashSortBy(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  {filteredMemberships.length} membresía{filteredMemberships.length !== 1 ? 's' : ''} encontrada{filteredMemberships.length !== 1 ? 's' : ''}
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
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm"
                >
                  Ver resultados
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal de membresías */}
      {filteredMemberships.length === 0 ? (
        
        /* Estado vacío */
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 px-4">
            {searchTerm || cashPriorityFilter !== 'all'
              ? 'No se encontraron membresías con ese criterio'
              : 'Excelente! No hay membresías esperando pago en efectivo'
            }
          </h3>
          <p className="text-gray-600 px-4 text-sm sm:text-base">
            {searchTerm || cashPriorityFilter !== 'all'
              ? 'Intenta con otro criterio de búsqueda o filtro'
              : 'Todas las membresías en efectivo han sido procesadas'
            }
          </p>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
      ) : (
        
        /* Lista de membresías - RESPONSIVE GRID */
        <div className={`${
          cashViewMode === 'grid' 
            ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6' 
            : 'space-y-4'
        }`}>
          {filteredMemberships.map((membership) => {
            const isProcessing = isMembershipProcessing ? isMembershipProcessing(membership.id) : false;
            const processingType = getProcessingType ? getProcessingType(membership.id) : null;
            
            const commonProps = {
              membership,
              isProcessing,
              processingType,
              formatCurrency,
              formatDate,
              showSuccess,
              showError,
              onActivate: handleActivateWrapper,
              onCancel: handleCancelWrapper
            };
            
            return cashViewMode === 'grid' ? (
              <CashMembershipCard
                key={membership.id}
                {...commonProps}
              />
            ) : (
              <CashMembershipListItem
                key={membership.id}
                {...commonProps}
              />
            );
          })}
        </div>
      )}
      
      {/* Información adicional */}
      {filteredMemberships.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 text-center">
            {filteredMemberships.length === 1 
              ? 'Mostrando 1 membresía pendiente'
              : `Mostrando ${filteredMemberships.length} membresías pendientes`
            }
            {hasActiveFilters() && (
              <span> con filtros aplicados</span>
            )}
          </div>
          
          {/* Resumen de membresías antiguas */}
          {cashMembershipStats.old > 0 && (
            <div className="mt-2 flex items-center justify-center text-sm text-orange-600">
              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="font-medium text-center">
                {cashMembershipStats.old} membresías llevan más de 24 horas esperando
              </span>
            </div>
          )}
          
          {/* Nota sobre la naturaleza del efectivo */}
          <div className="mt-2 text-xs text-center text-gray-500 italic px-4">
            Los clientes pueden llegar a pagar cuando gusten. Solo cancela si estás seguro que no vendrán.
          </div>
        </div>
      )}
    </div>
  );
};

export default CashTab;

// Este componente maneja el tab completo de efectivo con todas sus funcionalidades
// Incluye estadísticas, filtros, búsqueda y visualización en grid/lista
// Coordina todos los controles y componentes relacionados con pagos en efectivo