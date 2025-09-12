// Autor: Alexander Echeverria
// src/components/payments/TransferValidationView.js
// FUNCIÓN: Vista específica para validación rápida de transferencias bancarias
// USO: Como página independiente o modal para staff de recepción

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  User,
  Bird,
  Loader2,
  CheckCircle,
  XCircle,
  Timer,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

const TransferValidationView = ({ 
  onTransferProcessed = null, 
  showCompactView = false,
  autoRefresh = true 
}) => {
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [expandedTransfer, setExpandedTransfer] = useState(null);
  
  // Referencias para auto-refresh
  const refreshIntervalRef = React.useRef(null);

  // CARGAR TRANSFERENCIAS PENDIENTES
  const loadTransfers = async () => {
    try {
      console.log('🏦 Cargando transferencias pendientes...');
      
      const response = await apiService.getPendingTransfersDetailed();
      const transfersData = response.data?.transfers || [];
      
      setTransfers(transfersData);
      console.log(`✅ ${transfersData.length} transferencias cargadas`);
      
    } catch (error) {
      console.error('❌ Error al cargar transferencias:', error);
      showError('Error al cargar transferencias pendientes');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  // VALIDAR TRANSFERENCIA
  const handleValidateTransfer = async (transferId, approved, notes = '') => {
    if (processingIds.has(transferId)) return;

    try {
      setProcessingIds(prev => new Set([...prev, transferId]));
      
      const transferData = transfers.find(t => t.id === transferId);
      console.log(`${approved ? '✅ Aprobando' : '❌ Rechazando'} transferencia:`, transferId);
      
      await apiService.validateTransfer(transferId, approved, notes);
      
      const successMessage = approved 
        ? `Transferencia aprobada. ${transferData?.membership ? 'Membresía activada' : 'Pago completado'}.`
        : 'Transferencia rechazada correctamente.';
        
      showSuccess(successMessage);
      
      // Remover de la lista
      setTransfers(prev => prev.filter(t => t.id !== transferId));
      
      // Notificar al componente padre
      if (onTransferProcessed) {
        onTransferProcessed({
          transferId,
          approved,
          clientName: transferData?.user?.name || 'Cliente Anónimo',
          amount: transferData?.amount || 0
        });
      }
      
    } catch (error) {
      console.error('Error al validar transferencia:', error);
      const errorMsg = error.response?.data?.message || 
        (approved ? 'Error al aprobar transferencia' : 'Error al rechazar transferencia');
      showError(errorMsg);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(transferId);
        return newSet;
      });
    }
  };

  // OBTENER CONFIGURACIÓN DE PRIORIDAD
  const getPriorityConfig = (hoursWaiting) => {
    return apiService.getTransferPriorityConfig(hoursWaiting);
  };

  // FILTRAR TRANSFERENCIAS
  const getFilteredTransfers = () => {
    return transfers.filter(transfer => {
      if (priorityFilter === 'all') return true;
      const priority = getPriorityConfig(transfer.hoursWaiting).priority;
      return priority === priorityFilter;
    });
  };

  // OBTENER ESTADÍSTICAS
  const getStats = () => {
    const total = transfers.length;
    const critical = transfers.filter(t => getPriorityConfig(t.hoursWaiting).priority === 'critical').length;
    const totalAmount = transfers.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgHours = total > 0 ? transfers.reduce((sum, t) => sum + (t.hoursWaiting || 0), 0) / total : 0;
    
    return { total, critical, totalAmount, avgHours };
  };

  // CONFIGURAR AUTO-REFRESH
  useEffect(() => {
    loadTransfers();
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadTransfers, 30000); // Cada 30 segundos
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Verificar permisos
  if (!hasPermission('validate_transfers')) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">
            No tienes permisos para validar transferencias.
          </p>
        </div>
      </div>
    );
  }

  const filteredTransfers = getFilteredTransfers();
  const stats = getStats();

  return (
    <div className={`${showCompactView ? 'space-y-4' : 'space-y-6'}`}>
      
      {/* HEADER */}
      {!showCompactView && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building className="w-8 h-8 mr-3 text-purple-600" />
              Validación de Transferencias
            </h2>
            <p className="text-gray-600 mt-1">
              Aprueba o rechaza transferencias bancarias en quetzales guatemaltecos
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={loadTransfers}
              disabled={loading}
              className="btn-secondary btn-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            {stats.critical > 0 && (
              <div className="flex items-center space-x-1 text-red-600 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>{stats.critical} críticas</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className={`grid grid-cols-2 ${showCompactView ? 'md:grid-cols-4' : 'md:grid-cols-4'} gap-4`}>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-900">{stats.total}</div>
            <div className="text-xs text-purple-600">Pendientes</div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
            <div className="text-xs text-red-600">Críticas</div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-900 flex items-center justify-center">
              <Bird className="w-4 h-4 mr-1" />
              <span className="text-sm">{formatCurrency(stats.totalAmount)}</span>
            </div>
            <div className="text-xs text-green-600">Total GTQ</div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-900">{stats.avgHours.toFixed(1)}h</div>
            <div className="text-xs text-orange-600">Promedio</div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex items-center justify-between">
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="all">Todas las prioridades ({stats.total})</option>
          <option value="critical">🔴 Críticas (+72h)</option>
          <option value="high">🟠 Altas (+48h)</option>
          <option value="medium">🟡 Medias (+24h)</option>
          <option value="normal">🟢 Normales (&lt;24h)</option>
        </select>
        
        <div className="text-sm text-gray-500">
          Mostrando {filteredTransfers.length} transferencias
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-lg text-gray-600">Cargando transferencias...</span>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {priorityFilter === 'all' 
              ? '¡Excelente! No hay transferencias pendientes' 
              : `No hay transferencias ${priorityFilter}`
            }
          </h3>
          <p className="text-gray-600">
            {priorityFilter === 'all'
              ? 'Todas las transferencias han sido procesadas correctamente'
              : 'Cambia el filtro para ver otras transferencias'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransfers.map((transfer) => {
            const priorityConfig = getPriorityConfig(transfer.hoursWaiting);
            const isProcessing = processingIds.has(transfer.id);
            const isExpanded = expandedTransfer === transfer.id;
            
            return (
              <div 
                key={transfer.id} 
                className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                  priorityConfig.priority === 'critical' ? 'ring-2 ring-red-200' : ''
                }`}
              >
                
                {/* HEADER DE LA TARJETA */}
                <div 
                  className={`p-4 ${priorityConfig.bg} border-b cursor-pointer`}
                  onClick={() => setExpandedTransfer(isExpanded ? null : transfer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 shadow-sm">
                        <span className="text-lg font-bold text-gray-700">
                          {transfer.user ? 
                            `${transfer.user.name[0]}${transfer.user.name.split(' ')[1]?.[0] || ''}` :
                            'A'
                          }
                        </span>
                      </div>
                      
                      {/* Información principal */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {transfer.user?.name || 'Cliente Anónimo'}
                          </h3>
                          
                          {/* Badge de prioridad */}
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${priorityConfig.color} bg-white border`}>
                            {priorityConfig.priority.toUpperCase()} • {transfer.hoursWaiting.toFixed(1)}h
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Bird className="w-4 h-4 mr-1 text-green-600" />
                            <span className="font-semibold text-green-700">
                              {formatCurrency(transfer.amount)}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formatDate(transfer.paymentDate || transfer.createdAt, 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          
                          {transfer.membership && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              <span>Membresía {transfer.membership.type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de acción principales */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleValidateTransfer(transfer.id, true, 'Comprobante verificado correctamente');
                        }}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
                          isProcessing 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg hover:shadow-xl'
                        }`}
                        title="Aprobar transferencia"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Aprobar
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleValidateTransfer(transfer.id, false, 'Comprobante no válido o datos incorrectos');
                        }}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
                          isProcessing 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 shadow-lg hover:shadow-xl'
                        }`}
                        title="Rechazar transferencia"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Rechazar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* DETALLES EXPANDIDOS */}
                {isExpanded && (
                  <div className="p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Información del cliente */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Información del Cliente</h4>
                        <div className="space-y-2 text-sm">
                          {transfer.user?.email && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-700">{transfer.user.email}</span>
                            </div>
                          )}
                          {transfer.user?.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-700">{transfer.user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Timer className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">
                              Esperando {transfer.hoursWaiting.toFixed(1)} horas
                            </span>
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">
                              Registrado por: {transfer.registeredBy?.name || 'Sistema automático'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detalles del pago */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Detalles del Pago</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Monto:</span>
                            <span className="font-semibold text-green-600 flex items-center">
                              <Bird className="w-3 h-3 mr-1" />
                              {formatCurrency(transfer.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tipo:</span>
                            <span className="text-gray-900">
                              {transfer.membership ? 'Membresía' : transfer.description || 'Pago general'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fecha:</span>
                            <span className="text-gray-900">
                              {formatDate(transfer.paymentDate || transfer.createdAt, 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          {transfer.membership && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Plan:</span>
                              <span className="text-gray-900">{transfer.membership.type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Comprobante */}
                      {transfer.transferProof && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Comprobante de Transferencia</h4>
                          <div className="flex items-start space-x-4">
                            <img
                              src={transfer.transferProof}
                              alt="Comprobante de transferencia"
                              className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(transfer.transferProof, '_blank')}
                            />
                            <div className="flex-1">
                              <button
                                onClick={() => window.open(transfer.transferProof, '_blank')}
                                className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm mb-2"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Abrir comprobante en nueva ventana
                              </button>
                              <p className="text-xs text-gray-500">
                                Click en la imagen o el enlace para ver el comprobante completo
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransferValidationView;

/*
DOCUMENTACIÓN DEL COMPONENTE TransferValidationView

PROPÓSITO:
Componente especializado para la validación rápida y eficiente de transferencias bancarias.
Diseñado para staff de recepción que necesita procesar transferencias de manera ágil,
con interfaz optimizada para el contexto guatemalteco y pagos en quetzales.

FUNCIONALIDADES QUE VE EL USUARIO:

VISTA PRINCIPAL:
- Estadísticas en tiempo real:
  - Total de transferencias pendientes
  - Número de transferencias críticas (+72h)
  - Monto total pendiente en quetzales
  - Tiempo promedio de espera
- Sistema de filtros por prioridad con colores:
  - 🔴 Críticas: +72 horas (borde rojo)
  - 🟠 Altas: +48 horas
  - 🟡 Medias: +24 horas
  - 🟢 Normales: <24 horas
- Contador dinámico de transferencias mostradas

TARJETAS DE TRANSFERENCIA:
- Diseño compacto y expandible:
  - Header con información esencial:
    - Avatar con iniciales del cliente
    - Nombre del cliente
    - Monto en quetzales con icono de quetzal
    - Fecha y hora de la transferencia
    - Badge de prioridad por color
    - Botones de acción prominentes
  - Click para expandir detalles completos:
    - Información de contacto del cliente
    - Detalles completos del pago
    - Preview del comprobante de transferencia
    - Información de registro

ACCIONES PRINCIPALES:
- Botón "Aprobar": Verde, valida la transferencia
- Botón "Rechazar": Rojo, rechaza la transferencia
- Estados de procesamiento con spinners
- Efectos hover con escalado y sombras
- Feedback inmediato al procesar

COMPROBANTES:
- Preview de imagen en tarjeta expandida
- Click en imagen para vista completa
- Enlace para abrir en nueva ventana
- Interfaz táctil optimizada para tablets

PROPS DISPONIBLES:
- onTransferProcessed: Callback cuando se procesa una transferencia
- showCompactView: Versión compacta para modales o sidebars
- autoRefresh: Auto-actualización cada 30 segundos

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTS REQUERIDOS:
- AuthContext: Verificación de permisos 'validate_transfers'
- AppContext: Notificaciones y formateo de datos

SERVICIOS UTILIZADOS:
- apiService.getPendingTransfersDetailed(): Lista con detalles
- apiService.validateTransfer(): Aprobar/rechazar
- apiService.getTransferPriorityConfig(): Configuración de prioridades

ICONOGRAFÍA:
- Building: Transferencias bancarias
- Bird: Quetzal para montos en GTQ
- Check/X: Aprobar/rechazar
- Timer: Tiempo de espera
- ExternalLink: Ver comprobantes

ESTADOS MANEJADOS:
- loading: Estado de carga inicial
- processingIds: Set de IDs siendo procesados
- priorityFilter: Filtro de prioridad activo
- expandedTransfer: ID de transferencia expandida

PERMISOS REQUERIDOS:
- validate_transfers: Para acceder a la vista
- Sin permisos muestra mensaje de acceso denegado

CARACTERÍSTICAS ESPECIALES:
- Auto-refresh configurable
- Interfaz optimizada para procesamiento rápido
- Diseño responsivo para móvil y escritorio
- Animaciones suaves y feedback visual
- Eliminación automática de transferencias procesadas
- Callback al componente padre para notificaciones

CASOS DE USO:
- Página independiente para validación de transferencias
- Modal dentro del dashboard principal
- Widget en sidebar para procesamiento rápido
- Vista en tablet para personal de recepción
- Integración en flujo de trabajo de pagos

EXPERIENCIA DEL USUARIO GUATEMALTECO:
- Montos siempre mostrados en quetzales (GTQ)
- Icono de ave quetzal para identificación clara
- Fechas en formato local (dd/MM/yyyy)
- Interfaz en español
- Priorización de transferencias por tiempo de espera
- Validación rápida con dos botones grandes
- Comprobantes fáciles de visualizar en dispositivos móviles

INTEGRACIÓN CON EL SISTEMA:
- Se conecta con el backend de pagos existente
- Invalidación automática de cache
- Logging de todas las acciones
- Manejo de errores específicos
- Compatibilidad con sistema de permisos

BENEFICIOS OPERATIVOS:
- Procesamiento rápido de transferencias
- Reducción de tiempos de espera de clientes
- Interfaz especializada para recepcionistas
- Seguimiento en tiempo real de prioridades
- Eliminación de cuellos de botella en validación
- Auditoría completa de acciones realizadas

Este componente es ideal para complementar el PaymentsManager principal,
proporcionando una interfaz especializada y eficiente para el personal
que se encarga específicamente de validar transferencias bancarias
en el contexto del gimnasio guatemalteco.
*/