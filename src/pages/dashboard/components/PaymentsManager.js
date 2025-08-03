// src/pages/dashboard/components/PaymentsManager.js
// FUNCIÓN: Gestión completa de pagos - Crear, validar, reportes, transferencias
// CONECTA CON: Backend API /api/payments/*

import React, { useState, useEffect } from 'react';
import {
  DollarSign, Plus, Search, Filter, Eye, Check, X, Clock, AlertCircle,
  CreditCard, Banknote, Building, Smartphone, Upload, Download,
  RefreshCw, Calendar, User, FileText, CheckCircle, XCircle,
  TrendingUp, PieChart, BarChart3, Calculator, Bell, Settings,
  ImageIcon, Loader, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const PaymentsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // 📊 Estados principales
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🔍 Estados de filtros y búsqueda
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
  
  // 📄 Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentsPerPage] = useState(isMobile ? 10 : 20);
  const [totalPayments, setTotalPayments] = useState(0);
  
  // 💳 Estados para transferencias pendientes
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [showTransfersModal, setShowTransfersModal] = useState(false);
  
  // 🆕 Estados para crear/editar pago
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
  
  // 💰 Tipos de pago disponibles
  const paymentTypes = [
    { value: 'membership', label: 'Membresía', color: 'bg-purple-100 text-purple-800', icon: CreditCard },
    { value: 'daily', label: 'Pago Diario', color: 'bg-blue-100 text-blue-800', icon: Calendar },
    { value: 'bulk_daily', label: 'Pago Múltiple', color: 'bg-green-100 text-green-800', icon: Calculator },
    { value: 'product', label: 'Producto', color: 'bg-orange-100 text-orange-800', icon: FileText },
    { value: 'service', label: 'Servicio', color: 'bg-pink-100 text-pink-800', icon: Settings },
    { value: 'other', label: 'Otro', color: 'bg-gray-100 text-gray-800', icon: MoreHorizontal }
  ];
  
  // 💳 Métodos de pago disponibles
  const paymentMethods = [
    { value: 'cash', label: 'Efectivo', color: 'bg-green-100 text-green-800', icon: Banknote },
    { value: 'card', label: 'Tarjeta', color: 'bg-blue-100 text-blue-800', icon: CreditCard },
    { value: 'transfer', label: 'Transferencia', color: 'bg-purple-100 text-purple-800', icon: Building },
    { value: 'mobile', label: 'Pago Móvil', color: 'bg-orange-100 text-orange-800', icon: Smartphone }
  ];
  
  // 📊 Estados de pago
  const paymentStatuses = [
    { value: 'completed', label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'failed', label: 'Fallido', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: X }
  ];
  
  // 🔄 CARGAR DATOS
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
      
      console.log('🔄 Loading payments with params:', params);
      
      const response = await apiService.get('/payments', { params });
      const paymentData = response.data || response;
      
      if (paymentData.payments && Array.isArray(paymentData.payments)) {
        setPayments(paymentData.payments);
        setTotalPayments(paymentData.pagination?.total || paymentData.payments.length);
      } else if (Array.isArray(paymentData)) {
        setPayments(paymentData);
        setTotalPayments(paymentData.length);
      } else {
        console.warn('⚠️ Payments data format unexpected:', paymentData);
        setPayments([]);
        setTotalPayments(0);
      }
      
    } catch (error) {
      console.error('❌ Error loading payments:', error);
      showError('Error al cargar pagos');
      setPayments([]);
      setTotalPayments(0);
    } finally {
      setLoading(false);
    }
  };
  
  // 📊 CARGAR ESTADÍSTICAS
  const loadPaymentStats = async () => {
    try {
      const stats = await apiService.getPaymentReports({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      console.log('📊 Payment stats loaded:', stats);
      setPaymentStats(stats);
    } catch (error) {
      console.error('❌ Error loading payment stats:', error);
      setPaymentStats({
        totalIncome: 0,
        totalPayments: 0,
        incomeByMethod: [],
        averagePayment: 0
      });
    }
  };
  
  // 💳 CARGAR TRANSFERENCIAS PENDIENTES
  const loadPendingTransfers = async () => {
    try {
      const response = await apiService.getPendingTransfers();
      const transfersData = response.data || response;
      setPendingTransfers(Array.isArray(transfersData) ? transfersData : transfersData.transfers || []);
    } catch (error) {
      console.error('❌ Error loading pending transfers:', error);
      setPendingTransfers([]);
    }
  };
  
  // ⏰ Cargar datos al montar y cuando cambien filtros
  useEffect(() => {
    loadPayments();
  }, [currentPage, searchTerm, selectedPaymentType, selectedMethod, selectedStatus, dateRange, sortBy, sortOrder]);
  
  useEffect(() => {
    loadPaymentStats();
    loadPendingTransfers();
  }, [dateRange]);
  
  // 🔍 FILTRAR PAGOS (para datos locales)
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
  
  // 📊 FUNCIONES DE PAGO
  
  // Crear pago
  const handleCreatePayment = async () => {
    try {
      setSaving(true);
      
      // Validaciones
      if (paymentFormData.amount <= 0) {
        showError('El monto debe ser mayor a 0');
        return;
      }
      
      if (!paymentFormData.paymentDate) {
        showError('Fecha de pago es obligatoria');
        return;
      }
      
      // Si no hay userId, debe ser pago anónimo
      if (!paymentFormData.userId && paymentFormData.paymentType !== 'daily' && paymentFormData.paymentType !== 'bulk_daily') {
        showError('Debe especificar un usuario o usar pago diario anónimo');
        return;
      }
      
      // Para pagos anónimos, validar datos del cliente
      if (!paymentFormData.userId && !paymentFormData.anonymousClientInfo.name) {
        showError('Para pagos anónimos, el nombre del cliente es obligatorio');
        return;
      }
      
      const paymentData = {
        ...paymentFormData,
        userId: paymentFormData.userId || undefined,
        membershipId: paymentFormData.membershipId || undefined,
        anonymousClientInfo: !paymentFormData.userId ? paymentFormData.anonymousClientInfo : undefined,
        dailyPaymentCount: ['daily', 'bulk_daily'].includes(paymentFormData.paymentType) ? paymentFormData.dailyPaymentCount : undefined
      };
      
      let response;
      if (editingPayment) {
        response = await apiService.put(`/payments/${editingPayment.id}`, paymentData);
        showSuccess('Pago actualizado exitosamente');
      } else {
        response = await apiService.post('/payments', paymentData);
        showSuccess('Pago registrado exitosamente');
      }
      
      // Recargar datos
      await loadPayments();
      await loadPaymentStats();
      
      // Cerrar modal
      setShowPaymentModal(false);
      setEditingPayment(null);
      resetPaymentForm();
      
      // Notificar cambios guardados
      if (onSave) {
        onSave({ type: 'payment', action: editingPayment ? 'updated' : 'created' });
      }
      
    } catch (error) {
      console.error('❌ Error saving payment:', error);
      const errorMsg = error.response?.data?.message || 'Error al guardar pago';
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // Validar transferencia
  const handleValidateTransfer = async (paymentId, approved, notes = '') => {
    try {
      await apiService.post(`/payments/${paymentId}/validate-transfer`, {
        approved,
        notes
      });
      
      showSuccess(`Transferencia ${approved ? 'aprobada' : 'rechazada'} exitosamente`);
      
      await loadPayments();
      await loadPendingTransfers();
      
    } catch (error) {
      console.error('❌ Error validating transfer:', error);
      showError('Error al validar transferencia');
    }
  };
  
  // Subir comprobante de transferencia
  const handleUploadTransferProof = async (paymentId, file) => {
    try {
      const formData = new FormData();
      formData.append('proof', file);
      
      await apiService.post(`/payments/${paymentId}/transfer-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showSuccess('Comprobante subido exitosamente');
      
      await loadPayments();
      await loadPendingTransfers();
      
    } catch (error) {
      console.error('❌ Error uploading transfer proof:', error);
      showError('Error al subir comprobante');
    }
  };
  
  // Reset form
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
  
  // Abrir modal para editar
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
  
  // Abrir modal para crear
  const handleNewPayment = () => {
    setEditingPayment(null);
    resetPaymentForm();
    setShowPaymentModal(true);
  };
  
  // 📊 Obtener información del tipo de pago
  const getTypeInfo = (type) => {
    return paymentTypes.find(t => t.value === type) || paymentTypes[0];
  };
  
  // 📊 Obtener información del método de pago
  const getMethodInfo = (method) => {
    return paymentMethods.find(m => m.value === method) || paymentMethods[0];
  };
  
  // 📊 Obtener información del estado
  const getStatusInfo = (status) => {
    return paymentStatuses.find(s => s.value === status) || paymentStatuses[0];
  };
  
  // 📄 Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalPayments / paymentsPerPage));

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-green-600" />
            Gestión de Pagos
          </h3>
          <p className="text-gray-600 mt-1">
            Administra pagos, transferencias y reportes financieros
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {/* Transferencias pendientes */}
          {pendingTransfers.length > 0 && (
            <button
              onClick={() => setShowTransfersModal(true)}
              className="btn-warning btn-sm relative"
            >
              <Bell className="w-4 h-4 mr-2" />
              Transferencias
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingTransfers.length}
              </span>
            </button>
          )}
          
          <button
            onClick={() => loadPayments()}
            className="btn-secondary btn-sm"
            disabled={loading}
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
      
      {/* 📊 ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(paymentStats.totalIncome || 0)}
              </div>
              <div className="text-sm text-green-600">Ingresos Totales</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-blue-900">
                {paymentStats.totalPayments || 0}
              </div>
              <div className="text-sm text-blue-600">Total Pagos</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-purple-900">
                {formatCurrency(paymentStats.averagePayment || 0)}
              </div>
              <div className="text-sm text-purple-600">Promedio</div>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-orange-900">
                {pendingTransfers.length}
              </div>
              <div className="text-sm text-orange-600">Pendientes</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🔍 FILTROS Y BÚSQUEDA */}
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
      
      {/* 📋 TABLA DE PAGOS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-green-600 mr-2" />
            <span className="text-gray-600">Cargando pagos...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos</h3>
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
                      Monto
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
                                {payment.user?.email || payment.anonymousClientInfo?.phone || 'Sin datos'}
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
                          <div className="text-sm font-medium text-gray-900">
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
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Ver detalles */}
                            <button
                              onClick={() => {
                                // TODO: Implementar modal de detalles
                                console.log('Ver detalles del pago:', payment);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {/* Validar transferencia */}
                            {payment.paymentMethod === 'transfer' && payment.status === 'pending' && hasPermission('validate_transfers') && (
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
                          <div className="text-sm text-gray-500">
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 📄 PAGINACIÓN */}
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
      
      {/* 🆕 MODAL PARA CREAR/EDITAR PAGO */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
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
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
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
                
                {/* ID de usuario (opcional para pagos anónimos) */}
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
                
                {/* ID de membresía (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de Membresía
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.membershipId}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, membershipId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Solo para pagos de membresía"
                  />
                </div>
                
                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.description}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Descripción del pago"
                  />
                </div>
                
                {/* Para pagos diarios - número de días */}
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
                        Información del Cliente Anónimo
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
                        placeholder="Nombre completo"
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
                    Notas
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
                className="btn-primary"
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
      
      {/* 💳 MODAL DE TRANSFERENCIAS PENDIENTES */}
      {showTransfersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Transferencias Pendientes de Validación
                </h3>
                <button
                  onClick={() => setShowTransfersModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">
              {pendingTransfers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay transferencias pendientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTransfers.map((transfer) => (
                    <div key={transfer.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transfer.user ? 
                              `${transfer.user.firstName} ${transfer.user.lastName}` :
                              transfer.anonymousClientInfo?.name || 'Cliente Anónimo'
                            }
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatCurrency(transfer.amount)} • {formatDate(transfer.paymentDate || transfer.createdAt, 'dd/MM/yyyy')}
                          </div>
                          {transfer.transferProof && (
                            <div className="mt-2">
                              <img
                                src={transfer.transferProof}
                                alt="Comprobante de transferencia"
                                className="w-32 h-32 object-cover rounded border cursor-pointer"
                                onClick={() => window.open(transfer.transferProof, '_blank')}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleValidateTransfer(transfer.id, true)}
                            className="btn-success btn-sm"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleValidateTransfer(transfer.id, false)}
                            className="btn-danger btn-sm"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTransfersModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default PaymentsManager;