// src/pages/dashboard/components/PaymentsManager/components/TransfersTab.js
// Author: Alexander Echeverria
// Componente del tab de transferencias bancarias pendientes de validación
// Permite aprobar o rechazar transferencias con confirmación y feedback visual

// src/pages/dashboard/components/PaymentsManager/components/TransfersTab.js
// Author: Alexander Echeverria
// Componente del tab de transferencias bancarias pendientes de validación
// MEJORADO: Ahora muestra comprobantes inline y más información detallada

import React, { useState } from 'react';
import { 
  CheckCircle, Check, X, Loader2, Bird, Calendar, Building, 
  AlertTriangle, Timer, User, Mail, Phone, CreditCard, 
  FileText, Eye, EyeOff, MapPin, Clock
} from 'lucide-react';
import TransferProofViewer from './TransferProofViewer';

const TransfersTab = ({ 
  pendingTransfers = [],
  loading = false,
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

  // Estado para controlar qué comprobantes están expandidos
  const [expandedProofs, setExpandedProofs] = useState(new Set());

  // Obtener transferencias ordenadas por prioridad
  const sortedTransfers = getSortedTransfers ? getSortedTransfers() : [...pendingTransfers].sort((a, b) => (b.hoursWaiting || 0) - (a.hoursWaiting || 0));
  
  // Obtener estadísticas de transferencias
  const transferStats = getTransferStats ? getTransferStats() : {
    total: pendingTransfers.length,
    critical: pendingTransfers.filter(t => (t.hoursWaiting || 0) > 24).length,
    high: pendingTransfers.filter(t => (t.hoursWaiting || 0) > 12).length,
    totalAmount: pendingTransfers.reduce((sum, t) => sum + (t.amount || 0), 0),
    avgWaitingTime: pendingTransfers.length > 0 ? pendingTransfers.reduce((sum, t) => sum + (t.hoursWaiting || 0), 0) / pendingTransfers.length : 0,
    withProof: pendingTransfers.filter(t => t.transferProof).length,
    withoutProof: pendingTransfers.filter(t => !t.transferProof).length
  };

  // Función para alternar expansión de comprobante
  const toggleProofExpansion = (transferId) => {
    setExpandedProofs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transferId)) {
        newSet.delete(transferId);
      } else {
        newSet.add(transferId);
      }
      return newSet;
    });
  };

  // Función para manejar aprobación
  const handleApprove = (transferId) => {
    if (handleValidateTransfer) {
      handleValidateTransfer(transferId, true, showSuccess, showError);
    }
  };

  // Función para manejar rechazo
  const handleReject = (transferId) => {
    if (handleValidateTransfer) {
      handleValidateTransfer(transferId, false, showSuccess, showError);
    }
  };

  // Función para obtener información de prioridad
  const getPriority = (transfer) => {
    if (getTransferPriority) {
      return getTransferPriority(transfer);
    }
    
    const hoursWaiting = transfer.hoursWaiting || 0;
    if (hoursWaiting > 24) {
      return { level: 'critical', color: 'red', label: 'Crítica' };
    } else if (hoursWaiting > 12) {
      return { level: 'high', color: 'orange', label: 'Alta' };
    } else if (hoursWaiting > 4) {
      return { level: 'medium', color: 'yellow', label: 'Media' };
    }
    return { level: 'normal', color: 'green', label: 'Normal' };
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

  return (
    <div className="space-y-6">
      
      {/* Estadísticas mejoradas de transferencias */}
      {transferStats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          {/* Total pendientes */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">
                {transferStats.total}
              </div>
              <div className="text-xs text-purple-600">Pendientes</div>
            </div>
          </div>
          
          {/* Con comprobante */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">
                {transferStats.withProof}
              </div>
              <div className="text-xs text-green-600">Con comprobante</div>
            </div>
          </div>
          
          {/* Sin comprobante */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {transferStats.withoutProof}
              </div>
              <div className="text-xs text-gray-600">Sin comprobante</div>
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
          
          {/* Monto total */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-900 flex items-center justify-center">
                <Bird className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  {formatCurrency && formatCurrency(transferStats.totalAmount)}
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

      {/* Lista de transferencias mejorada */}
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
          
          /* Lista de transferencias pendientes MEJORADA */
          <div className="divide-y divide-gray-200">
            {sortedTransfers.map((transfer) => {
              const isProcessing = isTransferProcessing ? isTransferProcessing(transfer.id) : false;
              const priority = getPriority(transfer);
              const isProofExpanded = expandedProofs.has(transfer.id);
              
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
                  <div className="space-y-6">
                    
                    {/* Header principal con información básica */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      
                      {/* Información principal de la transferencia */}
                      <div className="flex-1 space-y-4">
                        
                        {/* Header con nombre, prioridad y monto */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-xl font-semibold text-gray-900">
                              {transfer.user?.name || 
                               `${transfer.user?.firstName || ''} ${transfer.user?.lastName || ''}`.trim() || 
                               'Cliente Anónimo'}
                            </h4>
                            
                            {/* Indicador de prioridad */}
                            {priority.level !== 'normal' && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityClasses(priority)}`}>
                                {priority.level === 'critical' && <AlertTriangle className="w-4 h-4 mr-1" />}
                                {priority.level === 'high' && <Timer className="w-4 h-4 mr-1" />}
                                {priority.label}
                              </span>
                            )}
                          </div>
                          
                          {/* Monto destacado */}
                          <div className="text-3xl font-bold text-green-600 flex items-center mt-2 sm:mt-0">
                            <Bird className="w-7 h-7 mr-2" />
                            {formatCurrency && formatCurrency(transfer.amount)}
                          </div>
                        </div>
                        
                        {/* Información del cliente en grid */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Información del Cliente
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            
                            {/* Email */}
                            {transfer.user?.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900">Email</div>
                                  <div className="text-gray-600 break-all">{transfer.user.email}</div>
                                </div>
                              </div>
                            )}
                            
                            {/* Teléfono */}
                            {transfer.user?.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900">Teléfono</div>
                                  <div className="text-gray-600">{transfer.user.phone}</div>
                                </div>
                              </div>
                            )}
                            
                            {/* Referencia */}
                            {transfer.reference && (
                              <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900">Referencia</div>
                                  <div className="text-gray-600 font-mono">{transfer.reference}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Información de tiempo y fechas */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Información Temporal
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            
                            {/* Fecha de creación */}
                            <div className="flex items-start space-x-2">
                              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="font-medium text-gray-900">Fecha de pago</div>
                                <div className="text-gray-600">
                                  {formatDetailedTime(transfer.paymentDate || transfer.createdAt)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Tiempo de espera */}
                            <div className="flex items-start space-x-2">
                              <Timer className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="font-medium text-gray-900">Tiempo esperando</div>
                                <div className={`font-medium ${
                                  priority.level === 'critical' ? 'text-red-600' :
                                  priority.level === 'high' ? 'text-orange-600' :
                                  priority.level === 'medium' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  {transfer.hoursWaiting?.toFixed(1) || '0.0'} horas
                                </div>
                                {priority.level !== 'normal' && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Prioridad {priority.label.toLowerCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Información de quien registró */}
                            {transfer.registeredByUser && (
                              <div className="flex items-start space-x-2 md:col-span-2">
                                <User className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium text-gray-900">Registrado por</div>
                                  <div className="text-gray-600">
                                    {transfer.registeredByUser.firstName} {transfer.registeredByUser.lastName}
                                    <span className="text-gray-400 ml-2">({transfer.registeredByUser.role})</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Información de membresía (si existe) */}
                        {transfer.membership && (
                          <div className="bg-purple-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                              <Building className="w-4 h-4 mr-2" />
                              Membresía Asociada
                            </h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-900">Tipo</div>
                                <div className="text-gray-600">{transfer.membership.type}</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">Inicio</div>
                                <div className="text-gray-600">
                                  {formatDate && formatDate(transfer.membership.startDate, 'dd/MM/yyyy')}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">Vencimiento</div>
                                <div className="text-gray-600">
                                  {formatDate && formatDate(transfer.membership.endDate, 'dd/MM/yyyy')}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Descripción y notas */}
                        {(transfer.description || transfer.notes) && (
                          <div className="bg-yellow-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Notas y Descripción
                            </h5>
                            
                            {transfer.description && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Descripción:</span>
                                <span className="text-sm text-gray-600 ml-2">{transfer.description}</span>
                              </div>
                            )}
                            
                            {transfer.notes && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Notas:</span>
                                <span className="text-sm text-gray-600 ml-2">{transfer.notes}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex space-x-3 lg:ml-6 lg:flex-col lg:space-x-0 lg:space-y-3">
                        
                        {/* Botón aprobar */}
                        <button
                          onClick={() => handleApprove(transfer.id)}
                          disabled={isProcessing}
                          className="btn-success px-6 py-3 text-sm font-medium flex-1 lg:flex-none"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
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
                          className="btn-danger px-6 py-3 text-sm font-medium flex-1 lg:flex-none"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Rechazar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Visualizador de comprobante mejorado */}
                    <div className="border-t border-gray-200 pt-4">
                      <TransferProofViewer
                        proofUrl={transfer.transferProof}
                        transferId={transfer.id}
                        clientName={transfer.user?.name || `${transfer.user?.firstName || ''} ${transfer.user?.lastName || ''}`.trim() || 'Cliente'}
                        amount={transfer.amount}
                        formatCurrency={formatCurrency}
                        isExpanded={isProofExpanded}
                        onToggleExpand={() => toggleProofExpansion(transfer.id)}
                      />
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
          
          {/* Resumen de acciones necesarias */}
          <div className="mt-3 space-y-2">
            {transferStats.withProof > 0 && (
              <div className="flex items-center justify-center text-sm text-green-600">
                <Check className="w-4 h-4 mr-1" />
                <span className="font-medium">
                  {transferStats.withProof} transferencias con comprobante listas para validar
                </span>
              </div>
            )}
            
            {transferStats.withoutProof > 0 && (
              <div className="flex items-center justify-center text-sm text-orange-600">
                <FileText className="w-4 h-4 mr-1" />
                <span className="font-medium">
                  {transferStats.withoutProof} transferencias esperando comprobante del cliente
                </span>
              </div>
            )}
            
            {transferStats.critical > 0 && (
              <div className="flex items-center justify-center text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="font-medium">
                  {transferStats.critical} transferencias requieren atención inmediata (+24h)
                </span>
              </div>
            )}
          </div>
          
          {/* Nota sobre la validación */}
          <div className="mt-3 text-xs text-center text-gray-500 italic">
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