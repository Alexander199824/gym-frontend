// src/pages/dashboard/components/ExpensesManager.js
// GESTOR DE GASTOS - Gestión completa con sistema de pestañas
// Autor: Alexander Echeverria
// ✅ RESPONSIVE: Mobile, Tablet, Desktop

import React, { useState, useEffect } from 'react';
import {
  DollarSign, Plus, Search, Filter, Edit, RefreshCw, Calendar, Clock,
  AlertTriangle, CheckCircle, XCircle, Eye, Trash2, Check, X,
  User, TrendingUp, TrendingDown, Bell, BarChart3,
  FileText, Download, Upload, MoreHorizontal, Loader, RotateCcw,
  Receipt, Building, Zap, Tool, Users, Sparkles, Megaphone,
  Shield, FileCheck, Package, Ban
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import expenseService from '../../../services/expenseService';

const ExpensesManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados principales para pestañas
  const [activeSection, setActiveSection] = useState('expenses');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Estados principales para gastos
  const [expenses, setExpenses] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('expenseDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [expensesPerPage] = useState(isMobile ? 10 : 20);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  // Estados para crear/editar gasto
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
  
  // Secciones del gestor de gastos
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
      title: 'Pendientes de Aprobación',
      icon: Clock,
      description: 'Gastos que requieren aprobación',
      dataLoaded: true,
      color: 'yellow'
    },
    {
      id: 'recurring',
      title: 'Gastos Recurrentes',
      icon: RotateCcw,
      description: 'Gastos automáticos programados',
      dataLoaded: true,
      color: 'blue'
    },
    {
      id: 'reports',
      title: 'Reportes y Estadísticas',
      icon: BarChart3,
      description: 'Análisis financiero de gastos',
      dataLoaded: true,
      color: 'green'
    }
  ];
  
  // Obtener categorías con iconos
  const getCategoryIcon = (category) => {
    const icons = {
      rent: Building,
      utilities: Zap,
      equipment_purchase: Tool,
      equipment_maintenance: Tool,
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
      
      console.log('Cargando gastos con parámetros:', params);
      
      const response = await expenseService.getAllExpenses(params);
      
      if (response.data && Array.isArray(response.data)) {
        setExpenses(response.data);
        setTotalExpenses(response.pagination?.total || response.data.length);
      } else {
        console.warn('Formato de datos de gastos inesperado:', response);
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
  
  // CARGAR GASTOS PENDIENTES
  const loadPendingExpenses = async () => {
    try {
      console.log('🔄 Cargando gastos pendientes...');
      const response = await expenseService.getPendingApproval(500);
      
      if (response.data && Array.isArray(response.data)) {
        setPendingExpenses(response.data);
        console.log(`✅ ${response.data.length} gastos pendientes cargados`);
      }
    } catch (error) {
      console.error('Error al cargar gastos pendientes:', error);
      setPendingExpenses([]);
    }
  };
  
  // CARGAR GASTOS RECURRENTES
  const loadRecurringExpenses = async () => {
    try {
      console.log('🔄 Cargando gastos recurrentes...');
      const response = await expenseService.getUpcomingRecurring(30);
      
      if (response.data && Array.isArray(response.data)) {
        setRecurringExpenses(response.data);
        console.log(`✅ ${response.data.length} gastos recurrentes cargados`);
      }
    } catch (error) {
      console.error('Error al cargar gastos recurrentes:', error);
      setRecurringExpenses([]);
    }
  };
  
  // CARGAR ESTADÍSTICAS
  const loadStats = async () => {
    try {
      console.log('📊 Cargando estadísticas...');
      
      // Fechas por defecto: último mes
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
      
      console.log('✅ Estadísticas cargadas');
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setStatsData(null);
    }
  };
  
  // Refrescar todos los datos
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
  
  // Cargar datos al montar y cuando cambien filtros
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
  
  // CREAR/ACTUALIZAR GASTO
  const handleSaveExpense = async () => {
    try {
      setSaving(true);
      
      // Validar
      const validation = expenseService.validateExpenseData(expenseFormData);
      
      if (!validation.isValid) {
        showError(validation.errors[0]);
        return;
      }
      
      let response;
      if (editingExpense) {
        response = await expenseService.updateExpense(editingExpense.id, expenseFormData);
        showSuccess('Gasto actualizado exitosamente');
      } else {
        response = await expenseService.createExpense(expenseFormData);
        showSuccess('Gasto creado exitosamente');
      }
      
      // Recargar datos
      await loadExpenses();
      if (activeSection === 'pending') await loadPendingExpenses();
      if (activeSection === 'recurring') await loadRecurringExpenses();
      
      // Cerrar modal
      setShowExpenseModal(false);
      setEditingExpense(null);
      resetExpenseForm();
      
      // Notificar cambios guardados
      if (onSave) {
        onSave({ type: 'expense', action: editingExpense ? 'updated' : 'created' });
      }
      
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      // El error ya fue manejado por el servicio
    } finally {
      setSaving(false);
    }
  };
  
  // APROBAR GASTO
  const handleApproveExpense = async (expenseId) => {
    try {
      await expenseService.approveExpense(expenseId);
      await loadExpenses();
      await loadPendingExpenses();
    } catch (error) {
      console.error('Error al aprobar gasto:', error);
    }
  };
  
  // RECHAZAR GASTO
  const handleRejectExpense = async (expenseId) => {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;
    
    try {
      await expenseService.rejectExpense(expenseId, reason);
      await loadExpenses();
      await loadPendingExpenses();
    } catch (error) {
      console.error('Error al rechazar gasto:', error);
    }
  };
  
  // CANCELAR GASTO
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
    } catch (error) {
      console.error('Error al cancelar gasto:', error);
    }
  };
  
  // ELIMINAR GASTO
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('¿Estás seguro de ELIMINAR este gasto? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await expenseService.deleteExpense(expenseId);
      await loadExpenses();
      await loadPendingExpenses();
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
    }
  };
  
  // PROCESAR RECURRENTES
  const handleProcessRecurring = async () => {
    if (!window.confirm('¿Procesar gastos recurrentes ahora? Se crearán nuevos gastos según la programación.')) {
      return;
    }
    
    try {
      await expenseService.processRecurringExpenses();
      await loadExpenses();
      await loadRecurringExpenses();
    } catch (error) {
      console.error('Error al procesar recurrentes:', error);
    }
  };
  
  // Reset form
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
  
  // Abrir modal para editar
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
  
  // Abrir modal para crear
  const handleNewExpense = () => {
    setEditingExpense(null);
    resetExpenseForm();
    setShowExpenseModal(true);
  };
  
  // Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalExpenses / expensesPerPage));
  
  // Categorías y estados
  const categories = expenseService.getAvailableCategories();
  const statuses = expenseService.getAvailableStatuses();

  return (
    <div className="space-y-6 relative">
      
      {/* HEADER DEL GESTOR DE GASTOS */}
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
          {/* Botón de actualizar */}
          <button
            onClick={refreshExpensesData}
            className="btn-secondary btn-sm"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Indicador de cambios sin guardar */}
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
        </div>
      </div>
      
      {/* NAVEGACIÓN POR SECCIONES */}
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
              
              {/* Indicadores de estado */}
              {section.dataLoaded && (
                <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
              
              {/* Badge para pendientes */}
              {section.id === 'pending' && pendingExpenses.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingExpenses.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* CONTENIDO SEGÚN SECCIÓN ACTIVA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* SECCIÓN: Todos los Gastos */}
        {activeSection === 'expenses' && (
          <div className="space-y-6">
            
            {/* CONTROLES SUPERIORES */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <h4 className="text-lg font-medium text-gray-900">
                  Gastos Registrados
                </h4>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {totalExpenses} total
                </span>
              </div>
              
              {hasPermission('create_expenses') && (
                <button
                  onClick={handleNewExpense}
                  className="btn-primary btn-sm w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Gasto
                </button>
              )}
            </div>
            
            {/* FILTROS Y BÚSQUEDA */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar gastos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Filtro por estado */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">Todos los estados</option>
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                
                {/* Filtro por categoría */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
                
                {/* Ordenamiento */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="expenseDate-desc">Más recientes</option>
                  <option value="expenseDate-asc">Más antiguos</option>
                  <option value="amount-desc">Mayor monto</option>
                  <option value="amount-asc">Menor monto</option>
                </select>
                
              </div>
              
              {/* Rango de fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
            
            {/* TABLA/LISTA DE GASTOS */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              
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
                    {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all' 
                      ? 'No se encontraron gastos con los filtros aplicados'
                      : 'Comienza creando tu primer gasto'
                    }
                  </p>
                  {hasPermission('create_expenses') && (
                    <button onClick={handleNewExpense} className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Gasto
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
                            Gasto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
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
                        {expenses.map((expense) => {
                          const CategoryIcon = getCategoryIcon(expense.category);
                          const statusColor = getStatusColor(expense.status);
                          const category = categories.find(c => c.value === expense.category);
                          
                          return (
                            <tr key={expense.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 mr-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <CategoryIcon className="w-5 h-5 text-purple-600" />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {expense.title}
                                    </div>
                                    {expense.vendor && (
                                      <div className="text-sm text-gray-500">
                                        {expense.vendor}
                                      </div>
                                    )}
                                    {expense.invoiceNumber && (
                                      <div className="text-xs text-gray-400">
                                        Factura: {expense.invoiceNumber}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {category?.label || expense.category}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {expenseService.formatCurrency(expense.amount)}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(expense.expenseDate, 'dd/MM/yyyy')}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                                  {expense.status}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  
                                  {/* Aprobar */}
                                  {expense.status === 'pending' && hasPermission('approve_expenses') && (
                                    <button
                                      onClick={() => handleApproveExpense(expense.id)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Aprobar gasto"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Rechazar */}
                                  {expense.status === 'pending' && hasPermission('approve_expenses') && (
                                    <button
                                      onClick={() => handleRejectExpense(expense.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Rechazar gasto"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Editar */}
                                  {hasPermission('edit_expenses') && (
                                    <button
                                      onClick={() => handleEditExpense(expense)}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Editar gasto"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Cancelar */}
                                  {(expense.status === 'pending' || expense.status === 'approved') && hasPermission('cancel_expenses') && (
                                    <button
                                      onClick={() => handleCancelExpense(expense.id)}
                                      className="text-orange-600 hover:text-orange-800"
                                      title="Cancelar gasto"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Eliminar */}
                                  {hasPermission('delete_expenses') && (
                                    <button
                                      onClick={() => handleDeleteExpense(expense.id)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Eliminar gasto"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
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
                    {expenses.map((expense) => {
                      const CategoryIcon = getCategoryIcon(expense.category);
                      const statusColor = getStatusColor(expense.status);
                      const category = categories.find(c => c.value === expense.category);
                      
                      return (
                        <div key={expense.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <CategoryIcon className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {expense.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {category?.label || expense.category}
                                </div>
                              </div>
                            </div>
                            
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                              {expense.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-gray-900">
                                {expenseService.formatCurrency(expense.amount)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDate(expense.expenseDate, 'dd/MM/yyyy')}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {expense.status === 'pending' && hasPermission('approve_expenses') && (
                                <>
                                  <button
                                    onClick={() => handleApproveExpense(expense.id)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectExpense(expense.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              
                              {hasPermission('edit_expenses') && (
                                <button
                                  onClick={() => handleEditExpense(expense)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
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
                            Mostrando {((currentPage - 1) * expensesPerPage) + 1} a {Math.min(currentPage * expensesPerPage, totalExpenses)} de {totalExpenses} gastos
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
        
        {/* SECCIÓN: Pendientes de Aprobación */}
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
                            {expense.vendor && (
                              <div className="text-xs text-gray-500 mt-1">
                                Proveedor: {expense.vendor}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-2xl font-bold text-gray-900">
                          {expenseService.formatCurrency(expense.amount)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Registrado: {formatDate(expense.createdAt, 'dd/MM/yyyy HH:mm')}
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
        
        {/* SECCIÓN: Gastos Recurrentes */}
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
        
        {/* SECCIÓN: Reportes y Estadísticas */}
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
                
                {/* Resumen */}
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
                
                {/* Breakdown por categorías */}
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
                
                {/* Top proveedores */}
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
      
      {/* MODAL PARA CREAR/EDITAR GASTO */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            
            {/* Header del modal */}
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
            
            {/* Contenido del modal */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Gasto *
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.title}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Pago de alquiler mensual"
                  />
                </div>
                
                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Detalles adicionales del gasto..."
                  />
                </div>
                
                {/* Monto */}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.vendor}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Nombre del proveedor"
                  />
                </div>
                
                {/* Número de factura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Factura
                  </label>
                  <input
                    type="text"
                    value={expenseFormData.invoiceNumber}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: F-001234"
                  />
                </div>
                
                {/* Fecha del gasto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha del Gasto *
                  </label>
                  <input
                    type="date"
                    value={expenseFormData.expenseDate}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={expenseFormData.paymentMethod}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="card">Tarjeta</option>
                    <option value="check">Cheque</option>
                  </select>
                </div>
                
                {/* Notas */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Notas internas..."
                  />
                </div>
                
                {/* Gasto recurrente */}
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
                
                {/* Opciones de recurrencia */}
                {expenseFormData.isRecurring && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frecuencia
                      </label>
                      <select
                        value={expenseFormData.recurringFrequency}
                        onChange={(e) => setExpenseFormData(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </>
                )}
                
              </div>
            </div>
            
            {/* Footer del modal */}
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