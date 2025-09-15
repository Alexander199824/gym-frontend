// src/pages/dashboard/components/PaymentsManager/components/TransfersTab.js
// Author: Alexander Echeverria
// Componente del tab de transferencias bancarias pendientes de validación
// Permite aprobar o rechazar transferencias con confirmación y feedback visual

import React from 'react';
import { 
  CheckCircle, XCircle, Check, X, Loader2, Bird, 
  Calendar, User, Phone, Mail, Building, AlertTriangle,
  Timer, TrendingUp
} from 'lucide-react';

const TransfersTab = ({ 
  pendingTransfers,
  loading,
  handleValidateTransfer,
  isTransferProcessing,
  getTransferPriority,
  getSortedTransfers,
  getTransferStats,
  formatCurrency,
  formatDate,
  showSuccess,
  showError,
  onSave 
}) => {

  // Obtener transferencias ordenadas por prioridad
  const sortedTransfers = getSortedTransfers();
  
  // Obtener estadísticas de transferencias
  const transferStats = getTransferStats();

  // Función para manejar aprobación
  const handleApprove = (transferId) => {
    handleValidateTransfer(transferId, true, showSuccess, showError);
  };

  // Función para manejar rechazo
  const handleReject = (transferId) => {
    handleValidateTransfer(transferId, false, showSuccess, showError);
  };

  // Función para obtener clases CSS de prioridad
  const getPriorityClasses = (priority) => {
    switch (priority.level) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Estadísticas de transferencias */}
      {transferStats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Total pendientes */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">
                {transferStats.total}
              </div>
              <div className="text-xs text-purple-600">Pendientes</div>
            </div>
          </div>
          
          {/* Críticas */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-900">
                {transferStats.critical}
              </div>
              <div className="text-xs text-red-600">Críticas</div>
            </div>
          </div>
          
          {/* Prioritarias */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-900">
                {transferStats.high}
              </div>
              <div className="text-xs text-orange-600">Prioritarias</div>
            </div>
          </div>
          
          {/* Monto total */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-900 flex items-center justify-center">
                <Bird className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  {formatCurrency(transferStats.totalAmount)}
                </span>
              </div>
              <div className="text-xs text-blue-600">Total GTQ</div>
            </div>
          </div>
          
          {/* Tiempo promedio */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {transferStats.avgWaitingTime.toFixed(1)}h
              </div>
              <div className="text-xs text-gray-600">Tiempo Prom.</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de transferencias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {sortedTransfers.length === 0 ? (
          
          /* Estado sin transferencias pendientes */
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay transferencias pendientes
            </h3>
            <p className="text-gray-600">
              Todas las transferencias han sido procesadas
            </p>
          </div>
          
        ) : (
          
          /* Lista de transferencias pendientes */
          <div className="divide-y divide-gray-200">
            {sortedTransfers.map((transfer) => {
              const isProcessing = isTransferProcessing(transfer.id);
              const priority = getTransferPriority(transfer);
              
              return (
                <div 
                  key={transfer.id} 
                  className={`p-6 transition-colors duration-150 ${
                    priority.level === 'critical' ? 'bg-red-50' :
                    priority.level === 'high' ? 'bg-orange-50' :
                    priority.level === 'medium' ? 'bg-yellow-50' :
                    'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    
                    {/* Información de la transferencia */}
                    <div className="flex-1">
                      
                      {/* Header con nombre y prioridad */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {transfer.user?.name || 'Cliente Anónimo'}
                        </h4>
                        
                        {/* Indicador de prioridad */}
                        {priority.level !== 'normal' && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityClasses(priority)}`}>
                            {priority.level === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {priority.level === 'high' && <Timer className="w-3 h-3 mr-1" />}
                            {priority.label}
                          </span>
                        )}
                      </div>
                      
                      {/* Monto destacado */}
                      <div className="text-2xl font-bold text-green-600 flex items-center mb-3">
                        <Bird className="w-6 h-6 mr-2" />
                        {formatCurrency(transfer.amount)}
                      </div>
                      
                      {/* Información detallada */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        
                        {/* Fecha y tiempo */}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatDate(transfer.paymentDate || transfer.createdAt, 'dd/MM/yyyy')}
                            </div>
                            <div className="text-xs">
                              {formatDate(transfer.paymentDate || transfer.createdAt, 'HH:mm')}
                            </div>
                          </div>
                        </div>
                        
                        {/* Tiempo de espera */}
                        <div className="flex items-center">
                          <Timer className="w-4 h-4 mr-2" />
                          <div>
                            <div className={`font-medium ${
                              priority.level === 'critical' ? 'text-red-600' :
                              priority.level === 'high' ? 'text-orange-600' :
                              priority.level === 'medium' ? 'text-yellow-600' :
                              'text-gray-900'
                            }`}>
                              {transfer.hoursWaiting?.toFixed(1) || '0.0'} horas
                            </div>
                            <div className="text-xs">esperando</div>
                          </div>
                        </div>
                        
                        {/* Email */}
                        {transfer.user?.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900 truncate">
                                {transfer.user.email}
                              </div>
                              <div className="text-xs">Email</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Teléfono */}
                        {transfer.user?.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {transfer.user.phone}
                              </div>
                              <div className="text-xs">Teléfono</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Información adicional */}
                      {transfer.reference && (
                        <div className="mt-3 text-sm">
                          <span className="font-medium text-gray-700">Referencia:</span>
                          <span className="ml-2 text-gray-600">{transfer.reference}</span>
                        </div>
                      )}
                      
                      {transfer.notes && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium text-gray-700">Notas:</span>
                          <span className="ml-2 text-gray-600">{transfer.notes}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex space-x-3 lg:ml-6">
                      
                      {/* Botón aprobar */}
                      <button
                        onClick={() => handleApprove(transfer.id)}
                        disabled={isProcessing}
                        className="btn-success px-6 py-3 text-sm font-medium"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Aprobar
                          </>
                        )}
                      </button>
                      
                      {/* Botón rechazar */}
                      <button
                        onClick={() => handleReject(transfer.id)}
                        disabled={isProcessing}
                        className="btn-danger px-6 py-3 text-sm font-medium"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Rechazar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Información adicional al final */}
      {sortedTransfers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 text-center">
            {sortedTransfers.length === 1 
              ? 'Mostrando 1 transferencia pendiente'
              : `Mostrando ${sortedTransfers.length} transferencias pendientes`
            }
          </div>
          
          {/* Alerta de transferencias críticas */}
          {transferStats.critical > 0 && (
            <div className="mt-2 flex items-center justify-center text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {transferStats.critical} transferencias requieren atención inmediata
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransfersTab;

// Este componente maneja el tab completo de transferencias bancarias pendientes
// Incluye estadísticas, priorización por tiempo de espera y acciones de validación
// Proporciona feedback visual claro sobre la urgencia de cada transferencia