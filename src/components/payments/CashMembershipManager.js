// Autor: Alexander Echeverria
// src/components/payments/CashMembershipManager.js
// FUNCIÓN: Gestión específica de membresías esperando pago en efectivo
// USO: Para personal de recepción cuando llegan clientes a pagar

import React, { useState, useEffect } from 'react';
import {
  Banknote,
  CheckCircle,
  Clock,
  User,
  Calendar,
  RefreshCw,
  Loader2,
  Bird,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Timer,
  Search,
  Filter,
  Grid3X3,
  List,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

const CashMembershipManager = ({ 
  onMembershipActivated = null,
  showCompactView = false,
  autoRefresh = true
}) => {
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('waiting_time'); // 'waiting_time', 'amount', 'name', 'created'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  
  // Referencias para auto-refresh
  const refreshIntervalRef = React.useRef(null);

  // CARGAR MEMBRESÍAS PENDIENTES
  const loadMemberships = async () => {
    try {
      console.log('💵 Cargando membresías en efectivo pendientes...');
      
      const response = await apiService.getPendingCashMemberships();
      const membershipsData = response.data?.memberships || [];
      
      setMemberships(membershipsData);
      console.log(`✅ ${membershipsData.length} membresías en efectivo cargadas`);
      
    } catch (error) {
      console.error('❌ Error al cargar membresías en efectivo:', error);
      showError('Error al cargar membresías pendientes');
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  // ACTIVAR MEMBRESÍA EN EFECTIVO
  const handleActivateMembership = async (membershipId) => {
    if (processingIds.has(membershipId)) return;

    const membershipData = memberships.find(m => m.id === membershipId);
    
    // Confirmación
    const confirmed = window.confirm(
      `¿Confirmar que recibiste ${formatCurrency(membershipData?.price || 0)} en efectivo de ${membershipData?.user?.name || 'cliente'}?`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, membershipId]));
      
      console.log('💵 Activando membresía en efectivo:', membershipId);
      
      const result = await apiService.activateCashMembership(membershipId);
      
      showSuccess(
        `¡Membresía activada! Pago de ${formatCurrency(result.data?.payment?.amount || membershipData?.price || 0)} registrado correctamente.`
      );
      
      // Remover de la lista
      setMemberships(prev => prev.filter(m => m.id !== membershipId));
      
      // Notificar al componente padre
      if (onMembershipActivated) {
        onMembershipActivated({
          membershipId,
          clientName: membershipData?.user?.name || 'Cliente',
          amount: membershipData?.price || 0,
          planName: membershipData?.plan?.name || 'Plan personalizado'
        });
      }
      
    } catch (error) {
      console.error('Error al activar membresía:', error);
      const errorMsg = error.response?.data?.message || 'Error al activar membresía en efectivo';
      showError(errorMsg);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  };

  // FILTRAR Y ORDENAR MEMBRESÍAS
  const getFilteredAndSortedMemberships = () => {
    let filtered = memberships.filter(membership => {
      if (!searchTerm) return true;
      
      const searchText = `${membership.user?.name || ''} ${membership.user?.email || ''} ${membership.plan?.name || ''}`.toLowerCase();
      return searchText.includes(searchTerm.toLowerCase());
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'waiting_time':
          return (b.hoursWaiting || 0) - (a.hoursWaiting || 0);
        case 'amount':
          return (b.price || 0) - (a.price || 0);
        case 'name':
          return (a.user?.name || '').localeCompare(b.user?.name || '');
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // OBTENER ESTADÍSTICAS
  const getStats = () => {
    const total = memberships.length;
    const totalAmount = memberships.reduce((sum, m) => sum + (m.price || 0), 0);
    const urgent = memberships.filter(m => (m.hoursWaiting || 0) > 4).length;
    const avgAmount = total > 0 ? totalAmount / total : 0;
    const avgHours = total > 0 ? memberships.reduce((sum, m) => sum + (m.hoursWaiting || 0), 0) / total : 0;
    
    return { total, totalAmount, urgent, avgAmount, avgHours };
  };

  // CONFIGURAR AUTO-REFRESH
  useEffect(() => {
    loadMemberships();
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(loadMemberships, 45000); // Cada 45 segundos
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Verificar permisos
  const canActivate = hasPermission('activate_cash_memberships') || hasPermission('manage_payments');
  
  if (!canActivate) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Banknote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">
            No tienes permisos para activar membresías en efectivo.
          </p>
        </div>
      </div>
    );
  }

  const filteredMemberships = getFilteredAndSortedMemberships();
  const stats = getStats();

  return (
    <div className={`${showCompactView ? 'space-y-4' : 'space-y-6'}`}>
      
      {/* HEADER */}
      {!showCompactView && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Banknote className="w-8 h-8 mr-3 text-green-600" />
              Membresías en Efectivo
            </h2>
            <p className="text-gray-600 mt-1">
              Activa membresías cuando los clientes lleguen a pagar en efectivo
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={loadMemberships}
              disabled={loading}
              className="btn-secondary btn-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            {stats.urgent > 0 && (
              <div className="flex items-center space-x-1 text-orange-600 text-sm font-medium">
                <Timer className="w-4 h-4" />
                <span>{stats.urgent} urgentes</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESTADÍSTICAS */}
      <div className={`grid grid-cols-2 ${showCompactView ? 'md:grid-cols-5' : 'md:grid-cols-5'} gap-4`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">{stats.total}</div>
            <div className="text-xs text-green-600">Esperando</div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-900">{stats.urgent}</div>
            <div className="text-xs text-orange-600">Urgentes</div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900 flex items-center justify-center">
              <Bird className="w-4 h-4 mr-1" />
              <span className="text-sm">{formatCurrency(stats.totalAmount)}</span>
            </div>
            <div className="text-xs text-blue-600">Total GTQ</div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-900 flex items-center justify-center">
              <Bird className="w-4 h-4 mr-1" />
              <span className="text-sm">{formatCurrency(stats.avgAmount)}</span>
            </div>
            <div className="text-xs text-purple-600">Promedio</div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.avgHours.toFixed(1)}h</div>
            <div className="text-xs text-gray-600">Tiempo Prom.</div>
          </div>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white rounded-lg p-4 border border-gray-200">
        
        {/* Búsqueda */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Ordenar */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="waiting_time">Tiempo de espera</option>
            <option value="amount">Monto</option>
            <option value="name">Nombre</option>
            <option value="created">Fecha de creación</option>
          </select>
          
          {/* Vista */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista en cuadrícula"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista en lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredMemberships.length} membresías
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-3" />
          <span className="text-lg text-gray-600">Cargando membresías...</span>
        </div>
      ) : filteredMemberships.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm 
              ? 'No se encontraron membresías con ese criterio'
              : '¡Excelente! No hay membresías esperando pago en efectivo'
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Intenta con otro término de búsqueda'
              : 'Todas las membresías en efectivo han sido procesadas'
            }
          </p>
        </div>
      ) : (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {filteredMemberships.map((membership) => (
            viewMode === 'grid' ? (
              <MembershipCard
                key={membership.id}
                membership={membership}
                onActivate={handleActivateMembership}
                isProcessing={processingIds.has(membership.id)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ) : (
              <MembershipListItem
                key={membership.id}
                membership={membership}
                onActivate={handleActivateMembership}
                isProcessing={processingIds.has(membership.id)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

// COMPONENTE: Tarjeta de membresía (vista grid)
const MembershipCard = ({ membership, onActivate, isProcessing, formatCurrency, formatDate }) => {
  const isUrgent = (membership.hoursWaiting || 0) > 4;
  
  return (
    <div className={`bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ${
      isUrgent ? 'ring-2 ring-orange-200 border-orange-300' : 'border-gray-200'
    }`}>
      
      {/* Header con urgencia */}
      {isUrgent && (
        <div className="bg-orange-50 px-4 py-2 border-b border-orange-200">
          <div className="flex items-center text-orange-700 text-sm">
            <Timer className="w-4 h-4 mr-1" />
            <span className="font-medium">Esperando {membership.hoursWaiting.toFixed(1)} horas</span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        
        {/* Cliente */}
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-xl font-bold text-green-700">
              {membership.user ? 
                `${membership.user.name[0]}${membership.user.name.split(' ')[1]?.[0] || ''}` :
                'A'
              }
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {membership.user?.name || 'Cliente Anónimo'}
            </h3>
            <div className="text-sm text-gray-500 space-y-1">
              {membership.user?.email && (
                <div className="flex items-center truncate">
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="truncate">{membership.user.email}</span>
                </div>
              )}
              {membership.user?.phone && (
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  <span>{membership.user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Detalles del plan */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Plan</div>
              <div className="font-medium text-gray-900 truncate">
                {membership.plan?.name || 'Plan personalizado'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Precio</div>
              <div className="text-xl font-bold text-green-600 flex items-center">
                <Bird className="w-4 h-4 mr-1" />
                {formatCurrency(membership.price)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Creada</div>
              <div className="text-gray-700">
                {formatDate(membership.createdAt, 'dd/MM')}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Esperando</div>
              <div className={`font-medium ${isUrgent ? 'text-orange-600' : 'text-gray-700'}`}>
                {membership.hoursWaiting?.toFixed(1) || '0.0'}h
              </div>
            </div>
          </div>
        </div>
        
        {/* Horarios reservados */}
        {membership.schedule && Object.keys(membership.schedule).length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Horarios:</div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="space-y-1">
                {Object.entries(membership.schedule).slice(0, 3).map(([day, slots]) => (
                  <div key={day} className="text-xs">
                    <span className="font-medium text-blue-900 capitalize">
                      {day.substring(0, 3)}:
                    </span>{' '}
                    <span className="text-blue-700">
                      {slots.map(slot => slot.timeRange).join(', ')}
                    </span>
                  </div>
                ))}
                {Object.keys(membership.schedule).length > 3 && (
                  <div className="text-xs text-blue-600">
                    +{Object.keys(membership.schedule).length - 3} días más...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Botón de activación */}
        <button
          onClick={() => onActivate(membership.id)}
          disabled={isProcessing || !membership.canActivate}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm ${
            isProcessing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : membership.canActivate
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Activando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Recibir {formatCurrency(membership.price)}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// COMPONENTE: Item de membresía (vista lista)
const MembershipListItem = ({ membership, onActivate, isProcessing, formatCurrency, formatDate }) => {
  const isUrgent = (membership.hoursWaiting || 0) > 4;
  
  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
      isUrgent ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        
        <div className="flex items-center flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-lg font-bold text-green-700">
              {membership.user ? 
                `${membership.user.name[0]}${membership.user.name.split(' ')[1]?.[0] || ''}` :
                'A'
              }
            </span>
          </div>
          
          {/* Información */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {membership.user?.name || 'Cliente Anónimo'}
              </h3>
              
              {isUrgent && (
                <div className="flex items-center text-orange-600 text-sm">
                  <Timer className="w-4 h-4 mr-1" />
                  <span>{membership.hoursWaiting.toFixed(1)}h</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                <span>{membership.plan?.name || 'Plan personalizado'}</span>
              </div>
              
              <div className="flex items-center font-semibold text-green-600">
                <Bird className="w-4 h-4 mr-1" />
                <span>{formatCurrency(membership.price)}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(membership.createdAt, 'dd/MM HH:mm')}</span>
              </div>
              
              {membership.user?.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{membership.user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Botón de acción */}
        <div className="ml-4">
          <button
            onClick={() => onActivate(membership.id)}
            disabled={isProcessing || !membership.canActivate}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : membership.canActivate
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Recibir Efectivo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashMembershipManager;

/*
DOCUMENTACIÓN DEL COMPONENTE CashMembershipManager

PROPÓSITO:
Componente especializado para la gestión de membresías que esperan pago en efectivo.
Diseñado para personal de recepción del gimnasio que debe activar membresías cuando
los clientes llegan a pagar personalmente en quetzales guatemaltecos.

FUNCIONALIDADES PRINCIPALES:

DASHBOARD DE ESTADÍSTICAS:
- Total de membresías esperando pago
- Número de membresías urgentes (+4 horas)
- Monto total pendiente en quetzales
- Monto promedio de membresías
- Tiempo promedio de espera

CONTROLES AVANZADOS:
- Búsqueda por nombre, email o plan
- Ordenamiento por:
  - Tiempo de espera (más urgentes primero)
  - Monto (mayor a menor)
  - Nombre del cliente (alfabético)
  - Fecha de creación (más recientes primero)
- Alternancia entre vista grid y lista
- Auto-refresh cada 45 segundos

VISTA GRID (TARJETAS):
- Tarjetas individuales para cada membresía
- Indicador visual de urgencia (borde naranja +4h)
- Avatar con iniciales del cliente
- Información de contacto visible
- Detalles del plan y precio destacado
- Preview de horarios reservados
- Botón grande de "Recibir [Monto]"

VISTA LISTA:
- Diseño compacto para procesar más rápido
- Toda la información en una línea
- Ideal para dispositivos móviles
- Botón de acción al lado derecho

CARACTERÍSTICAS ESPECIALES:

CONFIRMACIÓN DE PAGO:
- Diálogo de confirmación antes de activar
- Muestra monto exacto a recibir
- Nombre del cliente para verificación
- Previene activaciones accidentales

ESTADOS VISUALES:
- Membresías urgentes con borde y fondo naranja
- Indicadores de tiempo de espera
- Estados de procesamiento con spinners
- Feedback inmediato al activar

INFORMACIÓN COMPLETA:
- Datos del cliente (nombre, email, teléfono)
- Detalles del plan seleccionado
- Precio exacto en quetzales
- Horarios reservados por día
- Tiempo de espera calculado
- Fecha y hora de creación

PROPS DISPONIBLES:
- onMembershipActivated: Callback cuando se activa una membresía
- showCompactView: Versión compacta para integración
- autoRefresh: Auto-actualización automática

CONEXIONES CON OTROS ARCHIVOS:

CONTEXTS REQUERIDOS:
- AuthContext: Verificación de permisos
- AppContext: Notificaciones y formateo

SERVICIOS UTILIZADOS:
- apiService.getPendingCashMemberships(): Lista de membresías
- apiService.activateCashMembership(): Activar membresía

PERMISOS REQUERIDOS:
- activate_cash_memberships: Permiso específico
- manage_payments: Permiso general de pagos

ICONOGRAFÍA CONSISTENTE:
- Banknote: Pagos en efectivo
- Bird: Quetzal para montos en GTQ
- Timer: Indicadores de urgencia
- CheckCircle: Activación exitosa
- Phone/Mail: Información de contacto

CASOS DE USO OPERATIVOS:

FLUJO TÍPICO:
1. Cliente compra membresía online eligiendo "pago en efectivo"
2. Membresía queda en estado "pending" esperando pago
3. Cliente llega al gimnasio a pagar
4. Recepcionista busca al cliente en esta vista
5. Verifica datos y monto
6. Hace clic en "Recibir [Monto]"
7. Confirma que recibió el efectivo
8. Sistema activa membresía automáticamente
9. Cliente puede comenzar a usar el gimnasio

BENEFICIOS OPERATIVOS:
- Procesamiento rápido de pagos en efectivo
- Verificación visual de montos
- Seguimiento de tiempos de espera
- Activación inmediata de membresías
- Registro automático del pago en el sistema
- Eliminación de errores manuales

CARACTERÍSTICAS PARA GUATEMALA:
- Montos siempre en quetzales (GTQ)
- Icono de ave quetzal para identificación
- Interfaz completamente en español
- Adaptado al flujo de pago local
- Compatible con horarios del gimnasio guatemalteco

INTEGRACIÓN CON EL SISTEMA:
- Se conecta automáticamente con el backend
- Actualiza estados en tiempo real
- Registra pagos en la contabilidad
- Activa horarios de acceso
- Notifica al sistema de membresías
- Invalida cache automáticamente

RESPONSIVIDAD:
- Vista optimizada para tablets en recepción
- Funciona perfecto en dispositivos móviles
- Botones grandes para uso táctil
- Información bien organizada
- Búsqueda rápida para clientes impacientes

Este componente es esencial para el flujo operativo del gimnasio,
ya que muchos clientes guatemaltecos prefieren pagar en efectivo
al momento de llegar al gimnasio, y necesita ser muy eficiente
para no crear colas o demoras en recepción.
*/