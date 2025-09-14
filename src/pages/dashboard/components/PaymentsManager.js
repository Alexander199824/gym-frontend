// src/pages/dashboard/components/PaymentsManager.js
// VERSIÓN COMPLETA - Con implementación de efectivo incluida

import React, { useState, useEffect } from 'react';
import {
  Coins, Plus, Search, RefreshCw, Eye, Check, X, 
  CreditCard, Banknote, Building, Calendar,
  CheckCircle, XCircle, Clock, Loader2,
  TrendingUp, Bird, Users, Activity,
  AlertTriangle, Timer, Phone, Mail,
  User, Filter, Grid3X3, List
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const PaymentsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState('payments');
  const [loading, setLoading] = useState(false);
  
  // Estados de datos
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [pendingDashboard, setPendingDashboard] = useState({});
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingCashMemberships, setPendingCashMemberships] = useState([]);
  const [cashMembershipStats, setCashMembershipStats] = useState({});
  const [financialDashboard, setFinancialDashboard] = useState({});
  
  // Estados de procesamiento
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Estados de filtros básicos
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const paymentsPerPage = 20;

  // Estados específicos para efectivo
  const [cashViewMode, setCashViewMode] = useState('grid'); // 'grid' | 'list'
  const [cashSortBy, setCashSortBy] = useState('waiting_time');
  const [cashPriorityFilter, setCashPriorityFilter] = useState('all');

  // ================================
  // FUNCIONES DE CARGA DE DATOS BÁSICAS
  // ================================

  const loadPayments = async () => {
    try {
      console.log('💰 Cargando pagos...');
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: paymentsPerPage,
        search: searchTerm || undefined
      };
      
      const response = await apiService.paymentService.getPayments(params);
      
      if (response?.data) {
        if (response.data.payments && Array.isArray(response.data.payments)) {
          setPayments(response.data.payments);
          setTotalPayments(response.data.pagination?.total || response.data.payments.length);
        } else if (Array.isArray(response.data)) {
          setPayments(response.data);
          setTotalPayments(response.data.length);
        }
        console.log(`✅ ${payments.length} pagos cargados`);
      }
    } catch (error) {
      console.error('❌ Error cargando pagos:', error);
      showError('Error al cargar pagos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      console.log('📊 Cargando estadísticas...');
      const response = await apiService.paymentService.getPaymentStatistics();
      setStatistics(response?.data || {});
      console.log('✅ Estadísticas cargadas');
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      setStatistics({});
    }
  };

  const loadPendingDashboard = async () => {
    try {
      console.log('📋 Cargando dashboard de pendientes...');
      const response = await apiService.paymentService.getPendingPaymentsDashboard();
      setPendingDashboard(response?.data || {});
      console.log('✅ Dashboard de pendientes cargado');
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
      setPendingDashboard({});
    }
  };

  const loadPendingCashMemberships = async () => {
    try {
      console.log('💵 Cargando membresías en efectivo pendientes...');
      const response = await apiService.paymentService.getPendingCashMemberships({
        search: searchTerm,
        sortBy: cashSortBy,
        priority: cashPriorityFilter === 'all' ? undefined : cashPriorityFilter
      });
      
      setPendingCashMemberships(response?.data?.memberships || []);
      
      // Cargar estadísticas específicas
      const statsResponse = await apiService.paymentService.getCashMembershipStats();
      setCashMembershipStats(statsResponse?.data || {});
      
      console.log(`✅ ${response?.data?.memberships?.length || 0} membresías en efectivo cargadas`);
    } catch (error) {
      console.error('❌ Error cargando membresías en efectivo:', error);
      setPendingCashMemberships([]);
      setCashMembershipStats({});
    }
  };

  const loadPendingTransfers = async () => {
    try {
      console.log('🏦 Cargando transferencias pendientes...');
      const response = await apiService.paymentService.getPendingTransfers();
      setPendingTransfers(response?.data?.transfers || []);
      console.log(`✅ ${response?.data?.transfers?.length || 0} transferencias cargadas`);
    } catch (error) {
      console.error('❌ Error cargando transferencias:', error);
      setPendingTransfers([]);
    }
  };

  const loadFinancialDashboard = async () => {
    try {
      console.log('💼 Cargando dashboard financiero...');
      const response = await apiService.paymentService.getFinancialDashboard();
      setFinancialDashboard(response?.data || {});
      console.log('✅ Dashboard financiero cargado');
    } catch (error) {
      console.error('❌ Error cargando dashboard financiero:', error);
      setFinancialDashboard({});
    }
  };

  // ================================
  // FUNCIONES DE ACCIÓN BÁSICAS
  // ================================

  const handleValidateTransfer = async (paymentId, approved) => {
    if (processingIds.has(paymentId)) return;

    const confirmed = window.confirm(
      approved 
        ? '¿Confirmar que quieres aprobar esta transferencia?' 
        : '¿Confirmar que quieres rechazar esta transferencia?'
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      console.log(`${approved ? '✅' : '❌'} Validando transferencia:`, paymentId);
      
      await apiService.paymentService.validateTransfer(paymentId, approved, 
        approved ? 'Transferencia aprobada' : 'Transferencia rechazada');
      
      showSuccess(approved ? 'Transferencia aprobada' : 'Transferencia rechazada');
      
      // Recargar datos
      await loadPendingTransfers();
      await loadPayments();
      
      if (onSave) {
        onSave({ type: 'transfer_validation', approved });
      }
      
    } catch (error) {
      console.error('❌ Error validando transferencia:', error);
      showError('Error al procesar transferencia');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // ================================
  // FUNCIONES ESPECÍFICAS PARA EFECTIVO
  // ================================

  const handleActivateCashMembership = async (membershipId) => {
    if (processingIds.has(membershipId)) return;

    const membershipData = pendingCashMemberships.find(m => m.id === membershipId);
    
    const confirmed = window.confirm(
      `¿Confirmar que recibiste ${formatCurrency(membershipData?.price || 0)} en efectivo de ${membershipData?.user?.name || 'cliente'}?`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, membershipId]));
      
      console.log('💵 Activando membresía:', membershipId);
      
      await apiService.paymentService.activateCashMembership(membershipId, {
        notes: `Pago en efectivo recibido de ${membershipData?.user?.name || 'cliente'}`
      });
      
      showSuccess(
        `¡Membresía activada! Pago de ${formatCurrency(membershipData?.price || 0)} registrado correctamente.`
      );
      
      // Remover de la lista local inmediatamente
      setPendingCashMemberships(prev => prev.filter(m => m.id !== membershipId));
      
      // Recargar datos completos
      await loadPendingCashMemberships();
      await loadPayments();
      
      if (onSave) {
        onSave({ 
          type: 'cash_membership_activation',
          membershipId,
          clientName: membershipData?.user?.name || 'Cliente',
          amount: membershipData?.price || 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error activando membresía:', error);
      showError('Error al activar membresía en efectivo');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  };

  // Filtrar membresías en efectivo
  const getFilteredCashMemberships = () => {
    let filtered = pendingCashMemberships;

    // Filtrar por prioridad
    if (cashPriorityFilter !== 'all') {
      filtered = filtered.filter(membership => {
        const priority = apiService.paymentService.getCashMembershipPriorityConfig(
          membership.hoursWaiting || 0
        ).priority;
        return priority === cashPriorityFilter;
      });
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const searchText = searchTerm.toLowerCase();
      filtered = filtered.filter(membership => {
        const clientInfo = `${membership.user?.name || ''} ${membership.user?.email || ''} ${membership.plan?.name || ''}`.toLowerCase();
        return clientInfo.includes(searchText);
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (cashSortBy) {
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

  // ================================
  // EFECTOS Y CICLO DE VIDA
  // ================================

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadPayments(),
        loadStatistics(),
        loadPendingDashboard(),
        loadPendingTransfers(),
        loadPendingCashMemberships(),
        loadFinancialDashboard()
      ]);
    };
    
    loadData();
  }, [currentPage, searchTerm]);

  // Recargar membresías en efectivo cuando cambien los filtros
  useEffect(() => {
    if (activeTab === 'cash') {
      loadPendingCashMemberships();
    }
  }, [cashSortBy, cashPriorityFilter]);

  // ================================
  // UTILIDADES PARA RENDERIZADO
  // ================================

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: Banknote,
      card: CreditCard,
      transfer: Building,
      mobile: Building
    };
    return icons[method] || CreditCard;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-100',
      pending: 'text-yellow-600 bg-yellow-100',
      failed: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.completed;
  };

  const filteredCashMemberships = getFilteredCashMemberships();

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Coins className="w-6 h-6 mr-2 text-green-600" />
            Gestión de Pagos
          </h3>
          <p className="text-gray-600 mt-1">
            Sistema completo de gestión financiera en quetzales guatemaltecos
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={() => {
              loadPayments();
              loadStatistics();
              loadPendingDashboard();
              loadPendingTransfers();
              loadPendingCashMemberships();
              loadFinancialDashboard();
            }}
            disabled={loading}
            className="btn-secondary btn-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* NAVEGACIÓN POR TABS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Coins className="w-4 h-4 mr-2" />
            Historial de Pagos
            {totalPayments > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                {totalPayments}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('transfers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
              activeTab === 'transfers'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="w-4 h-4 mr-2" />
            Transferencias
            {pendingTransfers.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                {pendingTransfers.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('cash')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
              activeTab === 'cash'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Banknote className="w-4 h-4 mr-2" />
            Efectivo
            {cashMembershipStats.total > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                {cashMembershipStats.total}
              </span>
            )}
            {cashMembershipStats.urgent > 0 && (
              <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                <AlertTriangle className="w-3 h-3" />
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
              activeTab === 'summary'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Resumen
          </button>
        </nav>
      </div>

      {/* CONTENIDO DEL TAB HISTORIAL */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          
          {/* Barra de búsqueda simple */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pagos por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="text-sm text-gray-500">
                {totalPayments} pagos total
              </div>
            </div>
          </div>
          
          {/* Lista de pagos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
                <span className="text-gray-600">Cargando pagos...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No se encontraron pagos con ese criterio' : 'No hay pagos registrados'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {payments.map((payment) => {
                  const MethodIcon = getPaymentMethodIcon(payment.paymentMethod);
                  
                  return (
                    <div key={payment.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <MethodIcon className="w-5 h-5 text-green-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">
                                {payment.user ? 
                                  `${payment.user.firstName} ${payment.user.lastName}` : 
                                  'Cliente Anónimo'
                                }
                              </h4>
                              <div className="text-lg font-bold text-gray-900 flex items-center">
                                <Bird className="w-4 h-4 mr-1 text-green-600" />
                                {formatCurrency(payment.amount)}
                              </div>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(payment.paymentDate || payment.createdAt, 'dd/MM/yyyy')}
                              <span className="mx-2">•</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(payment.status || 'completed')}`}>
                                {payment.status || 'completed'}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => console.log('Ver pago:', payment)}
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL TAB TRANSFERENCIAS */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {pendingTransfers.length === 0 ? (
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
              <div className="divide-y divide-gray-200">
                {pendingTransfers.map((transfer) => {
                  const isProcessing = processingIds.has(transfer.id);
                  
                  return (
                    <div key={transfer.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {transfer.user?.name || 'Cliente Anónimo'}
                          </h4>
                          <div className="text-2xl font-bold text-green-600 flex items-center mt-2">
                            <Bird className="w-6 h-6 mr-2" />
                            {formatCurrency(transfer.amount)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(transfer.paymentDate || transfer.createdAt, 'dd/MM/yyyy HH:mm')}
                            {transfer.hoursWaiting && (
                              <span className="ml-2">• Esperando {transfer.hoursWaiting.toFixed(1)}h</span>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleValidateTransfer(transfer.id, true)}
                            disabled={isProcessing}
                            className="btn-success"
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
                          
                          <button
                            onClick={() => handleValidateTransfer(transfer.id, false)}
                            disabled={isProcessing}
                            className="btn-danger"
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
        </div>
      )}

      {/* CONTENIDO DEL TAB EFECTIVO */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          
          {/* ESTADÍSTICAS DE EFECTIVO */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{cashMembershipStats.total || 0}</div>
                <div className="text-xs text-green-600">Esperando</div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-900">{cashMembershipStats.urgent || 0}</div>
                <div className="text-xs text-orange-600">Urgentes</div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-900 flex items-center justify-center">
                  <Bird className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formatCurrency(cashMembershipStats.totalAmount || 0)}</span>
                </div>
                <div className="text-xs text-blue-600">Total GTQ</div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-900 flex items-center justify-center">
                  <Bird className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formatCurrency(cashMembershipStats.avgAmount || 0)}</span>
                </div>
                <div className="text-xs text-purple-600">Promedio</div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{(cashMembershipStats.avgHours || 0).toFixed(1)}h</div>
                <div className="text-xs text-gray-600">Tiempo Prom.</div>
              </div>
            </div>
          </div>

          {/* CONTROLES DE EFECTIVO */}
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
              {/* Filtro de prioridad */}
              <select
                value={cashPriorityFilter}
                onChange={(e) => setCashPriorityFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">🟠 Urgentes (+4h)</option>
                <option value="normal">🟢 Normales (&lt;4h)</option>
              </select>
              
              {/* Ordenar */}
              <select
                value={cashSortBy}
                onChange={(e) => setCashSortBy(e.target.value)}
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
                  onClick={() => setCashViewMode('grid')}
                  className={`p-2 ${cashViewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Vista en cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCashViewMode('list')}
                  className={`p-2 ${cashViewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Vista en lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                {filteredCashMemberships.length} membresías
              </div>
            </div>
          </div>

          {/* CONTENIDO DE MEMBRESÍAS EN EFECTIVO */}
          {filteredCashMemberships.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm || cashPriorityFilter !== 'all'
                  ? 'No se encontraron membresías con ese criterio'
                  : '¡Excelente! No hay membresías esperando pago en efectivo'
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
            <div className={`${cashViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {filteredCashMemberships.map((membership) => (
                cashViewMode === 'grid' ? (
                  <CashMembershipCard
                    key={membership.id}
                    membership={membership}
                    onActivate={handleActivateCashMembership}
                    isProcessing={processingIds.has(membership.id)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ) : (
                  <CashMembershipListItem
                    key={membership.id}
                    membership={membership}
                    onActivate={handleActivateCashMembership}
                    isProcessing={processingIds.has(membership.id)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DEL TAB RESUMEN */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Bird className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(statistics.totalIncome || 0)}
                  </div>
                  <div className="text-sm text-green-600">Ingresos Totales</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-blue-900">
                    {statistics.totalPayments || 0}
                  </div>
                  <div className="text-sm text-blue-600">Transacciones</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-purple-900">
                    {pendingTransfers.length}
                  </div>
                  <div className="text-sm text-purple-600">Transferencias</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-orange-900">
                    {formatCurrency(statistics.averagePayment || 0)}
                  </div>
                  <div className="text-sm text-orange-600">Promedio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard financiero básico */}
          {financialDashboard.today && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Hoy</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ingresos:</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(financialDashboard.today.income || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gastos:</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(financialDashboard.today.expenses || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Esta Semana</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ingresos:</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(financialDashboard.thisWeek?.income || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gastos:</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(financialDashboard.thisWeek?.expenses || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Este Mes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ingresos:</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(financialDashboard.thisMonth?.income || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gastos:</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(financialDashboard.thisMonth?.expenses || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ================================
// COMPONENTES PARA MEMBRESÍAS EN EFECTIVO
// ================================

// COMPONENTE: Tarjeta de membresía (vista grid)
const CashMembershipCard = ({ membership, onActivate, isProcessing, formatCurrency, formatDate }) => {
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
const CashMembershipListItem = ({ membership, onActivate, isProcessing, formatCurrency, formatDate }) => {
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

export default PaymentsManager;