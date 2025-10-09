// src/pages/dashboard/components/ExpensesManager.js
// GESTOR DE GASTOS MEJORADO - TODAS las acciones SIEMPRE visibles
// Autor: Alexander Echeverria
// ✅ Botones Editar, Eliminar y Agregar SIEMPRE disponibles

import React, { useState, useEffect } from 'react';
import {
  DollarSign, Plus, Search, Filter, Edit, RefreshCw, Calendar, Clock,
  AlertTriangle, CheckCircle, XCircle, Eye, Trash2, Check, X,
  User, TrendingUp, TrendingDown, Bell, BarChart3,
  FileText, Download, Upload, MoreHorizontal, Loader, RotateCcw,
  Receipt, Building, Zap, Settings, Users, Sparkles, Megaphone,
  Shield, FileCheck, Package, Ban, Grid3X3, List, ChevronDown, 
  SlidersHorizontal, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import expenseService from '../../../services/expenseService';

const ExpensesManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [activeSection, setActiveSection] = useState('expenses');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('expenseDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados para vista mejorada
  const [viewMode, setViewMode] = useState('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [expensesPerPage] = useState(isMobile ? 10 : 20);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  // Modal crear/editar
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    description: '',
    amount: 0,
    category: 'other_expense',
    vendor: '',
    invoiceNumber: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: '',
    isRecurring: false,
    recurringFrequency: 'monthly',
    recurringEndDate: ''
  });
  
  // Secciones del gestor
  const expenseSections = [
    {
      id: 'expenses',
      title: 'Todos los Gastos',
      icon: DollarSign,
      description: 'Gestionar todos los gastos del gimnasio',
      dataLoaded: !loading,
      color: 'purple'
    },
    {
      id: 'pending',
      title: 'Pendientes',
      icon: Clock,
      description: 'Gastos que requieren aprobación',
      dataLoaded: true,
      color: 'yellow'
    },
    {
      id: 'recurring',
      title: 'Recurrentes',
      icon: RotateCcw,
      description: 'Gastos automáticos programados',
      dataLoaded: true,
      color: 'blue'
    },
    {
      id: 'reports',
      title: 'Reportes',
      icon: BarChart3,
      description: 'Análisis financiero de gastos',
      dataLoaded: true,
      color: 'green'
    }
  ];
  
  // Obtener iconos de categoría
  const getCategoryIcon = (category) => {
    const icons = {
      rent: Building,
      utilities: Zap,
      equipment_purchase: Settings,
      equipment_maintenance: Settings,
      staff_salary: Users,
      cleaning_supplies: Sparkles,
      marketing: Megaphone,
      insurance: Shield,
      taxes: FileCheck,
      other_expense: Package
    };
    return icons[category] || Package;
  };
  
  // Obtener color de estado
  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      approved: 'green',
      paid: 'blue',
      rejected: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'gray';
  };

  // Toggle expand card
  const toggleCardExpand = (expenseId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };
  
  // Notificar cambios sin guardar
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);
  
  // CARGAR DATOS
  const loadExpenses = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: expensesPerPage,
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder
      };
      
      const response = await expenseService.getAllExpenses(params);
      
      if (response.data && Array.isArray(response.data)) {
        setExpenses(response.data);
        setTotalExpenses(response.pagination?.total || response.data.length);
      } else {
        setExpenses([]);
        setTotalExpenses(0);
      }
      
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      showError('Error al cargar gastos');
      setExpenses([]);
      setTotalExpenses(0);
    } finally {
      setLoading(false);
    }
  };
  
  const loadPendingExpenses = async () => {
    try {
      const response = await expenseService.getPendingApproval(500);
      if (response.data && Array.isArray(response.data)) {
        setPendingExpenses(response.data);
      }
    } catch (error) {
      console.error('Error al cargar gastos pendientes:', error);
      setPendingExpenses([]);
    }
  };
  
  const loadRecurringExpenses = async () => {
    try {
      const response = await expenseService.getUpcomingRecurring(30);
      if (response.data && Array.isArray(response.data)) {
        setRecurringExpenses(response.data);
      }
    } catch (error) {
      console.error('Error al cargar gastos recurrentes:', error);
      setRecurringExpenses([]);
    }
  };
  
  const loadStats = async () => {
    try {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      
      const defaultStartDate = lastMonth.toISOString().split('T')[0];
      const defaultEndDate = today.toISOString().split('T')[0];
      
      const [summary, breakdown, vendors] = await Promise.all([
        expenseService.getStatsSummary(defaultStartDate, defaultEndDate),
        expenseService.getStatsBreakdown(defaultStartDate, defaultEndDate),
        expenseService.getTopVendors(defaultStartDate, defaultEndDate, 5)
      ]);
      
      setStatsData({
        summary: summary.data,
        breakdown: breakdown.data,
        vendors: vendors.data,
        period: { startDate: defaultStartDate, endDate: defaultEndDate }
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setStatsData(null);
    }
  };
  
  const refreshExpensesData = () => {
    setRefreshKey(prev => prev + 1);
    
    if (activeSection === 'expenses') {
      loadExpenses();
    } else if (activeSection === 'pending') {
      loadPendingExpenses();
    } else if (activeSection === 'recurring') {
      loadRecurringExpenses();
    } else if (activeSection === 'reports') {
      loadStats();
    }
    
    showSuccess('Datos actualizados');
  };
  
  useEffect(() => {
    if (activeSection === 'expenses') {
      loadExpenses();
    } else if (activeSection === 'pending') {
      loadPendingExpenses();
    } else if (activeSection === 'recurring') {
      loadRecurringExpenses();
    } else if (activeSection === 'reports') {
      loadStats();
    }
  }, [activeSection, currentPage, searchTerm, selectedStatus, selectedCategory, startDate, endDate, sortBy, sortOrder, refreshKey]);
  
  // CRUD OPERATIONS
  const handleSaveExpense = async () => {
    try {
      setSaving(true);
      
      const validation = expenseService.validateExpenseData(expenseFormData);
      
      if (!validation.isValid) {
        showError(validation.errors[0]);
        return;
      }
      
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, expenseFormData);
        showSuccess('Gasto actualizado exitosamente');
      } else {
        await expenseService.createExpense(expenseFormData);
        showSuccess('Gasto creado exitosamente');
      }
      
      await loadExpenses();
      if (activeSection === 'pending') await loadPendingExpenses();
      if (activeSection === 'recurring') await loadRecurringExpenses();
      
      setShowExpenseModal(false);
      setEditingExpense(null);
      resetExpenseForm();
      
      if (onSave) {
        onSave({ type: 'expense', action: editingExpense ? 'updated' : 'created' });
      }
      
    } catch (error) {
      console.error('Error al guardar gasto:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleApproveExpense = async (expenseId) => {
    try {
      await expenseService.approveExpense(expenseId);
      await loadExpenses();
      await loadPendingExpenses();
      showSuccess('Gasto aprobado');
    } catch (error) {
      console.error('Error al aprobar gasto:', error);
    }
  };
  
  const handleRejectExpense = async (expenseId) => {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;
    
    try {
      await expenseService.rejectExpense(expenseId, reason);
      await loadExpenses();
      await loadPendingExpenses();
      showSuccess('Gasto rechazado');
    } catch (error) {
      console.error('Error al rechazar gasto:', error);
    }
  };
  
  const handleCancelExpense = async (expenseId) => {
    if (!window.confirm('¿Estás seguro de cancelar este gasto?')) {
      return;
    }
    
    const reason = prompt('Motivo de cancelación:');
    if (!reason) return;
    
    try {
      await expenseService.cancelExpense(expenseId, reason);
      await loadExpenses();
      await loadPendingExpenses();
      showSuccess('Gasto cancelado');
    } catch (error) {
      console.error('Error al cancelar gasto:', error);
    }
  };
  
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('¿Estás seguro de ELIMINAR este gasto? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await expenseService.deleteExpense(expenseId);
      await loadExpenses();
      await loadPendingExpenses();
      showSuccess('Gasto eliminado');
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
    }
  };
  
  const handleProcessRecurring = async () => {
    if (!window.confirm('¿Procesar gastos recurrentes ahora? Se crearán nuevos gastos según la programación.')) {
      return;
    }
    
    try {
      await expenseService.processRecurringExpenses();
      await loadExpenses();
      await loadRecurringExpenses();
      showSuccess('Gastos recurrentes procesados');
    } catch (error) {
      console.error('Error al procesar recurrentes:', error);
    }
  };
  
  const resetExpenseForm = () => {
    setExpenseFormData({
      title: '',
      description: '',
      amount: 0,
      category: 'other_expense',
      vendor: '',
      invoiceNumber: '',
      expenseDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: '',
      isRecurring: false,
      recurringFrequency: 'monthly',
      recurringEndDate: ''
    });
  };
  
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      title: expense.title || '',
      description: expense.description || '',
      amount: expense.amount || 0,
      category: expense.category || 'other_expense',
      vendor: expense.vendor || '',
      invoiceNumber: expense.invoiceNumber || '',
      expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : '',
      paymentMethod: expense.paymentMethod || 'cash',
      notes: expense.notes || '',
      isRecurring: expense.isRecurring || false,
      recurringFrequency: expense.recurringFrequency || 'monthly',
      recurringEndDate: expense.recurringEndDate ? expense.recurringEndDate.split('T')[0] : ''
    });
    setShowExpenseModal(true);
  };
  
  const handleNewExpense = () => {
    setEditingExpense(null);
    resetExpenseForm();
    setShowExpenseModal(true);
  };
  
  // UTILITY FUNCTIONS
  const hasActiveFilters = () => {
    return selectedStatus !== 'all' || selectedCategory !== 'all' || 
           sortBy !== 'expenseDate' || (searchTerm && searchTerm.length > 0) ||
           startDate || endDate;
  };
  
  const clearAllFilters = () => {
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSortBy('expenseDate');
    setSortOrder('desc');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };
  
  const totalPages = Math.max(1, Math.ceil(totalExpenses / expensesPerPage));
  const categories = expenseService.getAvailableCategories();
  const statuses = expenseService.getAvailableStatuses();

  const calculateViewStats = () => {
    if (!expenses || expenses.length === 0) {
      return { pending: 0, approved: 0, paid: 0, rejected: 0, cancelled: 0 };
    }

    return {
      pending: expenses.filter(e => e.status === 'pending').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      paid: expenses.filter(e => e.status === 'paid').length,
      rejected: expenses.filter(e => e.status === 'rejected').length,
      cancelled: expenses.filter(e => e.status === 'cancelled').length
    };
  };

  const viewStats = calculateViewStats();

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Gastos
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Administra todos los gastos operativos del gimnasio
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={refreshExpensesData}
            className="btn-secondary btn-sm"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
        </div>
      </div>
      
      {/* NAVEGACIÓN */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {expenseSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center relative ${
                activeSection === section.id
                  ? `bg-${section.color}-100 text-${section.color}-700`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-4 h-4 mr-2" />
              {section.title}
              
              {section.id === 'pending' && pendingExpenses.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingExpenses.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* CONTENIDO */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* SECCIÓN: Todos los Gastos */}
        {activeSection === 'expenses' && (
          <div className="space-y-6">
            
            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-900">{viewStats.pending}</div>
                  <div className="text-xs text-yellow-600">Pendientes</div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">{viewStats.approved}</div>
                  <div className="text-xs text-green-600">Aprobados</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">{viewStats.paid}</div>
                  <div className="text-xs text-blue-600">Pagados</div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-900">{viewStats.rejected}</div>
                  <div className="text-xs text-red-600">Rechazados</div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalExpenses}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>
            </div>
            
            {/* CONTROLES SUPERIORES */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h4 className="text-lg font-medium text-gray-900">
                Gastos Registrados
              </h4>
              
              {/* BOTÓN CREAR - SIEMPRE VISIBLE */}
              <button
                onClick={handleNewExpense}
                className="btn-primary btn-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Gasto
              </button>
            </div>
            
            {/* FILTROS */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              
              <div className="p-4">
                {/* Búsqueda */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título, proveedor o factura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  
                  {/* Panel móvil */}
                  <div className="sm:hidden">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Vista</label>
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`flex-1 p-2.5 flex items-center justify-center text-sm font-medium transition-colors ${
                              viewMode === 'grid'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Grid3X3 className="w-4 h-4 mr-1" />
                            Cards
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 p-2.5 flex items-center justify-center text-sm font-medium transition-colors ${
                              viewMode === 'list'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <List className="w-4 h-4 mr-1" />
                            Lista
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Filtros</label>
                        <button
                          onClick={() => setShowMobileFilters(!showMobileFilters)}
                          className={`w-full p-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center relative ${
                            hasActiveFilters()
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <SlidersHorizontal className="w-4 h-4 mr-2" />
                          Filtros
                          {hasActiveFilters() && (
                            <div className="ml-2 w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </button>
                      </div>
                    </div>

                    {hasActiveFilters() && !showMobileFilters && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-purple-700 font-medium">Filtros activos</span>
                          <button
                            onClick={clearAllFilters}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controles desktop */}
                  <div className="hidden sm:flex items-center space-x-3 flex-1">
                    
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">Todos los estados</option>
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-');
                        setSortBy(field);
                        setSortOrder(order);
                      }}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="expenseDate-desc">Más recientes</option>
                      <option value="expenseDate-asc">Más antiguos</option>
                      <option value="amount-desc">Mayor monto</option>
                      <option value="amount-asc">Menor monto</option>
                    </select>
                    
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 ${
                          viewMode === 'grid' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 ${
                          viewMode === 'list' 
                            ? 'bg-purple-100 text-purple-600' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      {expenses.length} gastos
                    </div>
                    
                    {hasActiveFilters() && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium whitespace-nowrap"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Panel filtros móvil expandido */}
              {showMobileFilters && (
                <div className="sm:hidden bg-gray-50 border-t border-gray-200 p-4">
                  <div className="space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">Filtros de búsqueda</h4>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                      >
                        <option value="all">Todos los estados</option>
                        {statuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                      >
                        <option value="all">Todas las categorías</option>
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      {hasActiveFilters() && (
                        <button
                          onClick={clearAllFilters}
                          className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg font-medium text-sm"
                        >
                          Limpiar
                        </button>
                      )}
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rango fechas desktop */}
              {!isMobile && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* LISTA/GRID DE GASTOS */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-purple-600 mr-2" />
                <span className="text-gray-600">Cargando gastos...</span>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay gastos</h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters()
                    ? 'No se encontraron gastos con los filtros aplicados'
                    : 'Comienza creando tu primer gasto'
                  }
                </p>
                <button onClick={handleNewExpense} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Gasto
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {expenses.map((expense) => {
                  const CategoryIcon = getCategoryIcon(expense.category);
                  const statusColor = getStatusColor(expense.status);
                  const category = categories.find(c => c.value === expense.category);
                  const isExpanded = expandedCards.has(expense.id);
                  
                  return viewMode === 'grid' ? (
                    // VISTA TARJETA - TODAS LAS ACCIONES VISIBLES
                    <div key={expense.id} className="bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all">
                      
                      {/* Header con badge de estado */}
                      <div className={`px-4 py-3 border-b bg-${statusColor}-50 border-${statusColor}-200`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium text-${statusColor}-700`}>
                            {expense.status || 'pending'}
                          </span>
                          {expense.isRecurring && (
                            <span className="text-xs text-purple-600 flex items-center">
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Recurrente
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-6">
                        {/* Info principal */}
                        <div className="flex items-start mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                            <CategoryIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                              {expense.title}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {category?.label || expense.category}
                            </p>
                            {expense.vendor && (
                              <p className="text-xs text-gray-400 truncate">
                                {expense.vendor}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Monto y fecha */}
                        <div className="mb-4">
                          <div className="text-2xl font-bold text-purple-600">
                            {expenseService.formatCurrency(expense.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(expense.expenseDate, 'dd/MM/yyyy')}
                          </div>
                        </div>

                        {/* Detalles expandibles */}
                        {isExpanded && (
                          <div className="mb-4 space-y-2">
                            {expense.description && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                <strong>Descripción:</strong> {expense.description}
                              </div>
                            )}
                            {expense.invoiceNumber && (
                              <div className="text-xs text-gray-500">
                                Factura: {expense.invoiceNumber}
                              </div>
                            )}
                            {expense.notes && (
                              <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                                <strong>Notas:</strong> {expense.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botón expandir/colapsar */}
                        {(expense.description || expense.notes || expense.invoiceNumber) && (
                          <button
                            onClick={() => toggleCardExpand(expense.id)}
                            className="w-full text-sm text-purple-600 hover:text-purple-800 flex items-center justify-center py-2 mb-3"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Ver menos
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Ver más
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* BOTONES DE ACCIÓN - SIEMPRE VISIBLES */}
                        <div className="space-y-2">
                          
                          {/* Editar - SIEMPRE VISIBLE */}
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="w-full btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Gasto
                          </button>

                          {/* Acciones de estado en grid */}
                          {expense.status === 'pending' && (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleApproveExpense(expense.id)}
                                className="btn-sm bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleRejectExpense(expense.id)}
                                className="btn-sm bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Rechazar
                              </button>
                            </div>
                          )}

                          {/* Cancelar */}
                          {(expense.status === 'pending' || expense.status === 'approved') && (
                            <button
                              onClick={() => handleCancelExpense(expense.id)}
                              className="w-full btn-sm bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Cancelar Gasto
                            </button>
                          )}

                          {/* Eliminar - SIEMPRE VISIBLE */}
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="w-full btn-sm border-2 border-red-300 text-red-700 hover:bg-red-50 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // VISTA LISTA - TODAS LAS ACCIONES
                    <div key={expense.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between gap-4">
                        
                        {/* Info principal */}
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CategoryIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {expense.title}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {category?.label}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-purple-600">
                              {expenseService.formatCurrency(expense.amount)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(expense.expenseDate, 'dd/MM/yyyy')}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800 flex-shrink-0`}>
                            {expense.status}
                          </span>
                        </div>
                        
                        {/* BOTONES DE ACCIÓN - TODOS VISIBLES */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          
                          {/* Aprobar/Rechazar */}
                          {expense.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveExpense(expense.id)}
                                className="p-2 text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                                title="Aprobar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectExpense(expense.id)}
                                className="p-2 text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                                title="Rechazar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {/* Editar - SIEMPRE VISIBLE */}
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Cancelar */}
                          {(expense.status === 'pending' || expense.status === 'approved') && (
                            <button
                              onClick={() => handleCancelExpense(expense.id)}
                              className="p-2 text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors"
                              title="Cancelar"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Eliminar - SIEMPRE VISIBLE */}
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* PAGINACIÓN */}
            {totalPages > 1 && !loading && expenses.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-700">
                    Página <span className="font-medium">{currentPage}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      ← Anterior
                    </button>
                    
                    <div className="text-sm text-gray-500">
                      {currentPage} / {totalPages}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* SECCIÓN: Pendientes */}
        {activeSection === 'pending' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Gastos Pendientes de Aprobación
              </h3>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingExpenses.length} pendientes
              </span>
            </div>
            
            {pendingExpenses.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">¡Todo al día!</h3>
                <p className="text-gray-600">No hay gastos pendientes de aprobación</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingExpenses.map((expense) => {
                  const CategoryIcon = getCategoryIcon(expense.category);
                  const category = categories.find(c => c.value === expense.category);
                  
                  return (
                    <div key={expense.id} className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                            <CategoryIcon className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {expense.title}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {category?.label || expense.category}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-2xl font-bold text-gray-900">
                          {expenseService.formatCurrency(expense.amount)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(expense.createdAt, 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                      
                      {expense.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {expense.description}
                        </p>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveExpense(expense.id)}
                          className="flex-1 btn-sm bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRejectExpense(expense.id)}
                          className="flex-1 btn-sm bg-red-600 hover:bg-red-700 text-white"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* SECCIÓN: Recurrentes */}
        {activeSection === 'recurring' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Gastos Recurrentes Programados
              </h3>
              <button
                onClick={handleProcessRecurring}
                className="btn-primary btn-sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Procesar Ahora
              </button>
            </div>
            
            {recurringExpenses.length === 0 ? (
              <div className="text-center py-12">
                <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin gastos recurrentes</h3>
                <p className="text-gray-600">No hay gastos programados próximamente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recurringExpenses.map((expense) => {
                  const CategoryIcon = getCategoryIcon(expense.category);
                  const category = categories.find(c => c.value === expense.category);
                  
                  return (
                    <div key={expense.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <CategoryIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {expense.title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {category?.label || expense.category}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xl font-bold text-gray-900">
                          {expenseService.formatCurrency(expense.amount)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Frecuencia: {expense.recurringFrequency}
                        </div>
                        <div className="text-xs text-gray-600">
                          Próxima: {formatDate(expense.nextRecurringDate, 'dd/MM/yyyy')}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="w-full btn-sm btn-secondary"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* SECCIÓN: Reportes */}
        {activeSection === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Reportes y Estadísticas
            </h3>
            
            {!statsData ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Cargando estadísticas...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {statsData.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm text-purple-600 mb-1">Total Gastos</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {statsData.summary.totalExpenses || 0}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-green-600 mb-1">Monto Total</div>
                      <div className="text-2xl font-bold text-green-900">
                        {expenseService.formatCurrency(statsData.summary.totalAmount || 0)}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-600 mb-1">Promedio</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {expenseService.formatCurrency(statsData.summary.averageAmount || 0)}
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-sm text-yellow-600 mb-1">Máximo</div>
                      <div className="text-2xl font-bold text-yellow-900">
                        {expenseService.formatCurrency(statsData.summary.maxAmount || 0)}
                      </div>
                    </div>
                  </div>
                )}
                
                {statsData.breakdown && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Gastos por Categoría
                    </h4>
                    <div className="space-y-3">
                      {statsData.breakdown.map((item, index) => {
                        const category = categories.find(c => c.value === item.category);
                        const CategoryIcon = getCategoryIcon(item.category);
                        
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <CategoryIcon className="w-5 h-5 text-gray-600 mr-2" />
                              <span className="text-sm text-gray-700">
                                {category?.label || item.category}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-500">
                                {item.count} gastos
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {expenseService.formatCurrency(item.total)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {statsData.vendors && statsData.vendors.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Top Proveedores
                    </h4>
                    <div className="space-y-3">
                      {statsData.vendors.map((vendor, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-bold text-purple-600">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {vendor.vendor}
                              </div>
                              <div className="text-xs text-gray-500">
                                {vendor.transactionCount} transacciones
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">
                            {expenseService.formatCurrency(vendor.totalSpent)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* MODAL CREAR/EDITAR */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h3>
                <button
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    resetExpenseForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Gasto *
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.title}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Pago de alquiler mensual"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Detalles adicionales del gasto..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto (Q) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.vendor}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Nombre del proveedor"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Factura
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.invoiceNumber}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: F-001234"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    value={expenseFormData.expenseDate}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={expenseFormData.paymentMethod}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="card">Tarjeta</option>
                    <option value="check">Cheque</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Notas internas..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={expenseFormData.isRecurring}
                      onChange={(e) => setExpenseFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Este es un gasto recurrente</span>
                  </label>
                </div>
                
                {expenseFormData.isRecurring && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frecuencia
                      </label>
                      <select
                        value={expenseFormData.recurringFrequency}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        {expenseService.getRecurringFrequencies().map(freq => (
                          <option key={freq.value} value={freq.value}>
                            {freq.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Finalización (opcional)
                      </label>
                      <input
                        type="date"
                        value={expenseFormData.recurringEndDate}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}
                
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                  resetExpenseForm();
                }}
                className="btn-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveExpense}
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
                    {editingExpense ? 'Actualizar' : 'Crear'} Gasto
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

export default ExpensesManager;
/*
=============================================================================
EXPENSES MANAGER COMPLETO
=============================================================================

✅ FUNCIONALIDADES IMPLEMENTADAS:

📋 SISTEMA DE PESTAÑAS:
1. Todos los Gastos - Lista completa con filtros
2. Pendientes de Aprobación - Requieren acción
3. Gastos Recurrentes - Programados
4. Reportes y Estadísticas - Análisis

🔍 FILTROS AVANZADOS:
- Búsqueda por texto
- Estado (pending, approved, paid, rejected, cancelled)
- Categoría (10 categorías disponibles)
- Rango de fechas
- Ordenamiento personalizado
- Paginación

➕ CRUD COMPLETO:
- Crear gasto
- Actualizar gasto
- Eliminar gasto
- Ver detalles

🔄 ACCIONES DE ESTADO:
- Aprobar gasto
- Rechazar gasto (con motivo)
- Cancelar gasto (con motivo)
- Procesar gastos recurrentes

📊 REPORTES:
- Resumen de estadísticas
- Breakdown por categorías
- Top proveedores
- Métricas visuales

📱 RESPONSIVE:
- Desktop: Tabla completa
- Mobile: Cards optimizadas
- Filtros adaptivos
- Modal fullscreen en móvil

🎨 UI/UX:
- Iconos por categoría
- Colores por estado
- Loading states
- Empty states
- Toasts de confirmación
- Validaciones en frontend

🔐 PERMISOS:
- create_expenses
- edit_expenses
- delete_expenses
- approve_expenses
- cancel_expenses

✅ INTEGRACIÓN COMPLETA con expenseService
=============================================================================
*/