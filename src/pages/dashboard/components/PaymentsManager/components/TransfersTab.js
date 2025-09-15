// src/pages/dashboard/components/PaymentsManager/components/TransfersTab.js
// Author: Alexander Echeverria
// Componente del tab de transferencias bancarias pendientes de validación
// Permite aprobar o rechazar transferencias con confirmación y feedback visual

// src/pages/dashboard/components/PaymentsManager/components/TransfersTab.js
// Author: Alexander Echeverria
// Tab de transferencias rediseñado para usar la misma estructura que efectivo
// REDISEÑADO: Ahora incluye estadísticas, filtros y vistas como en CashTab

import React from 'react';
import { 
  Search, CheckCircle, Grid3X3, List, Bird, AlertTriangle, 
  Clock, Building, FileText, Timer
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

  // Obtener las transferencias filtradas
  const filteredTransfers = getFilteredTransfers ? getFilteredTransfers() : pendingTransfers;

  return (
    <div className="space-y-6">
      
      {/* Estadísticas de transferencias */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Total esperando */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-900">
              {transferStats.total || 0}
            </div>
            <div className="text-xs text-purple-600">Esperando</div>
          </div>
        </div>
        
        {/* Críticas */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-900">
              {transferStats.critical || 0}
            </div>
            <div className="text-xs text-red-600">Críticas</div>
            <div className="text-xs text-red-500">+24h</div>
          </div>
        </div>
        
        {/* Total en quetzales */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900 flex items-center justify-center">
              <Bird className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {formatCurrency && formatCurrency(transferStats.totalAmount || 0)}
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
                {formatCurrency && formatCurrency(transferStats.avgAmount || 0)}
              </span>
            </div>
            <div className="text-xs text-purple-600">Promedio</div>
          </div>
        </div>
        
        {/* Tiempo promedio */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {(transferStats.avgHours || 0).toFixed(1)}h
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
            placeholder="Buscar por nombre, email o referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
        </div>
        
        {/* Controles de filtros y vista */}
        <div className="flex items-center space-x-3">
          
          {/* Filtro de prioridad */}
          <select
            value={transferPriorityFilter}
            onChange={(e) => setTransferPriorityFilter && setTransferPriorityFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              className={`p-2 ${
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
              className={`p-2 ${
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
          <div className="text-sm text-gray-500">
            {filteredTransfers.length} transferencias
          </div>
        </div>
      </div>

      {/* Contenido principal de transferencias */}
      {filteredTransfers.length === 0 ? (
        
        /* Estado vacío */
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm || transferPriorityFilter !== 'all'
              ? 'No se encontraron transferencias con ese criterio'
              : 'Excelente! No hay transferencias esperando validación'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm || transferPriorityFilter !== 'all'
              ? 'Intenta con otro criterio de búsqueda o filtro'
              : 'Todas las transferencias han sido procesadas'
            }
          </p>
        </div>
        
      ) : (
        
        /* Lista de transferencias */
        <div className={`${
          transferViewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
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
            {(searchTerm || transferPriorityFilter !== 'all') && (
              <span> con los filtros aplicados</span>
            )}
          </div>
          
          {/* Resumen de transferencias críticas */}
          {transferStats.critical > 0 && (
            <div className="mt-2 flex items-center justify-center text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {transferStats.critical} transferencias llevan más de 24 horas esperando
              </span>
            </div>
          )}
          
          {/* Nota sobre validación */}
          <div className="mt-2 text-xs text-center text-gray-500 italic">
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