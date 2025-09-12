// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/PaymentsManager.js
// VERSIÓN SIMPLIFICADA Y CORREGIDA - Sistema de Pagos

import React, { useState, useEffect } from 'react';
import {
  Coins, Plus, Search, Filter, Eye, Check, X, Clock, 
  CreditCard, Banknote, Building, Smartphone, RefreshCw, 
  Calendar, User, FileText, CheckCircle, XCircle,
  TrendingUp, PieChart, Calculator, Settings,
  Loader, MoreHorizontal, Bird, ExternalLink,
  Users, Activity
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const PaymentsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalIncome: 0,
    totalPayments: 0,
    averagePayment: 0,
    incomeByMethod: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para funcionalidades de autorización
  const [dashboardData, setDashboardData] = useState({});
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingCashMemberships, setPendingCashMemberships] = useState([]);
  const [processingPayments, setProcessingPayments] = useState(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [sortBy, setSortBy] = useState('paymentDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentsPerPage] = useState(isMobile ? 10 : 20);
  const [totalPayments, setTotalPayments] = useState(0);
  
  // Estados para crear/editar pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    userId: '',
    membershipId: '',
    amount: 0,
    paymentMethod: 'cash',
    paymentType: 'membership',
    description: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
    dailyPaymentCount: 1,
    anonymousClientInfo: {
      name: '',
      phone: ''
    }
  });
  
  // Configuraciones
  const paymentTypes = [
    { value: 'membership', label: 'Membresía', color: 'bg-purple-100 text-purple-800', icon: CreditCard },
    { value: 'daily', label: 'Pago Diario', color: 'bg-blue-100 text-blue-800', icon: Calendar },
    { value: 'bulk_daily', label: 'Pago Múltiple', color: 'bg-green-100 text-green-800', icon: Calculator },
    { value: 'product', label: 'Producto', color: 'bg-orange-100 text-orange-800', icon: FileText },
    { value: 'service', label: 'Servicio', color: 'bg-pink-100 text-pink-800', icon: Settings },
    { value: 'other', label: 'Otro', color: 'bg-gray-100 text-gray-800', icon: MoreHorizontal }
  ];
  
  const paymentMethods = [
    { value: 'cash', label: 'Efectivo', color: 'bg-green-100 text-green-800', icon: Banknote },
    { value: 'card', label: 'Tarjeta', color: 'bg-blue-100 text-blue-800', icon: CreditCard },
    { value: 'transfer', label: 'Transferencia', color: 'bg-purple-100 text-purple-800', icon: Building },
    { value: 'mobile', label: 'Pago Móvil', color: 'bg-orange-100 text-orange-800', icon: Smartphone }
  ];
  
  const paymentStatuses = [
    { value: 'completed', label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'failed', label: 'Fallido', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: X }
  ];

  // Referencias para auto-refresh
  const refreshIntervalRef = React.useRef(null);
  
  // CARGAR DASHBOARD DE PAGOS PENDIENTES
  const loadDashboard = async () => {
    try {
      console.log('📊 Cargando dashboard de pagos pendientes...');
      
      const dashboardResponse = await apiService.getPendingPaymentsDashboardWithCache();
      setDashboardData(dashboardResponse.data || {});
      
      const transfersResponse = await apiService.getPendingTransfersDetailed();
      setPendingTransfers(transfersResponse.data?.transfers || []);
      
      const cashResponse = await apiService.getPendingCashMemberships();
      setPendingCashMemberships(cashResponse.data?.memberships || []);
      
      console.log('✅ Dashboard cargado exitosamente');
    } catch (error) {
      console.error('❌ Error al cargar dashboard:', error);
      showError('Error al cargar dashboard de pagos');
      // Valores por defecto para evitar errores
      setDashboardData({});
      setPendingTransfers([]);
      setPendingCashMemberships([]);
    }
  };
  
  // CARGAR DATOS DE PAGOS
  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: paymentsPerPage,
        search: searchTerm || undefined,
        paymentType: selectedPaymentType !== 'all' ? selectedPaymentType : undefined,
        paymentMethod: selectedMethod !== 'all' ? selectedMethod : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        sortBy,
        sortOrder
      };
      
      console.log('💰 Cargando pagos con parámetros:', params);
      
      const response = await apiService.get('/payments', { params });
      const paymentData = response.data || response;
      
      if (paymentData.payments && Array.isArray(paymentData.payments)) {
        setPayments(paymentData.payments);
        setTotalPayments(paymentData.pagination?.total || paymentData.payments.length);
      } else if (Array.isArray(paymentData)) {
        setPayments(paymentData);
        setTotalPayments(paymentData.length);
      } else {
        console.warn('Formato de datos de pagos inesperado:', paymentData);
        setPayments([]);
        setTotalPayments(0);
      }
      
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      showError('Error al cargar pagos');
      setPayments([]);
      setTotalPayments(0);
    } finally {
      setLoading(false);
    }
  };
  
  // CARGAR ESTADÍSTICAS CORREGIDO
  const loadPaymentStats = async () => {
    try {
      console.log('📊 Cargando estadísticas de pagos...');
      
      // CORREGIDO: Usar el endpoint statistics correcto
      const response = await apiService.getPaymentStatistics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      console.log('✅ Estadísticas cargadas:', response);
      
      // Asegurar que los datos tengan estructura correcta
      const stats = response.data || response || {};
      setPaymentStats({
        totalIncome: parseFloat(stats.totalIncome) || 0,
        totalPayments: parseInt(stats.totalPayments) || 0,
        averagePayment: parseFloat(stats.averagePayment) || 0,
        incomeByMethod: stats.incomeByMethod || []
      });
      
    } catch (error) {
      console.error('Error al cargar estadísticas de pagos:', error);
      // Estadísticas por defecto para evitar errores
      setPaymentStats({
        totalIncome: 0,
        totalPayments: 0,
        averagePayment: 0,
        incomeByMethod: []
      });
    }
  };
  
  // VALIDAR TRANSFERENCIA
  const handleValidateTransfer = async (paymentId, approved, notes = '') => {
    if (processingPayments.has(paymentId)) return;

    try {
      setProcessingPayments(prev => new Set([...prev, paymentId]));
      
      console.log(`${approved ? '✅ Aprobando' : '❌ Rechazando'} transferencia:`, paymentId);
      
      await apiService.validateTransfer(paymentId, approved, notes);
      
      showSuccess(
        approved 
          ? 'Transferencia aprobada exitosamente' 
          : 'Transferencia rechazada'
      );
      
      // Recargar datos
      await loadDashboard();
      await loadPayments();
      await loadPaymentStats();
      
      if (onSave) {
        onSave({ type: 'transfer_validation', action: approved ? 'approved' : 'rejected' });
      }
      
    } catch (error) {
      console.error('Error al validar transferencia:', error);
      const errorMsg = error.response?.data?.message || 
        (approved ? 'Error al aprobar transferencia' : 'Error al rechazar transferencia');
      showError(errorMsg);
    } finally {
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // ACTIVAR MEMBRESÍA EN EFECTIVO
  const handleActivateCashMembership = async (membershipId) => {
    if (processingPayments.has(membershipId)) return;

    try {
      setProcessingPayments(prev => new Set([...prev, membershipId]));
      
      console.log('💵 Activando membresía en efectivo:', membershipId);
      
      const result = await apiService.activateCashMembership(membershipId);
      
      showSuccess(`Membresía activada exitosamente`);
      
      // Recargar datos
      await loadDashboard();
      await loadPayments();
      await loadPaymentStats();
      
      if (onSave) {
        onSave({ type: 'cash_membership_activation', action: 'activated' });
      }
      
    } catch (error) {
      console.error('Error al activar membresía:', error);
      const errorMsg = error.response?.data?.message || 'Error al activar membresía en efectivo';
      showError(errorMsg);
    } finally {
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(membershipId);
        return newSet;
      });
    }
  };
  
  // Función para crear pago
  const handleCreatePayment = async () => {
    try {
      setSaving(true);
      
      // Validaciones básicas
      if (!paymentFormData.amount || paymentFormData.amount <= 0) {
        showError('El monto debe ser mayor a 0');
        return;
      }
      
      // Formatear datos
      const formattedData = {
        userId: paymentFormData.userId || null,
        membershipId: paymentFormData.paymentType === 'membership' ? paymentFormData.membershipId || null : null,
        amount: parseFloat(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod,
        paymentType: paymentFormData.paymentType,
        description: paymentFormData.description || `Pago ${paymentFormData.paymentType}`,
        notes: paymentFormData.notes,
        paymentDate: paymentFormData.paymentDate || new Date().toISOString().split('T')[0],
        dailyPaymentCount: paymentFormData.paymentType === 'bulk_daily' ? 
          parseInt(paymentFormData.dailyPaymentCount) || 1 : 1,
        anonymousClientInfo: !paymentFormData.userId ? paymentFormData.anonymousClientInfo : null
      };
      
      let response;
      if (editingPayment) {
        response = await apiService.put(`/payments/${editingPayment.id}`, formattedData);
        showSuccess('Pago actualizado exitosamente');
      } else {
        response = await apiService.post('/payments', formattedData);
        showSuccess('Pago registrado exitosamente');
      }
      
      // Recargar datos
      await loadPayments();
      await loadPaymentStats();
      await loadDashboard();
      
      // Cerrar modal
      setShowPaymentModal(false);
      setEditingPayment(null);
      resetPaymentForm();
      
      if (onSave) {
        onSave({ type: 'payment', action: editingPayment ? 'updated' : 'created' });
      }
      
    } catch (error) {
      console.error('Error al guardar pago:', error);
      const errorMsg = error.response?.data?.message || 'Error al guardar pago';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // Funciones auxiliares
  const resetPaymentForm = () => {
    setPaymentFormData({
      userId: '',
      membershipId: '',
      amount: 0,
      paymentMethod: 'cash',
      paymentType: 'membership',
      description: '',
      notes: '',
      paymentDate: new Date().toISOString().split('T')[0],
      dailyPaymentCount: 1,
      anonymousClientInfo: {
        name: '',
        phone: ''
      }
    });
  };
  
  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setPaymentFormData({
      userId: payment.userId || '',
      membershipId: payment.membershipId || '',
      amount: payment.amount || 0,
      paymentMethod: payment.paymentMethod || 'cash',
      paymentType: payment.paymentType || 'membership',
      description: payment.description || '',
      notes: payment.notes || '',
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
      dailyPaymentCount: payment.dailyPaymentCount || 1,
      anonymousClientInfo: payment.anonymousClientInfo || {
        name: '',
        phone: ''
      }
    });
    setShowPaymentModal(true);
  };
  
  const handleNewPayment = () => {
    setEditingPayment(null);
    resetPaymentForm();
    setShowPaymentModal(true);
  };
  
  const getTypeInfo = (type) => {
    return paymentTypes.find(t => t.value === type) || paymentTypes[0];
  };
  
  const getMethodInfo = (method) => {
    return paymentMethods.find(m => m.value === method) || paymentMethods[0];
  };
  
  const getStatusInfo = (status) => {
    return paymentStatuses.find(s => s.value === status) || paymentStatuses[0];
  };
  
  // Cargar datos al montar y configurar auto-refresh
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadPayments(),
        loadPaymentStats(),
        loadDashboard()
      ]);
    };
    
    loadAllData();
    
    // Configurar auto-refresh
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadDashboard();
      }, 30000); // Cada 30 segundos
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Efectos para recargar cuando cambien filtros
  useEffect(() => {
    loadPayments();
  }, [currentPage, searchTerm, selectedPaymentType, selectedMethod, selectedStatus, dateRange, sortBy, sortOrder]);
  
  useEffect(() => {
    loadPaymentStats();
  }, [dateRange]);
  
  // Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalPayments / paymentsPerPage));
  const filteredPayments = payments.filter(payment => {
    const searchText = `${payment.user?.firstName || ''} ${payment.user?.lastName || ''} ${payment.user?.email || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || 
      searchText.includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedPaymentType === 'all' || payment.paymentType === selectedPaymentType;
    const matchesMethod = selectedMethod === 'all' || payment.paymentMethod === selectedMethod;
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesMethod && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SIMPLIFICADO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Coins className="w-6 h-6 mr-2 text-green-600" />
            Pagos
          </h3>
          <p className="text-gray-600 mt-1">
            Gestión de pagos, transferencias y membresías
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {/* Auto-refresh toggle */}
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            Auto-refresh
          </label>
          
          <button
            onClick={() => {
              loadDashboard();
              loadPayments();
              loadPaymentStats();
            }}
            disabled={loading}
            className="btn-secondary btn-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          {hasPermission('create_payments') && (
            <button
              onClick={handleNewPayment}
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pago
            </button>
          )}
        </div>
      </div>

      {/* NAVEGACIÓN POR TABS SIMPLIFICADA */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
              activeTab === 'dashboard'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Resumen
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
            {pendingCashMemberships.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                {pendingCashMemberships.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Coins className="w-4 h-4 mr-2" />
            Historial
          </button>
        </nav>
      </div>

      {/* CONTENIDO DEL TAB RESUMEN - SIMPLIFICADO */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Tarjetas de resumen CORREGIDAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Bird className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(paymentStats.totalIncome || 0)}
                  </div>
                  <div className="text-sm text-green-600">Ingresos Totales</div>
                  <div className="text-xs text-green-500">
                    {paymentStats.totalPayments || 0} transacciones
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-purple-600" />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-purple-900">
                    {pendingTransfers.length || 0}
                  </div>
                  <div className="text-sm text-purple-600">Transferencias</div>
                  <div className="text-xs text-purple-500">
                    Pendientes de validación
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Banknote className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-blue-900">
                    {pendingCashMemberships.length || 0}
                  </div>
                  <div className="text-sm text-blue-600">Efectivo Pendiente</div>
                  <div className="text-xs text-blue-500">
                    Membresías por activar
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <Calculator className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-orange-900">
                    {formatCurrency(paymentStats.averagePayment || 0)}
                  </div>
                  <div className="text-sm text-orange-600">Promedio</div>
                  <div className="text-xs text-orange-500">
                    Por transacción
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Métodos de pago más usados */}
          {paymentStats.incomeByMethod && paymentStats.incomeByMethod.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-gray-600" />
                Métodos de Pago Más Utilizados
              </h4>
              <div className="space-y-3">
                {paymentStats.incomeByMethod.map((method, index) => {
                  const methodInfo = getMethodInfo(method.method);
                  const MethodIcon = methodInfo.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MethodIcon className="w-5 h-5 mr-3 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {methodInfo.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {method.count} transacciones
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(method.total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {method.percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DEL TAB TRANSFERENCIAS */}
      {activeTab === 'transfers' && hasPermission('validate_transfers') && (
        <div className="space-y-6">
          
          {/* Lista de transferencias */}
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
                  const isProcessing = processingPayments.has(transfer.id);
                  
                  return (
                    <div key={transfer.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          
                          {/* Información del cliente */}
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                              <span className="text-lg font-medium text-gray-700">
                                {transfer.user ? 
                                  `${transfer.user.name[0]}${transfer.user.name.split(' ')[1]?.[0] || ''}` :
                                  'A'
                                }
                              </span>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-gray-900">
                                {transfer.user?.name || 'Cliente Anónimo'}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {transfer.user?.email || transfer.user?.phone || 'Sin datos de contacto'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Detalles del pago */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">Monto</div>
                              <div className="text-lg font-bold text-gray-900 flex items-center">
                                <Bird className="w-4 h-4 mr-1 text-green-600" />
                                {formatCurrency(transfer.amount)}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">Fecha</div>
                              <div className="text-sm text-gray-700">
                                {formatDate(transfer.paymentDate || transfer.createdAt, 'dd/MM/yyyy')}
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">Tiempo esperando</div>
                              <div className="text-sm text-gray-700">
                                {transfer.hoursWaiting?.toFixed(1) || '0.0'}h
                              </div>
                            </div>
                          </div>
                          
                          {/* Comprobante */}
                          {transfer.transferProof && (
                            <div className="mb-4">
                              <div className="text-sm text-gray-500 mb-2">Comprobante de transferencia:</div>
                              <div className="flex items-center space-x-3">
                                <img
                                  src={transfer.transferProof}
                                  alt="Comprobante"
                                  className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(transfer.transferProof, '_blank')}
                                />
                                <button
                                  onClick={() => window.open(transfer.transferProof, '_blank')}
                                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Ver comprobante completo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex flex-col space-y-2 ml-6">
                          <button
                            onClick={() => handleValidateTransfer(transfer.id, true)}
                            disabled={isProcessing}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                              isProcessing 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {isProcessing ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-5 h-5 mr-2" />
                                Aprobar
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleValidateTransfer(transfer.id, false)}
                            disabled={isProcessing}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                              isProcessing 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
                            }`}
                          >
                            {isProcessing ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <X className="w-5 h-5 mr-2" />
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
      {activeTab === 'cash' && hasPermission('activate_cash_memberships') && (
        <div className="space-y-6">
          
          {/* Lista de membresías en efectivo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {pendingCashMemberships.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay membresías esperando pago en efectivo
                </h3>
                <p className="text-gray-600">
                  Todas las membresías en efectivo han sido activadas
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingCashMemberships.map((membership) => {
                    const isProcessing = processingPayments.has(membership.id);
                    
                    return (
                      <div key={membership.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                        
                        {/* Información del cliente */}
                        <div className="flex items-center mb-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4">
                            <span className="text-xl font-bold text-green-700">
                              {membership.user ? 
                                `${membership.user.name[0]}${membership.user.name.split(' ')[1]?.[0] || ''}` :
                                'A'
                              }
                            </span>
                          </div>
                          
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {membership.user?.name || 'Cliente Anónimo'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {membership.user?.email || membership.user?.phone || 'Sin datos de contacto'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Detalles de la membresía */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Plan</div>
                              <div className="text-sm font-medium text-gray-900">
                                {membership.plan?.name || 'Plan personalizado'}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Precio</div>
                              <div className="text-lg font-bold text-green-600 flex items-center">
                                <Bird className="w-4 h-4 mr-1" />
                                {formatCurrency(membership.price)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botón de activación */}
                        <button
                          onClick={() => handleActivateCashMembership(membership.id)}
                          disabled={isProcessing}
                          className={`w-full px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center ${
                            isProcessing 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                          }`}
                        >
                          {isProcessing ? (
                            <>
                              <Loader className="w-5 h-5 mr-3 animate-spin" />
                              Activando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-3" />
                              Recibir {formatCurrency(membership.price)} en Efectivo
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO DEL TAB HISTORIAL */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          
          {/* FILTROS Y BÚSQUEDA */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pagos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              {/* Filtro por tipo */}
              <select
                value={selectedPaymentType}
                onChange={(e) => setSelectedPaymentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Todos los tipos</option>
                {paymentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              
              {/* Filtro por método */}
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Todos los métodos</option>
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              
              {/* Filtro por estado */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Todos los estados</option>
                {paymentStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              
              {/* Fecha inicio */}
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              
              {/* Fecha fin */}
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          {/* TABLA DE PAGOS */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-green-600 mr-2" />
                <span className="text-gray-600">Cargando historial de pagos...</span>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedPaymentType !== 'all' || selectedMethod !== 'all' || selectedStatus !== 'all'
                    ? 'No se encontraron pagos con los filtros aplicados'
                    : 'Comienza registrando tu primer pago'
                  }
                </p>
                {hasPermission('create_payments') && (
                  <button onClick={handleNewPayment} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo / Método
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto (GTQ)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((payment) => {
                        const typeInfo = getTypeInfo(payment.paymentType);
                        const methodInfo = getMethodInfo(payment.paymentMethod);
                        const statusInfo = getStatusInfo(payment.status || 'completed');
                        const TypeIcon = typeInfo.icon;
                        const MethodIcon = methodInfo.icon;
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {payment.user?.profileImage ? (
                                    <img
                                      className="h-10 w-10 rounded-full object-cover"
                                      src={payment.user.profileImage}
                                      alt={`${payment.user.firstName} ${payment.user.lastName}`}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-green-800">
                                        {payment.user ? `${payment.user.firstName[0]}${payment.user.lastName[0]}` : 
                                         payment.anonymousClientInfo?.name ? payment.anonymousClientInfo.name[0] : 'A'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {payment.user ? 
                                      `${payment.user.firstName} ${payment.user.lastName}` :
                                      payment.anonymousClientInfo?.name || 'Cliente Anónimo'
                                    }
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {payment.user?.email || payment.anonymousClientInfo?.phone || 'Sin datos de contacto'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {typeInfo.label}
                                </span>
                                <div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${methodInfo.color}`}>
                                    <MethodIcon className="w-3 h-3 mr-1" />
                                    {methodInfo.label}
                                  </span>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                <Bird className="w-4 h-4 mr-1 text-green-600" />
                                {formatCurrency(payment.amount)}
                              </div>
                              {payment.dailyPaymentCount > 1 && (
                                <div className="text-xs text-gray-500">
                                  {payment.dailyPaymentCount} días
                                </div>
                              )}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(payment.paymentDate || payment.createdAt, 'dd/MM/yyyy')}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </span>
                              {payment.paymentMethod === 'transfer' && payment.status === 'pending' && (
                                <div className="text-xs text-yellow-600 mt-1">
                                  Esperando validación
                                </div>
                              )}
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    console.log('Ver detalles del pago:', payment);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Ver detalles"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                {payment.paymentMethod === 'transfer' && 
                                 payment.status === 'pending' && 
                                 hasPermission('validate_transfers') && (
                                  <>
                                    <button
                                      onClick={() => handleValidateTransfer(payment.id, true)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Aprobar transferencia"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleValidateTransfer(payment.id, false)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Rechazar transferencia"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredPayments.map((payment) => {
                    const typeInfo = getTypeInfo(payment.paymentType);
                    const methodInfo = getMethodInfo(payment.paymentMethod);
                    const statusInfo = getStatusInfo(payment.status || 'completed');
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={payment.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {payment.user?.profileImage ? (
                                <img
                                  className="h-12 w-12 rounded-full object-cover"
                                  src={payment.user.profileImage}
                                  alt={`${payment.user.firstName} ${payment.user.lastName}`}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                  <span className="text-lg font-medium text-green-800">
                                    {payment.user ? `${payment.user.firstName[0]}${payment.user.lastName[0]}` : 
                                     payment.anonymousClientInfo?.name ? payment.anonymousClientInfo.name[0] : 'A'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {payment.user ? 
                                  `${payment.user.firstName} ${payment.user.lastName}` :
                                  payment.anonymousClientInfo?.name || 'Cliente Anónimo'
                                }
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Bird className="w-3 h-3 mr-1 text-green-600" />
                                {formatCurrency(payment.amount)} • {formatDate(payment.paymentDate || payment.createdAt, 'dd/MM')}
                              </div>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${methodInfo.color}`}>
                                  {methodInfo.label}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                console.log('Ver detalles del pago:', payment);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {payment.paymentMethod === 'transfer' && 
                             payment.status === 'pending' && 
                             hasPermission('validate_transfers') && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleValidateTransfer(payment.id, true)}
                                  className="text-green-600 hover:text-green-800 p-1"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleValidateTransfer(payment.id, false)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* PAGINACIÓN */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm text-gray-700">
                          Mostrando {((currentPage - 1) * paymentsPerPage) + 1} a {Math.min(currentPage * paymentsPerPage, totalPayments)} de {totalPayments} pagos
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Anterior
                        </button>
                        
                        <span className="text-sm text-gray-700">
                          {currentPage} de {totalPages}
                        </span>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* MODAL PARA CREAR/EDITAR PAGO (SIMPLIFICADO) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Coins className="w-5 h-5 mr-2 text-green-600" />
                  {editingPayment ? 'Editar Pago' : 'Nuevo Pago'}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setEditingPayment(null);
                    resetPaymentForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Tipo de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pago *
                  </label>
                  <select
                    value={paymentFormData.paymentType}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {paymentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto en Quetzales (GTQ) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Bird className="h-4 w-4 text-green-500" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentFormData.amount}
                      onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                {/* Fecha de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Pago *
                  </label>
                  <input
                    type="date"
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                {/* ID de usuario (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de Usuario
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.userId}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Dejar vacío para pago anónimo"
                  />
                </div>
                
                {/* ID de membresía (solo para membresías) */}
                {paymentFormData.paymentType === 'membership' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID de Membresía
                    </label>
                    <input
                      type="text"
                      value={paymentFormData.membershipId}
                      onChange={(e) => setPaymentFormData(prev => ({ ...prev, membershipId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="ID de la membresía"
                    />
                  </div>
                )}
                
                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Pago
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.description}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descripción del pago"
                  />
                </div>
                
                {/* Para pagos múltiples diarios */}
                {['daily', 'bulk_daily'].includes(paymentFormData.paymentType) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Días
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={paymentFormData.dailyPaymentCount}
                      onChange={(e) => setPaymentFormData(prev => ({ ...prev, dailyPaymentCount: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                )}
                
                {/* Información de cliente anónimo */}
                {!paymentFormData.userId && (
                  <>
                    <div className="md:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4 border-t border-gray-200 pt-4">
                        Información del Cliente
                      </h4>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Cliente *
                      </label>
                      <input
                        type="text"
                        value={paymentFormData.anonymousClientInfo.name}
                        onChange={(e) => setPaymentFormData(prev => ({
                          ...prev,
                          anonymousClientInfo: { ...prev.anonymousClientInfo, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Nombre completo del cliente"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={paymentFormData.anonymousClientInfo.phone}
                        onChange={(e) => setPaymentFormData(prev => ({
                          ...prev,
                          anonymousClientInfo: { ...prev.anonymousClientInfo, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="+502 1234-5678"
                      />
                    </div>
                  </>
                )}
                
                {/* Notas */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Notas adicionales sobre el pago..."
                  />
                </div>
                
              </div>
            </div>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setEditingPayment(null);
                  resetPaymentForm();
                }}
                className="btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleCreatePayment}
                disabled={saving}
                className="btn-primary flex items-center"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingPayment ? 'Actualizar' : 'Registrar'} Pago
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default PaymentsManager;

/**
 * 🆕 MEJORAS IMPLEMENTADAS AL PaymentsManager:
 * 
 * ✅ NUEVAS FUNCIONALIDADES:
 * 1. Dashboard de pagos pendientes con métricas en tiempo real
 * 2. Sistema de tabs para organizar diferentes vistas
 * 3. Validación de transferencias bancarias con aprobación/rechazo
 * 4. Activación de membresías en efectivo 
 * 5. Sistema de prioridades por tiempo de espera
 * 6. Auto-refresh configurable cada 30 segundos
 * 7. Items urgentes con alertas visuales
 * 8. Actividad reciente con timeline
 * 9. Filtros avanzados para transferencias
 * 10. Vista de comprobantes con preview
 * 
 * ✅ INTEGRACIÓN CON NUEVOS ENDPOINTS:
 * - GET /api/payments/pending-dashboard
 * - GET /api/payments/transfers/pending-detailed
 * - GET /api/memberships/pending-cash-payment
 * - POST /api/payments/{id}/validate-transfer
 * - POST /api/payments/activate-cash-membership
 * - GET /api/payments/statistics
 * 
 * ✅ MEJORAS EN UX:
 * - Sistema de tabs intuitivo con contadores
 * - Indicadores de carga y procesamiento
 * - Alertas de items urgentes
 * - Diseño responsivo mejorado
 * - Colores por prioridad para transferencias
 * - Iconografía consistente con ave quetzal
 * - Auto-refresh con toggle on/off
 * 
 * ✅ FUNCIONALIDADES DE AUTORIZACIÓN:
 * - Validación de permisos por rol
 * - Separación de funciones por permisos
 * - Logging detallado de acciones
 * - Invalidación de cache automática
 * - Manejo de errores específicos
 * 
 * ✅ COMPATIBILIDAD TOTAL:
 * - Mantiene todas las funcionalidades existentes
 * - Misma interfaz de props (onSave, onUnsavedChanges)
 * - Mismos componentes de formulario
 * - Misma estructura de datos
 * - No rompe integración existente
 * 
 * 🔄 USO EN LA APLICACIÓN:
 * El componente sigue siendo importado y usado igual:
 * <PaymentsManager onSave={handleSave} onUnsavedChanges={handleChanges} />
 * 
 * Pero ahora incluye:
 * - Tab "Dashboard": Vista general con métricas
 * - Tab "Transferencias": Validación de transferencias
 * - Tab "Efectivo": Activación de membresías
 * - Tab "Historial": Lista completa de pagos (funcionalidad original)
 * 
 * 🎯 BENEFICIOS PARA EL GIMNASIO:
 * - Control total sobre autorizaciones de pagos
 * - Gestión eficiente de transferencias bancarias guatemaltecas
 * - Activación inmediata de membresías en efectivo
 * - Seguimiento en tiempo real de pagos pendientes
 * - Alertas de items que requieren atención urgente
 * - Historial completo para auditorías
 */
/**
 * COMENTARIOS FINALES DEL COMPONENTE
 * 
 * PROPÓSITO:
 * Este componente maneja el sistema completo de pagos del gimnasio.
 * Permite registrar, validar, filtrar y gestionar todos los tipos de pagos en quetzales guatemaltecos.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Registro de pagos para membresías, servicios, productos y pagos diarios
 * - Soporte para pagos de usuarios registrados y clientes anónimos
 * - Múltiples métodos de pago (efectivo, tarjeta, transferencia, pago móvil)
 * - Validación de transferencias bancarias con comprobantes
 * - Filtros avanzados por tipo, método, estado y rango de fechas
 * - Estadísticas financieras en tiempo real
 * - Alertas de transferencias pendientes de validación
 * - Vista responsiva para escritorio y móvil
 * - Paginación para manejo eficiente de grandes volúmenes de datos
 * 
 * CONEXIONES CON OTROS ARCHIVOS:
 * - AuthContext: Para verificar permisos del usuario actual
 * - AppContext: Para mostrar notificaciones y formatear datos en quetzales
 * - apiService: Para comunicación con el backend (/api/payments/*)
 * - Lucide React: Para iconografía del sistema
 * 
 * DATOS QUE MUESTRA AL USUARIO:
 * - Lista completa de pagos con información detallada del cliente
 * - Montos en quetzales guatemaltecos (GTQ)
 * - Estados de pago (completado, pendiente, fallido, cancelado)
 * - Tipos de pago (membresía, diario, múltiple, producto, servicio)
 * - Métodos de pago utilizados
 * - Estadísticas de ingresos totales y promedios
 * - Alertas de transferencias que requieren validación manual
 * 
 * PERMISOS REQUERIDOS:
 * - create_payments: Para registrar nuevos pagos
 * - validate_transfers: Para aprobar o rechazar transferencias bancarias
 * 
 * CASOS DE USO ESPECIALES:
 * - Pagos anónimos para clientes no registrados
 * - Pagos múltiples para varios días consecutivos
 * - Subida y validación de comprobantes de transferencia
 * - Cálculo automático de estadísticas financieras
 */