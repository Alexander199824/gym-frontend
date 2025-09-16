// src/pages/dashboard/components/PaymentsManager/components/CashTab.js
// Author: Alexander Echeverria
// Componente completo del tab de efectivo con estadísticas, filtros y lista de membresías
// Maneja tanto vista grid como lista y todos los controles de filtrado

// src/pages/dashboard/components/PaymentsManager/components/CashTab.js
// Author: Alexander Echeverria
// Componente completo del tab de efectivo con estadísticas, filtros y lista de membresías
// MEJORADO: Asegurar que las funciones de confirmar/anular estén correctamente conectadas

import React from 'react';
import { 
  Search, CheckCircle, Grid3X3, List, Bird, AlertTriangle, 
  Clock, X 
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

  // Obtener las membresías filtradas
  const filteredMemberships = getFilteredCashMemberships ? getFilteredCashMemberships() : pendingCashMemberships;

  // MEJORADO: Función wrapper para activación con mejor logging
  const handleActivateWrapper = (membershipId, showSuccess, showError, formatCurrency) => {
    console.log('🟢 CashTab: Activando membresía', membershipId);
    
    if (!handleActivateCashMembership) {
      console.error('❌ handleActivateCashMembership no está disponible');
      showError && showError('Función de activación no disponible');
      return;
    }
    
    // Llamar a la función real del hook
    handleActivateCashMembership(membershipId, showSuccess, showError, formatCurrency);
  };

  // MEJORADO: Función wrapper para cancelación con mejor logging
  const handleCancelWrapper = (membershipId, showSuccess, showError, formatCurrency) => {
    console.log('🔴 CashTab: Cancelando membresía', membershipId);
    
    if (!handleCancelCashMembership) {
      console.error('❌ handleCancelCashMembership no está disponible');
      showError && showError('Función de cancelación no disponible');
      return;
    }
    
    // Llamar a la función real del hook
    handleCancelCashMembership(membershipId, showSuccess, showError, formatCurrency);
  };

  return (
    <div className="space-y-6">
      
      {/* Estadísticas de efectivo sin "urgentes" */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Total esperando */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">
              {cashMembershipStats.total || 0}
            </div>
            <div className="text-xs text-green-600">Esperando</div>
          </div>
        </div>
        
        {/* "Antiguos" en lugar de "Urgentes" */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-900">
              {cashMembershipStats.old || 0}
            </div>
            <div className="text-xs text-orange-600">Antiguos</div>
            <div className="text-xs text-orange-500">+24h</div>
          </div>
        </div>
        
        {/* Total en quetzales */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900 flex items-center justify-center">
              <Bird className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {formatCurrency && formatCurrency(cashMembershipStats.totalAmount || 0)}
              </span>
            </div>
            <div className="text-xs text-blue-600">Total GTQ</div>
          </div>
        </div>
        
        {/* Promedio */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-900 flex items-center justify-center">
              <Bird className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {formatCurrency && formatCurrency(cashMembershipStats.avgAmount || 0)}
              </span>
            </div>
            <div className="text-xs text-purple-600">Promedio</div>
          </div>
        </div>
        
        {/* Tiempo promedio */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {(cashMembershipStats.avgHours || 0).toFixed(1)}h
            </div>
            <div className="text-xs text-gray-600">Tiempo Prom.</div>
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
            placeholder="Buscar por nombre, email o plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
          />
        </div>
        
        {/* Controles de filtros y vista */}
        <div className="flex items-center space-x-3">
          
          {/* Filtro de prioridad sin "urgentes" */}
          <select
            value={cashPriorityFilter}
            onChange={(e) => setCashPriorityFilter && setCashPriorityFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              className={`p-2 ${
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
              className={`p-2 ${
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
          <div className="text-sm text-gray-500">
            {filteredMemberships.length} membresías
          </div>
        </div>
      </div>

      {/* MEJORADO: Información de debug para verificar funciones */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
          <div className="text-yellow-800">
            <strong>Debug Info:</strong> 
            handleActivate: {handleActivateCashMembership ? '✅' : '❌'}, 
            handleCancel: {handleCancelCashMembership ? '✅' : '❌'}, 
            memberships: {filteredMemberships.length}
          </div>
        </div>
      )}

      {/* Contenido principal de membresías */}
      {filteredMemberships.length === 0 ? (
        
        /* Estado vacío */
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm || cashPriorityFilter !== 'all'
              ? 'No se encontraron membresías con ese criterio'
              : 'Excelente! No hay membresías esperando pago en efectivo'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm || cashPriorityFilter !== 'all'
              ? 'Intenta con otro criterio de búsqueda o filtro'
              : 'Todas las membresías en efectivo han sido procesadas'
            }
          </p>
        </div>
        
      ) : (
        
        /* Lista de membresías */
        <div className={`${
          cashViewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
          {filteredMemberships.map((membership) => {
            const isProcessing = isMembershipProcessing ? isMembershipProcessing(membership.id) : false;
            const processingType = getProcessingType ? getProcessingType(membership.id) : null;
            
            // MEJORADO: Props completas y verificadas
            const commonProps = {
              membership,
              isProcessing,
              processingType,
              formatCurrency,
              formatDate,
              showSuccess,
              showError,
              // IMPORTANTE: Pasar las funciones wrapper que manejan los parámetros
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
      
      {/* Información adicional sin "urgentes" */}
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
              <Clock className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {cashMembershipStats.old} membresías llevan más de 24 horas esperando
              </span>
            </div>
          )}
          
          {/* Nota sobre la naturaleza del efectivo */}
          <div className="mt-2 text-xs text-center text-gray-500 italic">
            Los clientes pueden llegar a pagar cuando gusten. Solo cancela si estás seguro que no vendrán.
          </div>
          
          {/* NUEVO: Información sobre los botones */}
          <div className="mt-2 text-xs text-center text-blue-600">
            💡 Usa los botones "Confirmar" (verde) y "Anular" (rojo) para gestionar cada pago en efectivo
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