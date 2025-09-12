// Autor: Alexander Echeverria
// src/components/payments/PaymentReportsDashboard.js
// FUNCIÓN: Dashboard de reportes y estadísticas financieras del gimnasio
// USO: Análisis financiero, reportes de ingresos y métricas de pagos

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Bird,
  CreditCard,
  Banknote,
  Building,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  DollarSign,
  Target,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { usePaymentStats } from '../../hooks/usePayments';
import PaymentChart, { MiniPaymentChart } from '../dashboard/PaymentChart';
import { PAYMENT_METHODS, PAYMENT_TYPES, CURRENCY_CONFIG } from '../../config/paymentConfig';
import apiService from '../../services/apiService';

const PaymentReportsDashboard = () => {
  const { user, hasPermission } = useAuth();
  const { formatDate, formatCurrency, isMobile, showSuccess, showError } = useApp();
  
  // Estados principales
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'doughnut'
  const [loading, setLoading] = useState(false);
  const [detailedStats, setDetailedStats] = useState({});
  const [comparisonData, setComparisonData] = useState({});
  
  // Hook para estadísticas
  const { stats, loading: statsLoading, reload } = usePaymentStats(
    selectedPeriod === 'custom' ? customDateRange : {},
    true
  );

  // Períodos predefinidos
  const periods = [
    { value: 'today', label: 'Hoy', days: 1 },
    { value: 'week', label: 'Esta Semana', days: 7 },
    { value: 'month', label: 'Este Mes', days: 30 },
    { value: 'quarter', label: 'Trimestre', days: 90 },
    { value: 'year', label: 'Este Año', days: 365 },
    { value: 'custom', label: 'Personalizado', days: 0 }
  ];

  // CARGAR ESTADÍSTICAS DETALLADAS
  const loadDetailedStats = async () => {
    try {
      setLoading(true);
      
      const dateRange = selectedPeriod === 'custom' ? customDateRange : getDateRangeForPeriod(selectedPeriod);
      
      // Cargar múltiples endpoints para estadísticas completas
      const [paymentsResponse, movementsResponse] = await Promise.all([
        apiService.getPaymentStatistics(dateRange),
        apiService.getMovementsWithPayments({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: 100
        })
      ]);

      setDetailedStats(paymentsResponse.data || {});
      
      // Cargar datos de comparación (período anterior)
      const comparisonRange = getComparisonDateRange(dateRange);
      const comparisonResponse = await apiService.getPaymentStatistics(comparisonRange);
      setComparisonData(comparisonResponse.data || {});
      
    } catch (error) {
      console.error('Error al cargar estadísticas detalladas:', error);
      showError('Error al cargar estadísticas detalladas');
    } finally {
      setLoading(false);
    }
  };

  // Obtener rango de fechas para período
  const getDateRangeForPeriod = (period) => {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return customDateRange;
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  };

  // Obtener rango de fechas para comparación
  const getComparisonDateRange = (currentRange) => {
    const start = new Date(currentRange.startDate);
    const end = new Date(currentRange.endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    const comparisonEnd = new Date(start);
    comparisonEnd.setDate(comparisonEnd.getDate() - 1);
    
    const comparisonStart = new Date(comparisonEnd);
    comparisonStart.setDate(comparisonStart.getDate() - diffDays);
    
    return {
      startDate: comparisonStart.toISOString().split('T')[0],
      endDate: comparisonEnd.toISOString().split('T')[0]
    };
  };

  // CALCULAR MÉTRICAS COMPARATIVAS
  const getComparisonMetrics = () => {
    const current = stats;
    const previous = comparisonData;
    
    const calculateChange = (currentValue, previousValue) => {
      if (!previousValue || previousValue === 0) return { value: 0, percentage: 0, trend: 'neutral' };
      
      const change = currentValue - previousValue;
      const percentage = (change / previousValue) * 100;
      const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      
      return { value: change, percentage, trend };
    };

    return {
      totalIncome: calculateChange(current.totalIncome || 0, previous.totalIncome || 0),
      totalPayments: calculateChange(current.totalPayments || 0, previous.totalPayments || 0),
      averagePayment: calculateChange(current.averagePayment || 0, previous.averagePayment || 0),
      completionRate: calculateChange(
        (current.completedPayments || 0) / (current.totalPayments || 1) * 100,
        (previous.completedPayments || 0) / (previous.totalPayments || 1) * 100
      )
    };
  };

  // EXPORTAR REPORTE
  const exportReport = async (format = 'csv') => {
    try {
      setLoading(true);
      
      const dateRange = selectedPeriod === 'custom' ? customDateRange : getDateRangeForPeriod(selectedPeriod);
      
      const response = await apiService.get('/payments/export', {
        params: {
          format,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        responseType: 'blob'
      });
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_pagos_${selectedPeriod}_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Reporte exportado exitosamente`);
      
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      showError('Error al exportar reporte');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al cambiar período
  useEffect(() => {
    loadDetailedStats();
  }, [selectedPeriod, customDateRange]);

  // Verificar permisos
  if (!hasPermission('view_payment_reports')) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">
            No tienes permisos para ver reportes de pagos.
          </p>
        </div>
      </div>
    );
  }

  const comparisonMetrics = getComparisonMetrics();

  // FUNCIÓN PARA OBTENER ICONO DE TENDENCIA
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CON CONTROLES */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
            Reportes Financieros
          </h2>
          <p className="text-gray-600 mt-1">
            Análisis de ingresos y estadísticas de pagos en quetzales guatemaltecos
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={reload}
            disabled={loading || statsLoading}
            className="btn-secondary btn-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          {hasPermission('export_payment_data') && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportReport('csv')}
                disabled={loading}
                className="btn-primary btn-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </button>
              
              <button
                onClick={() => exportReport('pdf')}
                disabled={loading}
                className="btn-primary btn-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTROS DE PERÍODO */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          
          {/* Selector de período */}
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Fecha personalizada */}
          {selectedPeriod === 'custom' && (
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          {/* Tipo de gráfico */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="line">Gráfico de Líneas</option>
            <option value="bar">Gráfico de Barras</option>
            <option value="doughnut">Gráfico de Dona</option>
          </select>
        </div>
      </div>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Ingresos totales */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Bird className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center">
              {getTrendIcon(comparisonMetrics.totalIncome.trend)}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-green-700">Ingresos Totales</h3>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(stats.totalIncome || 0)}
            </p>
            
            <div className="flex items-center text-sm">
              <span className={getTrendColor(comparisonMetrics.totalIncome.trend)}>
                {comparisonMetrics.totalIncome.percentage > 0 ? '+' : ''}
                {comparisonMetrics.totalIncome.percentage.toFixed(1)}%
              </span>
              <span className="text-gray-600 ml-2">vs período anterior</span>
            </div>
          </div>
          
          {/* Mini gráfico */}
          <div className="mt-4 h-10">
            <MiniPaymentChart data={stats.dailyIncome || []} color="#16a34a" />
          </div>
        </div>

        {/* Total de pagos */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center">
              {getTrendIcon(comparisonMetrics.totalPayments.trend)}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-blue-700">Total de Transacciones</h3>
            <p className="text-2xl font-bold text-blue-900">
              {stats.totalPayments || 0}
            </p>
            
            <div className="flex items-center text-sm">
              <span className={getTrendColor(comparisonMetrics.totalPayments.trend)}>
                {comparisonMetrics.totalPayments.percentage > 0 ? '+' : ''}
                {comparisonMetrics.totalPayments.percentage.toFixed(1)}%
              </span>
              <span className="text-gray-600 ml-2">vs período anterior</span>
            </div>
          </div>
        </div>

        {/* Ticket promedio */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center">
              {getTrendIcon(comparisonMetrics.averagePayment.trend)}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-purple-700">Ticket Promedio</h3>
            <p className="text-2xl font-bold text-purple-900 flex items-center">
              <Bird className="w-5 h-5 mr-1" />
              {formatCurrency(stats.averagePayment || 0)}
            </p>
            
            <div className="flex items-center text-sm">
              <span className={getTrendColor(comparisonMetrics.averagePayment.trend)}>
                {comparisonMetrics.averagePayment.percentage > 0 ? '+' : ''}
                {comparisonMetrics.averagePayment.percentage.toFixed(1)}%
              </span>
              <span className="text-gray-600 ml-2">vs período anterior</span>
            </div>
          </div>
        </div>

        {/* Tasa de éxito */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center">
              {getTrendIcon(comparisonMetrics.completionRate.trend)}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-orange-700">Tasa de Éxito</h3>
            <p className="text-2xl font-bold text-orange-900">
              {stats.totalPayments ? 
                ((stats.completedPayments || 0) / stats.totalPayments * 100).toFixed(1) : 0
              }%
            </p>
            
            <div className="flex items-center text-sm">
              <span className={getTrendColor(comparisonMetrics.completionRate.trend)}>
                {comparisonMetrics.completionRate.percentage > 0 ? '+' : ''}
                {comparisonMetrics.completionRate.percentage.toFixed(1)}%
              </span>
              <span className="text-gray-600 ml-2">vs período anterior</span>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de ingresos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ingresos por Día
          </h3>
          
          <PaymentChart
            data={stats.dailyIncome || []}
            type={chartType}
            title=""
            height={300}
          />
        </div>

        {/* Distribución por método de pago */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Método de Pago
          </h3>
          
          <div className="space-y-4">
            {stats.incomeByMethod && stats.incomeByMethod.map((method) => {
              const config = PAYMENT_METHODS[method.method] || PAYMENT_METHODS.cash;
              const percentage = stats.totalIncome ? (method.amount / stats.totalIncome * 100) : 0;
              
              return (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                      <config.icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{config.label}</div>
                      <div className="text-xs text-gray-500">{method.count} transacciones</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 flex items-center">
                      <Bird className="w-3 h-3 mr-1 text-green-600" />
                      {formatCurrency(method.amount)}
                    </div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MÉTRICAS DETALLADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Pagos por estado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Estados de Pago
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completados</span>
              <span className="text-sm font-medium text-green-600">
                {stats.completedPayments || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pendientes</span>
              <span className="text-sm font-medium text-yellow-600">
                {stats.pendingPayments || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fallidos</span>
              <span className="text-sm font-medium text-red-600">
                {stats.failedPayments || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Clientes únicos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Clientes
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Clientes únicos</span>
              <span className="text-sm font-medium text-blue-600">
                {stats.uniqueClients || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nuevos clientes</span>
              <span className="text-sm font-medium text-green-600">
                {stats.newClients || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Clientes recurrentes</span>
              <span className="text-sm font-medium text-purple-600">
                {(stats.uniqueClients || 0) - (stats.newClients || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Tiempo promedio de procesamiento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            Tiempos de Procesamiento
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tiempo promedio</span>
              <span className="text-sm font-medium text-orange-600">
                {stats.averageProcessingTime || '0'}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Más rápido</span>
              <span className="text-sm font-medium text-green-600">
                {stats.fastestProcessingTime || '0'}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Más lento</span>
              <span className="text-sm font-medium text-red-600">
                {stats.slowestProcessingTime || '0'}h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* METAS Y OBJETIVOS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-purple-600" />
          Metas del Mes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Meta de ingresos */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-green-600"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min((stats.totalIncome || 0) / 15000 * 100, 100)}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">
                  {Math.min((stats.totalIncome || 0) / 15000 * 100, 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">Meta de Ingresos</div>
            <div className="text-xs text-gray-500">
              {formatCurrency(stats.totalIncome || 0)} / Q 15,000
            </div>
          </div>

          {/* Meta de transacciones */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min((stats.totalPayments || 0) / 200 * 100, 100)}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">
                  {Math.min((stats.totalPayments || 0) / 200 * 100, 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">Meta de Transacciones</div>
            <div className="text-xs text-gray-500">
              {stats.totalPayments || 0} / 200
            </div>
          </div>

          {/* Meta de clientes nuevos */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-600"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${Math.min((stats.newClients || 0) / 50 * 100, 100)}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">
                  {Math.min((stats.newClients || 0) / 50 * 100, 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">Meta de Nuevos Clientes</div>
            <div className="text-xs text-gray-500">
              {stats.newClients || 0} / 50
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReportsDashboard;

/*
DOCUMENTACIÓN DEL COMPONENTE PaymentReportsDashboard

PROPÓSITO:
Dashboard completo de reportes y análisis financiero para el gimnasio guatemalteco.
Proporciona métricas detalladas, comparaciones temporales, gráficos interactivos
y herramientas de exportación para análisis profundo de ingresos en quetzales.

FUNCIONALIDADES PRINCIPALES:

MÉTRICAS COMPARATIVAS:
- Ingresos totales con comparación vs período anterior
- Total de transacciones con tendencias
- Ticket promedio calculado automáticamente
- Tasa de éxito de pagos con porcentajes
- Indicadores visuales de tendencias (↑↓)

PERÍODOS DE ANÁLISIS:
- Hoy: Ingresos del día actual
- Esta Semana: Últimos 7 días
- Este Mes: Últimos 30 días
- Trimestre: Últimos 90 días
- Este Año: Últimos 365 días
- Personalizado: Rango de fechas específico

GRÁFICOS INTERACTIVOS:
- Gráfico de líneas para tendencias temporales
- Gráfico de barras para comparaciones
- Gráfico de dona para distribución por métodos
- Mini gráficos de tendencia en cada métrica
- Configuración dinámica del tipo de gráfico

DISTRIBUCIÓN POR MÉTODOS:
- Efectivo: Pagos realizados en recepción
- Tarjeta: Procesados con Stripe
- Transferencia: Transferencias bancarias guatemaltecas
- Pago móvil: En desarrollo
- Porcentajes y montos por método

MÉTRICAS DETALLADAS:
- Estados de pago (completados/pendientes/fallidos)
- Clientes únicos y nuevos clientes
- Clientes recurrentes calculados
- Tiempos de procesamiento promedio
- Métricas más rápida y más lenta

SISTEMA DE METAS:
- Meta de ingresos mensual (Q 15,000)
- Meta de transacciones (200 pagos)
- Meta de nuevos clientes (50 clientes)
- Indicadores circulares de progreso
- Porcentajes de cumplimiento

EXPORTACIÓN DE REPORTES:
- Exportar a CSV para análisis en Excel
- Exportar a PDF para presentaciones
- Filtros por rango de fechas
- Nombres de archivo únicos con timestamp

PROPS Y CONFIGURACIÓN:
- Períodos predefinidos configurables
- Rangos de fechas personalizables
- Tipos de gráfico intercambiables
- Metas ajustables por configuración

CONEXIONES CON OTROS ARCHIVOS:

HOOKS UTILIZADOS:
- usePaymentStats: Hook especializado para estadísticas
- useAuth: Verificación de permisos
- useApp: Formateo y notificaciones

SERVICIOS INTEGRADOS:
- apiService.getPaymentStatistics(): Estadísticas principales
- apiService.getMovementsWithPayments(): Movimientos detallados
- Endpoints de exportación para reportes

COMPONENTES IMPORTADOS:
- PaymentChart: Gráficos principales de ChartJS
- MiniPaymentChart: Mini gráficos de tendencia
- Configuraciones de PAYMENT_METHODS y PAYMENT_TYPES

PERMISOS REQUERIDOS:
- view_payment_reports: Para acceder al dashboard
- export_payment_data: Para exportar reportes
- Sin permisos muestra mensaje de acceso restringido

CARACTERÍSTICAS ESPECÍFICAS PARA GUATEMALA:

MONEDA QUETZAL:
- Todos los montos mostrados en quetzales (GTQ)
- Icono de ave quetzal en métricas principales
- Formateo apropiado con símbolo Q
- Metas en moneda local

ANÁLISIS FINANCIERO LOCAL:
- Metas adaptadas al mercado guatemalteco
- Rangos de ingresos realistas para gimnasios
- Análisis de métodos de pago preferidos localmente
- Consideración de patrones de pago locales

CÁLCULOS IMPLEMENTADOS:

COMPARACIONES TEMPORALES:
- Diferencia absoluta y porcentual vs período anterior
- Tendencias automáticas (subida/bajada/neutral)
- Períodos comparables calculados dinámicamente

MÉTRICAS DERIVADAS:
- Tasa de éxito: (completados / total) * 100
- Ticket promedio: total ingresos / total pagos
- Clientes recurrentes: únicos - nuevos
- Porcentajes de distribución por método

METAS DE CUMPLIMIENTO:
- Progreso hacia metas mensuales
- Cálculos de porcentaje de cumplimiento
- Indicadores visuales circulares SVG

CASOS DE USO OPERATIVOS:

ANÁLISIS DIARIO:
- Revisar ingresos del día vs metas
- Identificar métodos de pago más utilizados
- Monitorear tasa de éxito de transacciones
- Detectar tendencias en tiempo real

REPORTES MENSUALES:
- Generar reportes para administración
- Comparar rendimiento vs mes anterior
- Analizar distribución de clientes
- Exportar datos para contabilidad

TOMA DE DECISIONES:
- Identificar oportunidades de mejora
- Ajustar estrategias de pago
- Evaluar efectividad de promociones
- Planificar metas futuras

RESPONSIVIDAD:
- Vista optimizada para tablets y escritorio
- Gráficos responsivos que se adaptan
- Controles accesibles en móvil
- Exportación funciona en todos los dispositivos

BENEFICIOS PARA EL GIMNASIO:

VISIBILIDAD FINANCIERA:
- Comprensión completa de ingresos
- Identificación de patrones y tendencias
- Comparación objetiva de períodos
- Métricas claras de rendimiento

OPTIMIZACIÓN OPERATIVA:
- Identificación de métodos de pago preferidos
- Análisis de tiempos de procesamiento
- Detección de problemas en tiempo real
- Datos para mejorar procesos

PLANIFICACIÓN ESTRATÉGICA:
- Establecimiento de metas realistas
- Análisis de crecimiento de clientes
- Datos para proyecciones futuras
- Información para inversiones

Este dashboard es fundamental para la gestión financiera
del gimnasio, proporcionando insights accionables para
mejorar la rentabilidad y optimizar las operaciones
de pago en el contexto guatemalteco.
*/