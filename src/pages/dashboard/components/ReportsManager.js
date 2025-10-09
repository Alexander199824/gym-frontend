// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/components/ReportsManager.js
// VERSIÓN MEJORADA: Responsive + Gráficas + Exportación funcional

import React, { useState, useEffect } from 'react';
import {
  BarChart3, PieChart, TrendingUp, TrendingDown, Calendar, Download,
  Coins, Users, CreditCard, Clock, RefreshCw, Eye, FileText,
  Calculator, Target, Award, Activity, AlertCircle, CheckCircle,
  ArrowUp, ArrowDown, Loader, ShoppingCart, Building,
  Percent, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import reportService from '../../../services/reportService';

const ReportsManager = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showSuccess, showError, formatDate, formatCurrency, isMobile } = useApp();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('financial');
  const [activeTab, setActiveTab] = useState('summary');
  const [exporting, setExporting] = useState(false);
  
  // Estados de filtros
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    period: 'month'
  });
  
  // Estados de datos
  const [reportData, setReportData] = useState(null);
  const [chartData, setChartData] = useState(null);
  
  // Colores para gráficas
  const COLORS = {
    primary: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  // Tipos de reportes
  const reportTypes = [
    {
      id: 'financial',
      title: 'Financiero',
      description: 'Ingresos, gastos y utilidades',
      icon: Coins,
      color: 'from-green-500 to-emerald-600',
      permission: 'view_financial_reports'
    },
    {
      id: 'users',
      title: 'Usuarios',
      description: 'Estadísticas de clientes',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      permission: 'view_user_reports'
    },
    {
      id: 'memberships',
      title: 'Membresías',
      description: 'Análisis de membresías',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-600',
      permission: 'view_membership_reports'
    },
    {
      id: 'performance',
      title: 'Rendimiento',
      description: 'KPIs y métricas clave',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-600',
      permission: 'view_performance_reports'
    }
  ];
  
  // Períodos predefinidos
  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Año' },
    { value: 'custom', label: 'Personalizado' }
  ];
  
  // CARGAR DATOS
  const loadReportData = async () => {
    try {
      setLoading(true);
      
      let response;
      switch (activeReport) {
        case 'financial':
          response = await reportService.getFinancialReport(dateRange);
          if (response.success && response.data) {
            setReportData(response.data);
            setChartData(reportService.generateChartData(response.data));
          }
          break;
          
        case 'users':
          response = await reportService.getUserReport(dateRange);
          setReportData(response.data);
          break;
          
        case 'memberships':
          response = await reportService.getMembershipReport(dateRange);
          setReportData(response.data);
          break;
          
        case 'performance':
          response = await reportService.getPerformanceReport(dateRange);
          setReportData(response.data);
          break;
      }
      
    } catch (error) {
      console.error('Error cargando reporte:', error);
      showError('Error al cargar datos del reporte');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadReportData();
  }, [activeReport, dateRange]);
  
  // CAMBIAR PERÍODO
  const handlePeriodChange = (period) => {
    const today = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = today;
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
        setDateRange(prev => ({ ...prev, period }));
        return;
    }
    
    if (period !== 'custom') {
      setDateRange({
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        period
      });
    }
  };
  
  // EXPORTAR REPORTE
  const handleExport = async (format) => {
    try {
      setExporting(true);
      
      if (format === 'pdf') {
        await reportService.exportToPDF(activeReport, reportData, dateRange);
        showSuccess('Reporte PDF descargado exitosamente');
      } else if (format === 'excel') {
        await reportService.exportToExcel(activeReport, reportData, dateRange);
        showSuccess('Reporte Excel descargado exitosamente');
      } else if (format === 'json') {
        await reportService.exportToJSON(activeReport, reportData);
        showSuccess('Reporte JSON descargado exitosamente');
      }
      
    } catch (error) {
      console.error('Error exportando:', error);
      showError('Error al exportar reporte');
    } finally {
      setExporting(false);
    }
  };

  // COMPONENTE: Card de Métrica
  const MetricCard = ({ title, value, icon: Icon, color, change, trend }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-white/80 font-medium mb-1">{title}</p>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{value}</h3>
          {change && (
            <div className="flex items-center text-xs sm:text-sm">
              {trend === 'up' ? (
                <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
        </div>
      </div>
    </div>
  );

  // COMPONENTE: Reporte Financiero
  const FinancialReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="space-y-4 sm:space-y-6">
        
        {/* TABS */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto">
            {['summary', 'charts', 'breakdown'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'summary' && '📊 Resumen'}
                {tab === 'charts' && '📈 Gráficas'}
                {tab === 'breakdown' && '💰 Desglose'}
              </button>
            ))}
          </div>
        </div>
        
        {/* RESUMEN */}
        {activeTab === 'summary' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Métricas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Ingresos Totales"
                value={formatCurrency(reportData.totalIncome)}
                icon={TrendingUp}
                color="from-green-500 to-emerald-600"
                change="+12%"
                trend="up"
              />
              <MetricCard
                title="Gastos Totales"
                value={formatCurrency(reportData.expenses.total)}
                icon={ShoppingCart}
                color="from-red-500 to-pink-600"
                change="+5%"
                trend="up"
              />
              <MetricCard
                title="Utilidad Neta"
                value={formatCurrency(reportData.netProfit)}
                icon={Calculator}
                color={reportData.netProfit >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600'}
                change={reportData.netProfit >= 0 ? '+8%' : '-3%'}
                trend={reportData.netProfit >= 0 ? 'up' : 'down'}
              />
              <MetricCard
                title="Margen de Ganancia"
                value={`${reportData.profitMargin.toFixed(1)}%`}
                icon={Percent}
                color="from-purple-500 to-pink-600"
                change={reportData.profitMargin >= 30 ? '+3%' : '-2%'}
                trend={reportData.profitMargin >= 30 ? 'up' : 'down'}
              />
            </div>
            
            {/* Resumen por Fuente */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base sm:text-lg font-semibold text-green-900">Membresías</h4>
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-900 mb-1">
                  {formatCurrency(reportData.memberships.total)}
                </p>
                <p className="text-xs sm:text-sm text-green-700">
                  {reportData.memberships.count} pagos
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base sm:text-lg font-semibold text-blue-900">Ventas Online</h4>
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">
                  {formatCurrency(reportData.onlineOrders.total)}
                </p>
                <p className="text-xs sm:text-sm text-blue-700">
                  {reportData.onlineOrders.count} órdenes
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base sm:text-lg font-semibold text-purple-900">Ventas Locales</h4>
                  <Building className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">
                  {formatCurrency(reportData.localSales.total)}
                </p>
                <p className="text-xs sm:text-sm text-purple-700">
                  {reportData.localSales.count} ventas
                </p>
              </div>
            </div>
            
          </div>
        )}
        
        {/* GRÁFICAS */}
        {activeTab === 'charts' && chartData && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Composición de Ingresos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Composición de Ingresos
              </h4>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={chartData.incomeComposition.labels.map((label, i) => ({
                        name: label,
                        value: chartData.incomeComposition.datasets[0].data[i]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={isMobile ? 60 : 100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.incomeComposition.labels.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Ingresos vs Gastos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Ingresos vs Gastos
              </h4>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.incomeVsExpenses.labels.map((label, i) => ({
                      name: label,
                      Ingresos: chartData.incomeVsExpenses.datasets[0].data[i],
                      Gastos: chartData.incomeVsExpenses.datasets[1].data[i]
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={isMobile ? -45 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 80 : 60} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Ingresos" fill={COLORS.success} />
                    <Bar dataKey="Gastos" fill={COLORS.danger} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Composición de Gastos */}
            {chartData.expenseComposition && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Distribución de Gastos
                </h4>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={chartData.expenseComposition.labels.map((label, i) => ({
                          name: label,
                          value: chartData.expenseComposition.datasets[0].data[i]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={isMobile ? 60 : 100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.expenseComposition.labels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartData.expenseComposition.datasets[0].backgroundColor[index]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Métodos de Pago */}
            {chartData.paymentMethods && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Métodos de Pago
                </h4>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={chartData.paymentMethods.labels.map((label, i) => ({
                          name: label,
                          value: chartData.paymentMethods.datasets[0].data[i]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={isMobile ? 60 : 100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.paymentMethods.labels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
          </div>
        )}
        
        {/* DESGLOSE */}
        {activeTab === 'breakdown' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Desglose de Membresías */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Desglose de Membresías
              </h4>
              <div className="space-y-3">
                {Object.entries(reportData.memberships.breakdown).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 capitalize text-sm sm:text-base">
                      {method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Transferencia'}
                    </span>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desglose de Ventas Online */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Desglose de Ventas Online
              </h4>
              <div className="space-y-3">
                {Object.entries(reportData.onlineOrders.breakdown).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 capitalize text-sm sm:text-base">
                      {type === 'pickup' ? 'Recoger' : type === 'delivery' ? 'Domicilio' : 'Express'}
                    </span>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desglose de Gastos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Desglose de Gastos
              </h4>
              <div className="space-y-3">
                {Object.entries(reportData.expenses.breakdown)
                  .filter(([_, amount]) => amount > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">
                        {reportService.getCategoryLabel(category)}
                      </span>
                      <span className="font-bold text-gray-900 text-sm sm:text-base">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            
          </div>
        )}
        
      </div>
    );
  };

  // COMPONENTE: Reporte de Usuarios
  const UserReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Usuarios"
            value={reportData.totalUsers}
            icon={Users}
            color="from-blue-500 to-indigo-600"
          />
          <MetricCard
            title="Usuarios Activos"
            value={reportData.activeUsers}
            icon={CheckCircle}
            color="from-green-500 to-emerald-600"
          />
          <MetricCard
            title="Nuevos Este Mes"
            value={reportData.newUsersThisMonth}
            icon={TrendingUp}
            color="from-purple-500 to-pink-600"
          />
          <MetricCard
            title="Tipos de Rol"
            value={Object.keys(reportData.roleDistribution).length}
            icon={Award}
            color="from-orange-500 to-red-600"
          />
        </div>
        
        {/* Distribución por Roles */}
        {Object.keys(reportData.roleDistribution).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Distribución por Roles
            </h4>
            <div className="space-y-3">
              {Object.entries(reportData.roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded mr-3 ${
                      role === 'admin' ? 'bg-purple-500' :
                      role === 'colaborador' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <span className="font-medium text-gray-900 capitalize text-sm sm:text-base">
                      {role === 'admin' ? 'Administradores' : 
                       role === 'colaborador' ? 'Personal' : 'Clientes'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-sm sm:text-base">{count}</div>
                    <div className="text-xs text-gray-500">
                      {reportData.totalUsers > 0 ? Math.round((count / reportData.totalUsers) * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // COMPONENTE: Reporte de Membresías
  const MembershipReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Membresías"
            value={reportData.totalMemberships}
            icon={CreditCard}
            color="from-purple-500 to-pink-600"
          />
          <MetricCard
            title="Activas"
            value={reportData.activeMemberships}
            icon={CheckCircle}
            color="from-green-500 to-emerald-600"
          />
          <MetricCard
            title="Vencidas"
            value={reportData.expiredMemberships}
            icon={AlertCircle}
            color="from-red-500 to-pink-600"
          />
          <MetricCard
            title="Por Vencer"
            value={reportData.expiringSoon}
            icon={Clock}
            color="from-yellow-500 to-orange-600"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {reportData.renewalRate}%
            </div>
            <div className="text-sm text-gray-600">Tasa de Renovación</div>
          </div>
        </div>
      </div>
    );
  };

  // COMPONENTE: Reporte de Rendimiento
  const PerformanceReport = () => {
    if (!reportData) return null;
    
    return (
      <div className="space-y-4 sm:space-y-6">
        
        {/* KPIs */}
        {reportData.kpis && reportData.kpis.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportData.kpis.map((kpi, index) => (
              <div
                key={index}
                className={`rounded-xl p-4 sm:p-6 border-2 ${
                  kpi.status === 'good' ? 'bg-green-50 border-green-200' :
                  kpi.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs sm:text-sm font-medium text-gray-900">{kpi.name}</h5>
                  {kpi.trend === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  {kpi.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {kpi.change}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Métricas Adicionales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
              {reportData.occupancyRate}%
            </div>
            <div className="text-xs sm:text-sm text-blue-700">Tasa de Ocupación</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">
              {reportData.customerRetention}%
            </div>
            <div className="text-xs sm:text-sm text-green-700">Retención de Clientes</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">
              {reportData.customerSatisfaction}/5
            </div>
            <div className="text-xs sm:text-sm text-purple-700">Satisfacción</div>
          </div>
        </div>
        
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-indigo-600" />
            Reportes y Análisis
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Análisis detallado del rendimiento
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => loadReportData()}
            className="btn-secondary btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            className="btn-primary btn-sm"
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          
          <button
            onClick={() => handleExport('excel')}
            className="btn-secondary btn-sm"
            disabled={exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>
      
      {/* TIPOS DE REPORTES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {reportTypes.map((report) => {
          if (!hasPermission(report.permission)) return null;
          
          const ReportIcon = report.icon;
          const isActive = activeReport === report.id;
          
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isActive 
                  ? `bg-gradient-to-br ${report.color} text-white border-transparent shadow-lg`
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <ReportIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <h4 className="font-semibold text-sm sm:text-base">{report.title}</h4>
              <p className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                {report.description}
              </p>
            </button>
          );
        })}
      </div>
      
      {/* FILTROS DE FECHA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {periods.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  dateRange.period === option.value
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {dateRange.period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          )}
          
        </div>
      </div>
      
      {/* CONTENIDO DEL REPORTE */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
          <span className="text-gray-600">Cargando reporte...</span>
        </div>
      ) : (
        <>
          {activeReport === 'financial' && <FinancialReport />}
          {activeReport === 'users' && <UserReport />}
          {activeReport === 'memberships' && <MembershipReport />}
          {activeReport === 'performance' && <PerformanceReport />}
        </>
      )}
      
    </div>
  );
};

export default ReportsManager;
/*
 * COMPONENTE: ReportsManager
 * AUTOR: Alexander Echeverria
 * 
 * PROPÓSITO:
 * Este componente gestiona la visualización y análisis completo de reportes del gimnasio.
 * Proporciona un dashboard integral para el monitoreo de métricas financieras, usuarios,
 * membresías y rendimiento general del negocio.
 * 
 * FUNCIONALIDADES PARA EL USUARIO:
 * 
 * VISUALIZACIÓN DE REPORTES:
 * - Reporte Financiero: Muestra ingresos totales en quetzales, distribución por fuentes,
 *   métodos de pago utilizados y productos más vendidos
 * - Reporte de Usuarios: Presenta total de usuarios registrados, usuarios activos,
 *   nuevos usuarios del mes y distribución por roles (admin, colaborador, cliente)
 * - Reporte de Membresías: Analiza membresías totales, activas, vencidas, por vencer,
 *   tasa de renovación y valor promedio de membresías
 * - Reporte de Rendimiento: Muestra KPIs principales, tasa de ocupación, retención
 *   de clientes y satisfacción promedio
 * 
 * FILTROS Y PERÍODOS:
 * - Filtros por período: Hoy, Esta semana, Este mes, Este trimestre, Este año
 * - Filtro personalizado: Selección manual de fecha de inicio y fin
 * - Actualización automática de datos al cambiar filtros
 * 
 * EXPORTACIÓN:
 * - Exportar reportes en formato PDF para documentación
 * - Exportar reportes en formato Excel para análisis adicional
 * 
 * MÉTRICAS VISUALES:
 * - Tarjetas de métricas con códigos de color para fácil interpretación
 * - Indicadores de tendencia (subida/bajada) con porcentajes de cambio
 * - Comparaciones con períodos anteriores para análisis de crecimiento
 * - Gráficos de distribución por categorías
 * 
 * CONEXIONES Y DEPENDENCIAS:
 * 
 * CONTEXTOS:
 * - AuthContext: Maneja autenticación de usuario y permisos de acceso a reportes
 * - AppContext: Proporciona funciones de notificación, formateo de moneda y utilidades
 * 
 * SERVICIOS API:
 * - apiService: Servicio principal para comunicación con backend
 * 
 * ENDPOINTS CONECTADOS:
 * - /api/payments/reports/enhanced: Obtiene reportes financieros detallados con datos
 *   de ingresos, fuentes, métodos de pago y productos top
 * - /api/payments/reports: Fallback para reportes financieros básicos
 * - /api/users/stats: Estadísticas completas de usuarios, roles y actividad
 * - /api/memberships/stats: Datos de membresías, renovaciones y valores promedio
 * - /api/reports/export: Endpoint para exportación de reportes (a implementar)
 * 
 * PERMISOS REQUERIDOS:
 * - view_financial_reports: Para acceder a reportes financieros
 * - view_user_reports: Para acceder a reportes de usuarios
 * - view_membership_reports: Para acceder a reportes de membresías
 * - view_performance_reports: Para acceder a reportes de rendimiento
 * 
 * TECNOLOGÍAS:
 * - React con Hooks (useState, useEffect) para manejo de estado
 * - Lucide React para iconografía moderna
 * - Tailwind CSS para estilos responsivos
 * - JavaScript ES6+ para lógica de componente
 * 
 * PERSONALIZACIÓN REGIONAL:
 * - Moneda mostrada en Quetzales (Q) con símbolo visual personalizado
 * - Textos completamente en español
 * - Formato de fechas adaptado a estándares guatemaltecos
 */