// src/pages/dashboard/components/PaymentsManager/components/CashTab.js
// Author: Alexander Echeverria
// Componente completo del tab de efectivo con estadísticas, filtros y lista de membresías
// Maneja tanto vista grid como lista y todos los controles de filtrado

// src/pages/dashboard/components/PaymentsManager/components/CashTab.js
// Author: Alexander Echeverria
// Componente completo del tab de efectivo con estadísticas, filtros y lista de membresías
// OPTIMIZADO: Completamente responsive para móvil sin perder funcionalidad

import React from 'react';
import { 
  Search, CheckCircle, Grid3X3, List, Bird, Clock, Filter, X
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

      {/* Controles de filtros y vista - COMPLETAMENTE RESPONSIVE */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        
        {/* Header con búsqueda y controles principales */}
        <div className="p-4 space-y-4">
          
          {/* Búsqueda y botón de filtros móvil */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            
            {/* Campo de búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
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
            
            {/* Botón de filtros para móvil */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden flex items-center justify-center px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {(cashPriorityFilter !== 'all' || cashSortBy !== 'waiting_time') && (
                <div className="ml-2 w-2 h-2 bg-green-300 rounded-full"></div>
              )}
            </button>
            
            {/* Controles para desktop */}
            <div className="hidden sm:flex items-center space-x-3">
              
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
            </div>
          </div>
          
          {/* Panel de filtros móvil */}
          {showMobileFilters && (
            <div className="sm:hidden bg-gray-50 rounded-lg p-4 space-y-4 border-t border-gray-200">
              
              {/* Filtro de prioridad móvil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por prioridad
                </label>
                <select
                  value={cashPriorityFilter}
                  onChange={(e) => setCashPriorityFilter && setCashPriorityFilter(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">Todas las membresías</option>
                  <option value="normal">Esperando normal</option>
                  <option value="old">Antiguos (+24h)</option>
                  <option value="very_old">Muy antiguos (+48h)</option>
                </select>
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
                  <option value="waiting_time">Tiempo de espera</option>
                  <option value="amount">Monto</option>
                  <option value="name">Nombre del cliente</option>
                  <option value="created">Fecha de creación</option>
                </select>
              </div>
              
              {/* Vista móvil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de vista
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCashViewMode && setCashViewMode('grid')}
                    className={`flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      cashViewMode === 'grid'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    Tarjetas
                  </button>
                  <button
                    onClick={() => setCashViewMode && setCashViewMode('list')}
                    className={`flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      cashViewMode === 'list'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Lista
                  </button>
                </div>
              </div>
              
              {/* Contador de resultados móvil */}
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {filteredMemberships.length} membresía{filteredMemberships.length !== 1 ? 's' : ''} encontrada{filteredMemberships.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Botón para cerrar filtros */}
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full px-4 py-2.5 bg-gray-600 text-white rounded-lg font-medium text-sm"
              >
                Aplicar filtros
              </button>
            </div>
          )}
        </div>
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
            {(searchTerm || cashPriorityFilter !== 'all') && (
              <span> con los filtros aplicados</span>
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