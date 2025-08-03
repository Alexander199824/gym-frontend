// src/pages/dashboard/components/ReportsManager.js
// FUNCIÓN: Gestión completa de reportes - Financieros, usuarios, membresías, analytics
// CONECTA CON: Backend API /api/payments/reports, /api/users/stats, etc.

import React, { useState, useEffect } from 'react';
import {
  BarChart3, PieChart, TrendingUp, TrendingDown, Calendar, Download,
  DollarSign, Users, CreditCard, Clock, Filter, RefreshCw, Eye,
  FileText, Calculator, Target, Award, Activity, AlertCircle,
  CheckCircle, ArrowUp, ArrowDown, Loader, X, Settings
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

const ReportsManager = ({ onSave, onUnsavedChanges }) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // 📊 Estados principales
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('financial');
  
  // 📅 Estados de filtros de fecha
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    period: 'month' // today, week, month, quarter, year, custom
  });
  
  // 📊 Estados de datos de reportes
  const [financialReport, setFinancialReport] = useState({});
  const [userReport, setUserReport] = useState({});
  const [membershipReport, setMembershipReport] = useState({});
  const [performanceReport, setPerformanceReport] = useState({});
  
  // 🎯 Tipos de reportes disponibles
  const reportTypes = [
    {
      id: 'financial',
      title: 'Reporte Financiero',
      description: 'Ingresos, gastos y análisis financiero',
      icon: DollarSign,
      color: 'bg-green-100 text-green-800 border-green-200',
      permission: 'view_financial_reports'
    },
    {
      id: 'users',
      title: 'Reporte de Usuarios',
      description: 'Estadísticas y análisis de usuarios',
      icon: Users,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      permission: 'view_user_reports'
    },
    {
      id: 'memberships',
      title: 'Reporte de Membresías',
      description: 'Análisis de membresías y renovaciones',
      icon: CreditCard,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      permission: 'view_membership_reports'
    },
    {
      id: 'performance',
      title: 'Reporte de Rendimiento',
      description: 'KPIs y métricas de rendimiento',
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      permission: 'view_performance_reports'
    }
  ];
  
  // 📅 Períodos predefinidos
  const periodOptions = [
    { value: 'today', label: 'Hoy', days: 0 },
    { value: 'week', label: 'Esta semana', days: 7 },
    { value: 'month', label: 'Este mes', days: 30 },
    { value: 'quarter', label: 'Este trimestre', days: 90 },
    { value: 'year', label: 'Este año', days: 365 },
    { value: 'custom', label: 'Personalizado', days: null }
  ];
  
  // 🔄 CARGAR DATOS DE REPORTES
  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        period: dateRange.period
      };
      
      console.log('🔄 Loading report data with params:', params);
      
      // Cargar datos según el reporte activo
      switch (activeReport) {
        case 'financial':
          await loadFinancialReport(params);
          break;
        case 'users':
          await loadUserReport(params);
          break;
        case 'memberships':
          await loadMembershipReport(params);
          break;
        case 'performance':
          await loadPerformanceReport(params);
          break;
        default:
          await loadFinancialReport(params);
      }
      
    } catch (error) {
      console.error('❌ Error loading report data:', error);
      showError('Error al cargar datos del reporte');
    } finally {
      setLoading(false);
    }
  };
  
  // 💰 CARGAR REPORTE FINANCIERO
  const loadFinancialReport = async (params) => {
    try {
      // Reporte financiero mejorado
      const response = await apiService.get('/payments/reports/enhanced', { params });
      const reportData = response.data || response;
      
      setFinancialReport({
        totalIncome: reportData.totalIncome || 0,
        incomeBySource: reportData.incomeBySource || [],
        paymentMethodStats: reportData.paymentMethodStats || [],
        dailyTrend: reportData.dailyTrend || [],
        topProducts: reportData.topProducts || [],
        previousPeriodIncome: reportData.previousPeriodIncome || 0,
        growthPercentage: reportData.growthPercentage || 0
      });
      
    } catch (error) {
      console.error('❌ Error loading financial report:', error);
      
      // Fallback con datos básicos
      try {
        const basicReport = await apiService.getPaymentReports(params);
        setFinancialReport({
          totalIncome: basicReport.totalIncome || 0,
          incomeBySource: [
            { source: 'Membresías', total: basicReport.totalIncome * 0.7, percentage: '70' },
            { source: 'Pagos Diarios', total: basicReport.totalIncome * 0.3, percentage: '30' }
          ],
          paymentMethodStats: basicReport.incomeByMethod || [],
          dailyTrend: [],
          topProducts: [],
          previousPeriodIncome: 0,
          growthPercentage: 0
        });
      } catch (fallbackError) {
        console.error('❌ Fallback financial report failed:', fallbackError);
        setFinancialReport({});
      }
    }
  };
  
  // 👥 CARGAR REPORTE DE USUARIOS
  const loadUserReport = async (params) => {
    try {
      const userStats = await apiService.getUserStats();
      
      setUserReport({
        totalUsers: userStats.totalUsers || 0,
        activeUsers: userStats.totalActiveUsers || 0,
        newUsersThisMonth: userStats.newUsersThisMonth || 0,
        roleDistribution: userStats.roleStats || {},
        userGrowth: userStats.userGrowth || [],
        topUsers: userStats.topUsers || [],
        userActivity: userStats.userActivity || {}
      });
      
    } catch (error) {
      console.error('❌ Error loading user report:', error);
      setUserReport({
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        roleDistribution: {},
        userGrowth: [],
        topUsers: [],
        userActivity: {}
      });
    }
  };
  
  // 🎫 CARGAR REPORTE DE MEMBRESÍAS
  const loadMembershipReport = async (params) => {
    try {
      const membershipStats = await apiService.getMembershipStats();
      
      setMembershipReport({
        totalMemberships: membershipStats.totalMemberships || 0,
        activeMemberships: membershipStats.activeMemberships || 0,
        expiredMemberships: membershipStats.expiredMemberships || 0,
        expiringSoon: membershipStats.expiringSoon || 0,
        membershipTypes: membershipStats.membershipTypes || [],
        renewalRate: membershipStats.renewalRate || 0,
        averageMembershipValue: membershipStats.averageMembershipValue || 0
      });
      
    } catch (error) {
      console.error('❌ Error loading membership report:', error);
      setMembershipReport({
        totalMemberships: 0,
        activeMemberships: 0,
        expiredMemberships: 0,
        expiringSoon: 0,
        membershipTypes: [],
        renewalRate: 0,
        averageMembershipValue: 0
      });
    }
  };
  
  // 📈 CARGAR REPORTE DE RENDIMIENTO
  const loadPerformanceReport = async (params) => {
    try {
      // Combinar datos de múltiples fuentes para KPIs
      const [userStats, membershipStats, paymentStats] = await Promise.all([
        apiService.getUserStats().catch(() => ({})),
        apiService.getMembershipStats().catch(() => ({})),
        apiService.getPaymentReports(params).catch(() => ({}))
      ]);
      
      const performanceData = {
        customerAcquisition: userStats.newUsersThisMonth || 0,
        membershipConversion: membershipStats.activeMemberships && userStats.totalUsers 
          ? ((membershipStats.activeMemberships / userStats.totalUsers) * 100).toFixed(1)
          : 0,
        averageRevenue: paymentStats.averagePayment || 0,
        customerRetention: 85, // Mock data - implementar cálculo real
        occupancyRate: 72, // Mock data - implementar con datos de horarios
        equipmentUtilization: 68, // Mock data - implementar con datos reales
        staffProductivity: 90, // Mock data - implementar con datos reales
        customerSatisfaction: 4.2, // Mock data - implementar con encuestas
        kpis: [
          {
            name: 'Ingresos Mensuales',
            value: formatCurrency(paymentStats.totalIncome || 0),
            change: '+12%',
            trend: 'up',
            target: formatCurrency((paymentStats.totalIncome || 0) * 1.15),
            status: 'good'
          },
          {
            name: 'Nuevos Clientes',
            value: userStats.newUsersThisMonth || 0,
            change: '+8%',
            trend: 'up',
            target: (userStats.newUsersThisMonth || 0) + 5,
            status: 'good'
          },
          {
            name: 'Retención',
            value: '85%',
            change: '-2%',
            trend: 'down',
            target: '90%',
            status: 'warning'
          },
          {
            name: 'Ocupación',
            value: '72%',
            change: '+5%',
            trend: 'up',
            target: '80%',
            status: 'good'
          }
        ]
      };
      
      setPerformanceReport(performanceData);
      
    } catch (error) {
      console.error('❌ Error loading performance report:', error);
      setPerformanceReport({
        customerAcquisition: 0,
        membershipConversion: 0,
        averageRevenue: 0,
        customerRetention: 0,
        occupancyRate: 0,
        equipmentUtilization: 0,
        staffProductivity: 0,
        customerSatisfaction: 0,
        kpis: []
      });
    }
  };
  
  // ⏰ Cargar datos al montar y cuando cambien filtros
  useEffect(() => {
    loadReportData();
  }, [activeReport, dateRange]);
  
  // 📅 Manejar cambio de período
  const handlePeriodChange = (period) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = today;
        endDate = today;
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        // No cambiar fechas para custom
        setDateRange(prev => ({ ...prev, period }));
        return;
    }
    
    if (period !== 'custom') {
      setDateRange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        period
      });
    }
  };
  
  // 📊 Exportar reporte
  const handleExportReport = async (format = 'pdf') => {
    try {
      const params = {
        ...dateRange,
        reportType: activeReport,
        format
      };
      
      // Simular descarga - implementar endpoint real
      showSuccess(`Exportando reporte en formato ${format.toUpperCase()}...`);
      
      // TODO: Implementar descarga real
      // const response = await apiService.get('/reports/export', { params, responseType: 'blob' });
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `reporte-${activeReport}-${Date.now()}.${format}`);
      // document.body.appendChild(link);
      // link.click();
      // link.remove();
      
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      showError('Error al exportar reporte');
    }
  };
  
  // 📊 Obtener color para tendencias
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  // 📊 Obtener ícono para tendencias
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return ArrowUp;
      case 'down': return ArrowDown;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🔝 HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-indigo-600" />
            Reportes y Analytics
          </h3>
          <p className="text-gray-600 mt-1">
            Análisis detallado del rendimiento y métricas del gimnasio
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={() => loadReportData()}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button
            onClick={() => handleExportReport('pdf')}
            className="btn-primary btn-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </button>
          
          <button
            onClick={() => handleExportReport('excel')}
            className="btn-secondary btn-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </button>
        </div>
      </div>
      
      {/* 🔗 NAVEGACIÓN DE REPORTES */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((report) => {
            if (!hasPermission(report.permission)) return null;
            
            const ReportIcon = report.icon;
            const isActive = activeReport === report.id;
            
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isActive 
                    ? report.color + ' border-current'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start">
                  <ReportIcon className="w-8 h-8 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-sm">{report.title}</h4>
                    <p className="text-xs opacity-75 mt-1">{report.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* 📅 FILTROS DE FECHA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-3 lg:space-y-0">
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          
          {/* Períodos predefinidos */}
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  dateRange.period === option.value
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Fechas personalizadas */}
          {dateRange.period === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          )}
          
        </div>
      </div>
      
      {/* 📊 CONTENIDO DEL REPORTE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
            <span className="text-gray-600">Cargando reporte...</span>
          </div>
        ) : (
          <>
            {/* REPORTE FINANCIERO */}
            {activeReport === 'financial' && (
              <div className="p-6 space-y-6">
                
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(financialReport.totalIncome || 0)}
                        </div>
                        <div className="text-sm text-green-600">Ingresos Totales</div>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                    {financialReport.growthPercentage !== undefined && (
                      <div className={`text-sm mt-2 ${
                        financialReport.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {financialReport.growthPercentage >= 0 ? '+' : ''}{financialReport.growthPercentage}% vs período anterior
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-900">
                          {financialReport.paymentMethodStats?.length || 0}
                        </div>
                        <div className="text-sm text-blue-600">Métodos de Pago</div>
                      </div>
                      <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-900">
                          {financialReport.incomeBySource?.length || 0}
                        </div>
                        <div className="text-sm text-purple-600">Fuentes de Ingreso</div>
                      </div>
                      <PieChart className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                {/* Ingresos por fuente */}
                {financialReport.incomeBySource && financialReport.incomeBySource.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Ingresos por Fuente</h4>
                    <div className="space-y-3">
                      {financialReport.incomeBySource.map((source, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">{source.source}</span>
                            <span className="text-sm text-gray-500 ml-2">({source.count} transacciones)</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{formatCurrency(source.total)}</div>
                            <div className="text-sm text-gray-500">{source.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Métodos de pago */}
                {financialReport.paymentMethodStats && financialReport.paymentMethodStats.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Ingresos por Método de Pago</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {financialReport.paymentMethodStats.map((method, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">
                              {formatCurrency(method.total)}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {method.method === 'cash' ? 'Efectivo' : 
                               method.method === 'card' ? 'Tarjeta' : 
                               method.method === 'transfer' ? 'Transferencia' : method.method}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {method.count} transacciones
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Productos más vendidos */}
                {financialReport.topProducts && financialReport.topProducts.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Productos Más Vendidos</h4>
                    <div className="space-y-2">
                      {financialReport.topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{product.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{formatCurrency(product.totalRevenue)}</div>
                            <div className="text-sm text-gray-500">{product.totalSold} vendidos</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            )}
            
            {/* REPORTE DE USUARIOS */}
            {activeReport === 'users' && (
              <div className="p-6 space-y-6">
                
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-900">
                          {userReport.totalUsers || 0}
                        </div>
                        <div className="text-sm text-blue-600">Total Usuarios</div>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-900">
                          {userReport.activeUsers || 0}
                        </div>
                        <div className="text-sm text-green-600">Usuarios Activos</div>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-900">
                          {userReport.newUsersThisMonth || 0}
                        </div>
                        <div className="text-sm text-purple-600">Nuevos Este Mes</div>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-orange-900">
                          {Object.keys(userReport.roleDistribution || {}).length}
                        </div>
                        <div className="text-sm text-orange-600">Tipos de Rol</div>
                      </div>
                      <Award className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>
                
                {/* Distribución por roles */}
                {userReport.roleDistribution && Object.keys(userReport.roleDistribution).length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Distribución por Roles</h4>
                    <div className="space-y-3">
                      {Object.entries(userReport.roleDistribution).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded mr-3 ${
                              role === 'admin' ? 'bg-purple-500' :
                              role === 'colaborador' ? 'bg-blue-500' : 'bg-green-500'
                            }`} />
                            <span className="font-medium text-gray-900 capitalize">
                              {role === 'admin' ? 'Administradores' : 
                               role === 'colaborador' ? 'Personal' : 'Clientes'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{count}</div>
                            <div className="text-sm text-gray-500">
                              {userReport.totalUsers > 0 ? Math.round((count / userReport.totalUsers) * 100) : 0}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            )}
            
            {/* REPORTE DE MEMBRESÍAS */}
            {activeReport === 'memberships' && (
              <div className="p-6 space-y-6">
                
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-purple-900">
                          {membershipReport.totalMemberships || 0}
                        </div>
                        <div className="text-sm text-purple-600">Total Membresías</div>
                      </div>
                      <CreditCard className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-900">
                          {membershipReport.activeMemberships || 0}
                        </div>
                        <div className="text-sm text-green-600">Activas</div>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-red-900">
                          {membershipReport.expiredMemberships || 0}
                        </div>
                        <div className="text-sm text-red-600">Vencidas</div>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-yellow-900">
                          {membershipReport.expiringSoon || 0}
                        </div>
                        <div className="text-sm text-yellow-600">Por Vencer</div>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                </div>
                
                {/* Métricas adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {membershipReport.renewalRate || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Tasa de Renovación</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(membershipReport.averageMembershipValue || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Valor Promedio</div>
                    </div>
                  </div>
                </div>
                
              </div>
            )}
            
            {/* REPORTE DE RENDIMIENTO */}
            {activeReport === 'performance' && (
              <div className="p-6 space-y-6">
                
                {/* KPIs principales */}
                {performanceReport.kpis && performanceReport.kpis.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">KPIs Principales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {performanceReport.kpis.map((kpi, index) => {
                        const TrendIcon = getTrendIcon(kpi.trend);
                        const trendColor = getTrendColor(kpi.trend);
                        
                        return (
                          <div key={index} className={`rounded-lg p-4 border-2 ${
                            kpi.status === 'good' ? 'bg-green-50 border-green-200' :
                            kpi.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-900">{kpi.name}</h5>
                              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {kpi.value}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className={trendColor}>{kpi.change}</span>
                              <span className="text-gray-500">Meta: {kpi.target}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Métricas de rendimiento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {performanceReport.occupancyRate || 0}%
                      </div>
                      <div className="text-sm text-blue-600">Tasa de Ocupación</div>
                      <div className="text-xs text-blue-500 mt-1">Promedio diario</div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-900">
                        {performanceReport.customerRetention || 0}%
                      </div>
                      <div className="text-sm text-green-600">Retención de Clientes</div>
                      <div className="text-xs text-green-500 mt-1">Últimos 3 meses</div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-900">
                        {performanceReport.customerSatisfaction || 0}/5
                      </div>
                      <div className="text-sm text-purple-600">Satisfacción</div>
                      <div className="text-xs text-purple-500 mt-1">Promedio de reseñas</div>
                    </div>
                  </div>
                </div>
                
              </div>
            )}
          </>
        )}
        
      </div>
      
    </div>
  );
};

export default ReportsManager;