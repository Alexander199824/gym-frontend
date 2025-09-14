// src/pages/dashboard/components/PaymentsManager.js
// VERSIÓN COMPLETA SIN ERRORES - Dashboard de gestión de pagos

import React, { useState, useEffect } from 'react';
import {
  Coins, Plus, Search, RefreshCw, Eye, Check, X, 
  CreditCard, Banknote, Building, Calendar, Smartphone,
  CheckCircle, XCircle, Clock, Loader2,
  TrendingUp, Bird, Users, Activity,
  AlertTriangle, Timer, Phone, Mail,
  User, Filter, Grid3X3, List, DollarSign,
  UserCheck, UserX, MessageSquare, Hash,
  Shield, Receipt, Zap, TrendingDown,
  ArrowUp, ArrowDown, BarChart3
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
  
  // Estados específicos por método de pago
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingCashPayments, setPendingCashPayments] = useState([]);
  const [pendingCardPayments, setPendingCardPayments] = useState([]);
  const [cashPaymentStats, setCashPaymentStats] = useState({});
  const [cardPaymentStats, setCardPaymentStats] = useState({});
  const [financialDashboard, setFinancialDashboard] = useState({});
  
  // Estados de procesamiento
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Estados de filtros básicos
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const paymentsPerPage = 20;

  // Estados específicos para cada método
  const [cashViewMode, setCashViewMode] = useState('grid');
  const [cashSortBy, setCashSortBy] = useState('waiting_time');
  const [cashPriorityFilter, setCashPriorityFilter] = useState('all');
  
  const [cardViewMode, setCardViewMode] = useState('grid');
  const [cardSortBy, setCardSortBy] = useState('waiting_time');
  const [cardPriorityFilter, setCardPriorityFilter] = useState('all');

  // ================================
  // FUNCIONES DE CARGA DE DATOS
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

  const loadPendingCashPayments = async () => {
    try {
      console.log('💵 Cargando pagos en efectivo pendientes...');
      
      const response = await apiService.paymentService.getPendingCashPayments({
        search: searchTerm,
        sortBy: cashSortBy,
        priority: cashPriorityFilter === 'all' ? undefined : cashPriorityFilter
      });
      
      setPendingCashPayments(response?.data?.payments || []);
      
      const statsResponse = await apiService.paymentService.getCashPaymentStats();
      setCashPaymentStats(statsResponse?.data || {});
      
      console.log(`✅ ${response?.data?.payments?.length || 0} pagos en efectivo cargados`);
    } catch (error) {
      console.error('❌ Error cargando pagos en efectivo:', error);
      setPendingCashPayments([]);
      setCashPaymentStats({});
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

  const loadPendingCardPayments = async () => {
    try {
      console.log('💳 Cargando pagos con tarjeta pendientes...');
      
      const response = await apiService.paymentService.getPendingCardPayments({
        search: searchTerm,
        sortBy: cardSortBy,
        priority: cardPriorityFilter === 'all' ? undefined : cardPriorityFilter
      });
      
      setPendingCardPayments(response?.data?.payments || []);
      
      const statsResponse = await apiService.paymentService.getCardPaymentStats();
      setCardPaymentStats(statsResponse?.data || {});
      
      console.log(`✅ ${response?.data?.payments?.length || 0} pagos con tarjeta cargados`);
    } catch (error) {
      console.error('❌ Error cargando pagos con tarjeta:', error);
      setPendingCardPayments([]);
      setCardPaymentStats({});
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
  // FUNCIONES DE ACCIÓN PARA TRANSFERENCIAS
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
        approved ? 'Transferencia aprobada por administrador' : 'Transferencia rechazada por administrador');
      
      showSuccess(approved ? 'Transferencia aprobada correctamente' : 'Transferencia rechazada correctamente');
      
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
  // FUNCIONES DE ACCIÓN PARA EFECTIVO
  // ================================

  const handleConfirmCashPayment = async (paymentId) => {
    if (processingIds.has(paymentId)) return;

    const paymentData = pendingCashPayments.find(p => p.id === paymentId);
    
    const confirmed = window.confirm(
      `¿Confirmar que recibiste ${formatCurrency(paymentData?.amount || 0)} en efectivo de ${paymentData?.client?.name || 'este cliente'}?`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      console.log('💵 Confirmando pago en efectivo:', paymentId);
      
      await apiService.paymentService.confirmCashPayment(paymentId, {
        notes: `Pago en efectivo recibido de ${paymentData?.client?.name || 'cliente'} por ${paymentData?.paymentType || 'servicio'}`
      });
      
      showSuccess(
        `¡Pago confirmado! ${formatCurrency(paymentData?.amount || 0)} recibidos correctamente.`
      );
      
      setPendingCashPayments(prev => prev.filter(p => p.id !== paymentId));
      
      await loadPendingCashPayments();
      await loadPayments();
      
      if (onSave) {
        onSave({ 
          type: 'cash_payment_confirmation',
          paymentId,
          clientName: paymentData?.client?.name || 'Cliente',
          amount: paymentData?.amount || 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error confirmando pago en efectivo:', error);
      showError('Error al confirmar pago en efectivo');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const handleCancelCashPayment = async (paymentId) => {
    if (processingIds.has(paymentId)) return;

    const paymentData = pendingCashPayments.find(p => p.id === paymentId);
    
    const reason = window.prompt(
      `¿Por qué quieres cancelar el pago de ${paymentData?.client?.name || 'este cliente'}?\n\nEscribe la razón:`,
      'Cliente no se presentó'
    );
    
    if (!reason || reason.trim() === '') return;

    const confirmed = window.confirm(
      `¿Confirmar cancelación del pago de ${formatCurrency(paymentData?.amount || 0)}?\n\nRazón: ${reason}`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      console.log('❌ Cancelando pago en efectivo:', paymentId);
      
      await apiService.paymentService.cancelCashPayment(paymentId, {
        reason: reason.trim(),
        notes: `Pago cancelado: ${reason.trim()}`
      });
      
      showSuccess(
        `Pago cancelado correctamente. Razón: ${reason.trim()}`
      );
      
      setPendingCashPayments(prev => prev.filter(p => p.id !== paymentId));
      
      await loadPendingCashPayments();
      await loadPayments();
      
      if (onSave) {
        onSave({ 
          type: 'cash_payment_cancellation',
          paymentId,
          clientName: paymentData?.client?.name || 'Cliente',
          amount: paymentData?.amount || 0,
          reason: reason.trim()
        });
      }
      
    } catch (error) {
      console.error('❌ Error cancelando pago en efectivo:', error);
      showError('Error al cancelar pago en efectivo');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // ================================
  // FUNCIONES DE ACCIÓN PARA TARJETAS
  // ================================

  const handleConfirmCardPayment = async (paymentId) => {
    if (processingIds.has(paymentId)) return;

    const paymentData = pendingCardPayments.find(p => p.id === paymentId);
    
    const transactionId = window.prompt(
      `Confirmar pago con tarjeta de ${paymentData?.client?.name || 'cliente'}:\n\nMonto: ${formatCurrency(paymentData?.amount || 0)}\n\nIngresa el ID de transacción:`,
      `TXN_${Date.now()}`
    );
    
    if (!transactionId || transactionId.trim() === '') return;

    const confirmed = window.confirm(
      `¿Confirmar procesamiento de ${formatCurrency(paymentData?.amount || 0)} con tarjeta?\n\nID Transacción: ${transactionId}`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      console.log('💳 Confirmando pago con tarjeta:', paymentId);
      
      await apiService.paymentService.confirmCardPayment(paymentId, {
        notes: `Pago con tarjeta procesado para ${paymentData?.client?.name || 'cliente'}`,
        transactionId: transactionId.trim(),
        cardLast4: paymentData?.cardLast4 || undefined
      });
      
      showSuccess(
        `¡Pago con tarjeta confirmado! ${formatCurrency(paymentData?.amount || 0)} procesados correctamente.`
      );
      
      setPendingCardPayments(prev => prev.filter(p => p.id !== paymentId));
      
      await loadPendingCardPayments();
      await loadPayments();
      
      if (onSave) {
        onSave({ 
          type: 'card_payment_confirmation',
          paymentId,
          clientName: paymentData?.client?.name || 'Cliente',
          amount: paymentData?.amount || 0,
          transactionId: transactionId.trim()
        });
      }
      
    } catch (error) {
      console.error('❌ Error confirmando pago con tarjeta:', error);
      showError('Error al confirmar pago con tarjeta');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const handleCancelCardPayment = async (paymentId) => {
    if (processingIds.has(paymentId)) return;

    const paymentData = pendingCardPayments.find(p => p.id === paymentId);
    
    const reason = window.prompt(
      `¿Por qué quieres cancelar el pago con tarjeta de ${paymentData?.client?.name || 'este cliente'}?\n\nEscribe la razón:`,
      'Problema con la transacción'
    );
    
    if (!reason || reason.trim() === '') return;

    const confirmed = window.confirm(
      `¿Confirmar cancelación del pago con tarjeta de ${formatCurrency(paymentData?.amount || 0)}?\n\nRazón: ${reason}`
    );
    
    if (!confirmed) return;

    try {
      setProcessingIds(prev => new Set([...prev, paymentId]));
      
      console.log('❌ Cancelando pago con tarjeta:', paymentId);
      
      await apiService.paymentService.cancelCardPayment(paymentId, {
        reason: reason.trim(),
        notes: `Pago con tarjeta cancelado: ${reason.trim()}`
      });
      
      showSuccess(
        `Pago con tarjeta cancelado correctamente. Razón: ${reason.trim()}`
      );
      
      setPendingCardPayments(prev => prev.filter(p => p.id !== paymentId));
      
      await loadPendingCardPayments();
      await loadPayments();
      
      if (onSave) {
        onSave({ 
          type: 'card_payment_cancellation',
          paymentId,
          clientName: paymentData?.client?.name || 'Cliente',
          amount: paymentData?.amount || 0,
          reason: reason.trim()
        });
      }
      
    } catch (error) {
      console.error('❌ Error cancelando pago con tarjeta:', error);
      showError('Error al cancelar pago con tarjeta');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  // ================================
  // FUNCIONES DE FILTROS
  // ================================

  const getFilteredCashPayments = () => {
    let filtered = pendingCashPayments;

    if (cashPriorityFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const priority = apiService.paymentService.getCashPaymentPriorityConfig(
          payment.hoursWaiting || 0
        ).priority;
        return priority === cashPriorityFilter;
      });
    }

    if (searchTerm) {
      const searchText = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => {
        const clientInfo = `${payment.client?.name || ''} ${payment.client?.email || ''} ${payment.paymentType || ''} ${payment.description || ''}`.toLowerCase();
        return clientInfo.includes(searchText);
      });
    }

    filtered.sort((a, b) => {
      switch (cashSortBy) {
        case 'waiting_time':
          return (b.hoursWaiting || 0) - (a.hoursWaiting || 0);
        case 'amount':
          return (b.amount || 0) - (a.amount || 0);
        case 'name':
          return (a.client?.name || '').localeCompare(b.client?.name || '');
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getFilteredCardPayments = () => {
    let filtered = pendingCardPayments;

    if (cardPriorityFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const priority = apiService.paymentService.getCardPaymentPriorityConfig(
          payment.hoursWaiting || 0
        ).priority;
        return priority === cardPriorityFilter;
      });
    }

    if (searchTerm) {
      const searchText = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => {
        const clientInfo = `${payment.client?.name || ''} ${payment.client?.email || ''} ${payment.paymentType || ''} ${payment.description || ''} ${payment.transactionId || ''}`.toLowerCase();
        return clientInfo.includes(searchText);
      });
    }

    filtered.sort((a, b) => {
      switch (cardSortBy) {
        case 'waiting_time':
          return (b.hoursWaiting || 0) - (a.hoursWaiting || 0);
        case 'amount':
          return (b.amount || 0) - (a.amount || 0);
        case 'name':
          return (a.client?.name || '').localeCompare(b.client?.name || '');
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
        loadPendingCashPayments(),
        loadPendingCardPayments(),
        loadFinancialDashboard()
      ]);
    };
    
    loadData();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    if (activeTab === 'cash') {
      loadPendingCashPayments();
    }
  }, [cashSortBy, cashPriorityFilter]);

  useEffect(() => {
    if (activeTab === 'cards') {
      loadPendingCardPayments();
    }
  }, [cardSortBy, cardPriorityFilter]);

  // ================================
  // UTILIDADES PARA RENDERIZADO
  // ================================

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: Banknote,
      card: CreditCard,
      transfer: Building,
      mobile: Smartphone
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

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Completado',
      pending: 'Pendiente',
      failed: 'Fallido',
      cancelled: 'Cancelado'
    };
    return labels[status] || 'Completado';
  };

  const getMethodLabel = (method) => {
    const labels = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      mobile: 'Pago Móvil'
    };
    return labels[method] || 'Efectivo';
  };

  const filteredCashPayments = getFilteredCashPayments();
  const filteredCardPayments = getFilteredCardPayments();

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
              loadPendingCashPayments();
              loadPendingCardPayments();
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
            Transferencias Bancarias
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
            Pagos en Efectivo
            {cashPaymentStats.total > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                {cashPaymentStats.total}
              </span>
            )}
            {cashPaymentStats.urgent > 0 && (
              <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                <AlertTriangle className="w-3 h-3" />
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
              activeTab === 'cards'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pagos con Tarjeta
            {cardPaymentStats.total > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                {cardPaymentStats.total}
              </span>
            )}
            {cardPaymentStats.urgent > 0 && (
              <span className="ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
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
            Resumen Financiero
          </button>
        </nav>
      </div>

      {/* CONTENIDO DEL TAB HISTORIAL */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar pagos por nombre de cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="text-sm text-gray-500">
                {totalPayments} pagos registrados
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
                <span className="text-gray-600">Cargando historial de pagos...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No se encontraron pagos con ese criterio de búsqueda' : 'Aún no se han registrado pagos en el sistema'}
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
                                  payment.client?.name || 
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
                              {formatDate(payment.paymentDate || payment.createdAt, 'dd/MM/yyyy HH:mm')}
                              <span className="mx-2">•</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(payment.status || 'completed')}`}>
                                {getStatusLabel(payment.status || 'completed')}
                              </span>
                              <span className="mx-2">•</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {getMethodLabel(payment.paymentMethod)}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => console.log('Ver detalles del pago:', payment)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                            title="Ver detalles del pago"
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
                  Todas las transferencias bancarias han sido procesadas
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
                            {transfer.user?.name || transfer.client?.name || 'Cliente Anónimo'}
                          </h4>
                          <div className="text-2xl font-bold text-green-600 flex items-center mt-2">
                            <Bird className="w-6 h-6 mr-2" />
                            {formatCurrency(transfer.amount)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Fecha: {formatDate(transfer.paymentDate || transfer.createdAt, 'dd/MM/yyyy HH:mm')}
                            {transfer.hoursWaiting && (
                              <span className="ml-2">• Esperando {transfer.hoursWaiting.toFixed(1)} horas</span>
                            )}
                          </p>
                          {transfer.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              Concepto: {transfer.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleValidateTransfer(transfer.id, true)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
          
          {/* ESTADÍSTICAS DE EFECTIVO CORREGIDAS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{cashPaymentStats.total || 0}</div>
                <div className="text-xs text-green-600">Pagos Esperando</div>
                {cashPaymentStats.total > 0 && (
                  <div className="text-xs text-gray-500 mt-1">En efectivo</div>
                )}
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-900">{cashPaymentStats.urgent || 0}</div>
                <div className="text-xs text-orange-600">Urgentes</div>
                {cashPaymentStats.urgent > 0 && (
                  <div className="text-xs text-orange-500 mt-1">Más de 4h</div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-900 flex items-center justify-center">
                  <Bird className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formatCurrency(cashPaymentStats.totalAmount || 0)}</span>
                </div>
                <div className="text-xs text-blue-600">Total Pendiente</div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-900 flex items-center justify-center">
                  <Bird className="w-4 h-4 mr-1" />
                  <span className="text-sm">{formatCurrency(cashPaymentStats.avgAmount || 0)}</span>
                </div>
                <div className="text-xs text-purple-600">Promedio</div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{(cashPaymentStats.avgHours || 0).toFixed(1)}h</div>
                <div className="text-xs text-gray-600">Tiempo Promedio</div>
                {cashPaymentStats.avgHours > 4 && (
                  <div className="text-xs text-orange-500 mt-1">⚠️ Elevado</div>
                )}
              </div>
            </div>
          </div>

          {/* CONTROLES DE EFECTIVO */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white rounded-lg p-4 border border-gray-200">
            
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pagos en efectivo por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={cashPriorityFilter}
                onChange={(e) => setCashPriorityFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">🟠 Urgentes (más de 4 horas)</option>
                <option value="normal">🟢 Normales (menos de 4 horas)</option>
              </select>
              
              <select
                value={cashSortBy}
                onChange={(e) => setCashSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="waiting_time">Ordenar por tiempo de espera</option>
                <option value="amount">Ordenar por monto</option>
                <option value="name">Ordenar por nombre</option>
                <option value="created">Ordenar por fecha de creación</option>
              </select>
              
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
                {filteredCashPayments.length} pagos mostrados
              </div>
            </div>
          </div>

          {/* CONTENIDO DE PAGOS EN EFECTIVO */}
          {filteredCashPayments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm || cashPriorityFilter !== 'all'
                  ? 'No se encontraron pagos con ese criterio'
                  : '¡Excelente! No hay pagos en efectivo pendientes'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || cashPriorityFilter !== 'all'
                  ? 'Intenta con otro criterio de búsqueda o filtro'
                  : 'Todos los pagos en efectivo han sido procesados correctamente'
                }
              </p>
            </div>
          ) : (
            <div className={`${cashViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {filteredCashPayments.map((payment) => (
                cashViewMode === 'grid' ? (
                  <CashPaymentCard
                    key={payment.id}
                    payment={payment}
                    onConfirm={handleConfirmCashPayment}
                    onCancel={handleCancelCashPayment}
                    isProcessing={processingIds.has(payment.id)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ) : (
                  <CashPaymentListItem
                    key={payment.id}
                    payment={payment}
                    onConfirm={handleConfirmCashPayment}
                    onCancel={handleCancelCashPayment}
                    isProcessing={processingIds.has(payment.id)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DEL TAB TARJETAS */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          
          {/* ESTADÍSTICAS DE TARJETAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CreditCard className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">{cardPaymentStats.total || 0}</div>
                  <div className="text-sm text-blue-600">Pagos Pendientes</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-red-900">{cardPaymentStats.urgent || 0}</div>
                  <div className="text-sm text-red-600">Urgentes (&gt;24h)</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Bird className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-lg font-bold text-green-900">{formatCurrency(cardPaymentStats.totalAmount || 0)}</div>
                  <div className="text-sm text-green-600">Total Pendiente</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Timer className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-900">{(cardPaymentStats.avgHours || 0).toFixed(1)}h</div>
                  <div className="text-sm text-purple-600">Tiempo Promedio</div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTROLES DE TARJETAS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 bg-white rounded-lg p-4 border border-gray-200">
            
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pagos con tarjeta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={cardPriorityFilter}
                onChange={(e) => setCardPriorityFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">🔴 Urgentes (más de 24 horas)</option>
                <option value="medium">🟡 Medias (12-24 horas)</option>
                <option value="normal">🟢 Normales (menos de 12 horas)</option>
              </select>
              
              <select
                value={cardSortBy}
                onChange={(e) => setCardSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="waiting_time">Ordenar por tiempo de espera</option>
                <option value="amount">Ordenar por monto</option>
                <option value="name">Ordenar por nombre</option>
                <option value="created">Ordenar por fecha de creación</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setCardViewMode('grid')}
                  className={`p-2 ${cardViewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Vista en cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCardViewMode('list')}
                  className={`p-2 ${cardViewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Vista en lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                {filteredCardPayments.length} pagos mostrados
              </div>
            </div>
          </div>

          {/* CONTENIDO DE PAGOS CON TARJETA */}
          {filteredCardPayments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm || cardPriorityFilter !== 'all'
                  ? 'No se encontraron pagos con ese criterio'
                  : '¡Perfecto! No hay pagos con tarjeta pendientes'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || cardPriorityFilter !== 'all'
                  ? 'Intenta con otro criterio de búsqueda o filtro'
                  : 'Todos los pagos con tarjeta han sido procesados correctamente'
                }
              </p>
            </div>
          ) : (
            <div className={`${cardViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
              {filteredCardPayments.map((payment) => (
                cardViewMode === 'grid' ? (
                  <CardPaymentCard
                    key={payment.id}
                    payment={payment}
                    onConfirm={handleConfirmCardPayment}
                    onCancel={handleCancelCardPayment}
                    isProcessing={processingIds.has(payment.id)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ) : (
                  <CardPaymentListItem
                    key={payment.id}
                    payment={payment}
                    onConfirm={handleConfirmCardPayment}
                    onCancel={handleCancelCardPayment}
                    isProcessing={processingIds.has(payment.id)}
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
                <Bird className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(statistics.totalIncome || 0)}
                  </div>
                  <div className="text-sm text-green-600">Ingresos Totales</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {statistics.totalPayments || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total de Transacciones</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-900">
                    {pendingTransfers.length}
                  </div>
                  <div className="text-sm text-purple-600">Transferencias Pendientes</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-orange-900">
                    {formatCurrency(statistics.averagePayment || 0)}
                  </div>
                  <div className="text-sm text-orange-600">Promedio por Pago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard financiero detallado */}
          {financialDashboard.today && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Hoy
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ingresos del día:</span>
                    <span className="text-sm font-medium text-green-600 flex items-center">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      {formatCurrency(financialDashboard.today.income || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gastos del día:</span>
                    <span className="text-sm font-medium text-red-600 flex items-center">
                      <ArrowDown className="w-3 h-3 mr-1" />
                      {formatCurrency(financialDashboard.today.expenses || 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Balance neto:</span>
                      <span className={`text-sm font-bold ${(financialDashboard.today.income - financialDashboard.today.expenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency((financialDashboard.today.income || 0) - (financialDashboard.today.expenses || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Esta Semana
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ingresos semanales:</span>
                    <span className="text-sm font-medium text-green-600 flex items-center">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      {formatCurrency(financialDashboard.thisWeek?.income || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gastos semanales:</span>
                    <span className="text-sm font-medium text-red-600 flex items-center">
                      <ArrowDown className="w-3 h-3 mr-1" />
                      {formatCurrency(financialDashboard.thisWeek?.expenses || 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Balance neto:</span>
                      <span className={`text-sm font-bold ${((financialDashboard.thisWeek?.income || 0) - (financialDashboard.thisWeek?.expenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency((financialDashboard.thisWeek?.income || 0) - (financialDashboard.thisWeek?.expenses || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                  Este Mes
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ingresos mensuales:</span>
                    <span className="text-sm font-medium text-green-600 flex items-center">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      {formatCurrency(financialDashboard.thisMonth?.income || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gastos mensuales:</span>
                    <span className="text-sm font-medium text-red-600 flex items-center">
                      <ArrowDown className="w-3 h-3 mr-1" />
                      {formatCurrency(financialDashboard.thisMonth?.expenses || 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Balance neto:</span>
                      <span className={`text-sm font-bold ${((financialDashboard.thisMonth?.income || 0) - (financialDashboard.thisMonth?.expenses || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency((financialDashboard.thisMonth?.income || 0) - (financialDashboard.thisMonth?.expenses || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resumen por métodos de pago */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Coins className="w-5 h-5 mr-2 text-gray-600" />
              Resumen por Métodos de Pago
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-green-200 rounded-lg bg-green-50">
                <Banknote className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-900">{cashPaymentStats.total || 0}</div>
                <div className="text-sm text-green-600">Pagos en Efectivo</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(cashPaymentStats.totalAmount || 0)} pendientes
                </div>
              </div>
              
              <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
                <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-900">{cardPaymentStats.total || 0}</div>
                <div className="text-sm text-blue-600">Pagos con Tarjeta</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(cardPaymentStats.totalAmount || 0)} pendientes
                </div>
              </div>
              
              <div className="text-center p-4 border border-purple-200 rounded-lg bg-purple-50">
                <Building className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-900">{pendingTransfers.length}</div>
                <div className="text-sm text-purple-600">Transferencias</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(pendingTransfers.reduce((sum, t) => sum + (t.amount || 0), 0))} pendientes
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================
// COMPONENTES PARA PAGOS EN EFECTIVO
// ================================

const CashPaymentCard = ({ payment, onConfirm, onCancel, isProcessing, formatCurrency, formatDate }) => {
  const isUrgent = (payment.hoursWaiting || 0) > 4;
  
  return (
    <div className={`bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ${
      isUrgent ? 'ring-2 ring-orange-200 border-orange-300' : 'border-gray-200'
    }`}>
      
      {isUrgent && (
        <div className="bg-orange-50 px-4 py-2 border-b border-orange-200">
          <div className="flex items-center text-orange-700 text-sm">
            <Timer className="w-4 h-4 mr-1" />
            <span className="font-medium">Esperando {payment.hoursWaiting.toFixed(1)} horas</span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-xl font-bold text-green-700">
              {payment.client ? 
                `${payment.client.name[0]}${payment.client.name.split(' ')[1]?.[0] || ''}` :
                'A'
              }
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {payment.client?.name || 'Cliente Anónimo'}
            </h3>
            <div className="text-sm text-gray-500 space-y-1">
              {payment.client?.email && (
                <div className="flex items-center truncate">
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="truncate">{payment.client.email}</span>
                </div>
              )}
              {payment.client?.phone && (
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  <span>{payment.client.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Tipo de Pago</div>
              <div className="font-medium text-gray-900 truncate">
                {payment.paymentType === 'membership' ? 'Membresía' :
                 payment.paymentType === 'daily' ? 'Pago Diario' :
                 payment.paymentType || 'Pago General'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Monto</div>
              <div className="text-xl font-bold text-green-600 flex items-center">
                <Bird className="w-4 h-4 mr-1" />
                {formatCurrency(payment.amount)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Fecha de Creación</div>
              <div className="text-gray-700">
                {formatDate(payment.createdAt, 'dd/MM HH:mm')}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Tiempo de Espera</div>
              <div className={`font-medium ${isUrgent ? 'text-orange-600' : 'text-gray-700'}`}>
                {payment.hoursWaiting?.toFixed(1) || '0.0'} horas
              </div>
            </div>
          </div>
        </div>
        
        {payment.description && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Descripción:</div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-900">{payment.description}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onConfirm(payment.id)}
            disabled={isProcessing}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Confirmar
              </>
            )}
          </button>
          
          <button
            onClick={() => onCancel(payment.id)}
            disabled={isProcessing}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <UserX className="w-4 h-4 mr-2" />
                Cancelar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const CashPaymentListItem = ({ payment, onConfirm, onCancel, isProcessing, formatCurrency, formatDate }) => {
  const isUrgent = (payment.hoursWaiting || 0) > 4;
  
  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
      isUrgent ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        
        <div className="flex items-center flex-1">
          <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-lg font-bold text-green-700">
              {payment.client ? 
                `${payment.client.name[0]}${payment.client.name.split(' ')[1]?.[0] || ''}` :
                'A'
              }
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {payment.client?.name || 'Cliente Anónimo'}
              </h3>
              
              {isUrgent && (
                <div className="flex items-center text-orange-600 text-sm">
                  <Timer className="w-4 h-4 mr-1" />
                  <span>{payment.hoursWaiting.toFixed(1)}h</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>{payment.paymentType === 'membership' ? 'Membresía' :
                       payment.paymentType === 'daily' ? 'Pago Diario' :
                       payment.paymentType || 'Pago General'}</span>
              </div>
              
              <div className="flex items-center font-semibold text-green-600">
                <Bird className="w-4 h-4 mr-1" />
                <span>{formatCurrency(payment.amount)}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(payment.createdAt, 'dd/MM HH:mm')}</span>
              </div>
              
              {payment.client?.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{payment.client.phone}</span>
                </div>
              )}
              
              {payment.description && (
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span className="truncate max-w-40">{payment.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex space-x-2">
          <button
            onClick={() => onConfirm(payment.id)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Confirmar
              </>
            )}
          </button>
          
          <button
            onClick={() => onCancel(payment.id)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <UserX className="w-4 h-4 mr-2" />
                Cancelar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================================
// COMPONENTES PARA PAGOS CON TARJETA
// ================================

const CardPaymentCard = ({ payment, onConfirm, onCancel, isProcessing, formatCurrency, formatDate }) => {
  const isUrgent = (payment.hoursWaiting || 0) > 24;
  const isMedium = (payment.hoursWaiting || 0) > 12 && (payment.hoursWaiting || 0) <= 24;
  
  return (
    <div className={`bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 ${
      isUrgent ? 'ring-2 ring-red-200 border-red-300' : 
      isMedium ? 'ring-2 ring-orange-200 border-orange-300' : 
      'border-gray-200'
    }`}>
      
      {(isUrgent || isMedium) && (
        <div className={`${isUrgent ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} px-4 py-2 border-b`}>
          <div className={`flex items-center text-sm ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
            <Timer className="w-4 h-4 mr-1" />
            <span className="font-medium">Esperando {payment.hoursWaiting.toFixed(1)} horas</span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-xl font-bold text-blue-700">
              {payment.client ? 
                `${payment.client.name[0]}${payment.client.name.split(' ')[1]?.[0] || ''}` :
                'A'
              }
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {payment.client?.name || 'Cliente Anónimo'}
            </h3>
            <div className="text-sm text-gray-500 space-y-1">
              {payment.client?.email && (
                <div className="flex items-center truncate">
                  <Mail className="w-3 h-3 mr-1" />
                  <span className="truncate">{payment.client.email}</span>
                </div>
              )}
              {payment.client?.phone && (
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  <span>{payment.client.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Tipo de Pago</div>
              <div className="font-medium text-gray-900 truncate">
                {payment.paymentType === 'membership' ? 'Membresía' :
                 payment.paymentType === 'daily' ? 'Pago Diario' :
                 payment.paymentType || 'Pago General'}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Monto</div>
              <div className="text-xl font-bold text-blue-600 flex items-center">
                <Bird className="w-4 h-4 mr-1" />
                {formatCurrency(payment.amount)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Fecha de Creación</div>
              <div className="text-gray-700">
                {formatDate(payment.createdAt, 'dd/MM HH:mm')}
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Tiempo de Espera</div>
              <div className={`font-medium ${isUrgent ? 'text-red-600' : isMedium ? 'text-orange-600' : 'text-gray-700'}`}>
                {payment.hoursWaiting?.toFixed(1) || '0.0'} horas
              </div>
            </div>
          </div>
        </div>
        
        {payment.transactionId && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">ID de Transacción:</div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-900 font-mono">{payment.transactionId}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onConfirm(payment.id)}
            disabled={isProcessing}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </>
            )}
          </button>
          
          <button
            onClick={() => onCancel(payment.id)}
            disabled={isProcessing}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center text-sm ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const CardPaymentListItem = ({ payment, onConfirm, onCancel, isProcessing, formatCurrency, formatDate }) => {
  const isUrgent = (payment.hoursWaiting || 0) > 24;
  const isMedium = (payment.hoursWaiting || 0) > 12 && (payment.hoursWaiting || 0) <= 24;
  
  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
      isUrgent ? 'border-red-300 bg-red-50' : 
      isMedium ? 'border-orange-300 bg-orange-50' : 
      'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        
        <div className="flex items-center flex-1">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4">
            <span className="text-lg font-bold text-blue-700">
              {payment.client ? 
                `${payment.client.name[0]}${payment.client.name.split(' ')[1]?.[0] || ''}` :
                'A'
              }
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {payment.client?.name || 'Cliente Anónimo'}
              </h3>
              
              {(isUrgent || isMedium) && (
                <div className={`flex items-center text-sm ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
                  <Timer className="w-4 h-4 mr-1" />
                  <span>{payment.hoursWaiting.toFixed(1)}h</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-1" />
                <span>{payment.paymentType === 'membership' ? 'Membresía' :
                       payment.paymentType === 'daily' ? 'Pago Diario' :
                       payment.paymentType || 'Pago General'}</span>
              </div>
              
              <div className="flex items-center font-semibold text-blue-600">
                <Bird className="w-4 h-4 mr-1" />
                <span>{formatCurrency(payment.amount)}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(payment.createdAt, 'dd/MM HH:mm')}</span>
              </div>
              
              {payment.transactionId && (
                <div className="flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  <span className="truncate max-w-20">{payment.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex space-x-2">
          <button
            onClick={() => onConfirm(payment.id)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </>
            )}
          </button>
          
          <button
            onClick={() => onCancel(payment.id)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center ${
              isProcessing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsManager;