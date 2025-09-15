// src/pages/dashboard/components/PaymentsManager/components/SummaryTab.js
// Author: Alexander Echeverria
// Componente del tab de resumen con métricas financieras y dashboard completo
// Muestra estadísticas generales, tendencias y análisis por períodos

import React from 'react';
import { 
  Bird, CreditCard, Building, TrendingUp, TrendingDown, 
  Calendar, Activity, Banknote, BarChart3 
} from 'lucide-react';

const SummaryTab = ({ 
  statistics = {},
  financialDashboard = {},
  pendingDashboard = {},
  getMainMetrics,
  getPaymentMethodMetrics,
  getPeriodMetrics,
  getTrends,
  getPerformanceStats,
  formatCurrency,
  formatDate 
}) => {

  // Obtener métricas principales con valores por defecto
  const mainMetrics = getMainMetrics ? getMainMetrics() : {
    totalIncome: statistics.totalIncome || 0,
    totalPayments: statistics.totalPayments || 0,
    averagePayment: statistics.averagePayment || 0,
    completedTransactions: statistics.completedTransactions || 0,
    failedTransactions: statistics.failedTransactions || 0
  };

  // Obtener métricas por método de pago
  const paymentMethods = getPaymentMethodMetrics ? getPaymentMethodMetrics() : {
    cash: statistics.cashPayments || 0,
    card: statistics.cardPayments || 0,
    transfer: statistics.transferPayments || 0,
    mobile: statistics.mobilePayments || 0
  };

  // Obtener métricas por período
  const periodMetrics = getPeriodMetrics ? getPeriodMetrics() : {
    today: financialDashboard.today || { income: 0, expenses: 0 },
    thisWeek: financialDashboard.thisWeek || { income: 0, expenses: 0 },
    thisMonth: financialDashboard.thisMonth || { income: 0, expenses: 0 }
  };

  // Obtener tendencias
  const trends = getTrends ? getTrends() : {
    dailyTrend: { percentage: 0, direction: 'neutral' },
    weeklyTrend: { percentage: 0, direction: 'neutral' },
    monthlyTrend: { percentage: 0, direction: 'neutral' }
  };

  // Obtener estadísticas de rendimiento
  const performanceStats = getPerformanceStats ? getPerformanceStats() : {
    successRate: statistics.successRate || 0,
    conversionRate: statistics.conversionRate || 0,
    averageProcessingTime: statistics.averageProcessingTime || 0,
    customerSatisfaction: statistics.customerSatisfaction || 0
  };

  // Función para obtener icono de tendencia
  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Función para obtener color de tendencia
  const getTrendColor = (direction) => {
    switch (direction) {
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
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Ingresos totales */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <Bird className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency && formatCurrency(mainMetrics.totalIncome)}
              </div>
              <div className="text-sm text-green-600">Ingresos Totales</div>
              {trends.monthlyTrend && (
                <div className={`text-xs flex items-center mt-1 ${getTrendColor(trends.monthlyTrend.direction)}`}>
                  {getTrendIcon(trends.monthlyTrend.direction)}
                  <span className="ml-1">{trends.monthlyTrend.percentage.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Total de transacciones */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-blue-900">
                {mainMetrics.totalPayments}
              </div>
              <div className="text-sm text-blue-600">Transacciones</div>
              <div className="text-xs text-blue-500 mt-1">
                {mainMetrics.completedTransactions} completadas
              </div>
            </div>
          </div>
        </div>
        
        {/* Promedio de pago */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency && formatCurrency(mainMetrics.averagePayment)}
              </div>
              <div className="text-sm text-orange-600">Promedio</div>
              <div className="text-xs text-orange-500 mt-1">
                por transacción
              </div>
            </div>
          </div>
        </div>
        
        {/* Tasa de éxito */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-purple-900">
                {(performanceStats.successRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-purple-600">Tasa de Éxito</div>
              <div className="text-xs text-purple-500 mt-1">
                transacciones exitosas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas por método de pago */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Métodos de Pago
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Efectivo */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Banknote className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {paymentMethods.cash}
            </div>
            <div className="text-sm text-green-600">Efectivo</div>
          </div>
          
          {/* Tarjeta */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">
              {paymentMethods.card}
            </div>
            <div className="text-sm text-blue-600">Tarjeta</div>
          </div>
          
          {/* Transferencia */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Building className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">
              {paymentMethods.transfer}
            </div>
            <div className="text-sm text-purple-600">Transferencia</div>
          </div>
          
          {/* Móvil */}
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">
              {paymentMethods.mobile}
            </div>
            <div className="text-sm text-orange-600">Móvil</div>
          </div>
        </div>
      </div>

      {/* Dashboard financiero por períodos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Hoy */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Hoy
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ingresos:</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency && formatCurrency(periodMetrics.today.income)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gastos:</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency && formatCurrency(periodMetrics.today.expenses)}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Neto:</span>
                <span className={`text-sm font-bold ${
                  (periodMetrics.today.income - periodMetrics.today.expenses) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency && formatCurrency(periodMetrics.today.income - periodMetrics.today.expenses)}
                </span>
              </div>
            </div>
            
            {trends.dailyTrend && (
              <div className={`text-xs flex items-center justify-center mt-2 ${getTrendColor(trends.dailyTrend.direction)}`}>
                {getTrendIcon(trends.dailyTrend.direction)}
                <span className="ml-1">{trends.dailyTrend.percentage.toFixed(1)}% vs promedio</span>
              </div>
            )}
          </div>
        </div>

        {/* Esta semana */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Esta Semana
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ingresos:</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency && formatCurrency(periodMetrics.thisWeek.income)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gastos:</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency && formatCurrency(periodMetrics.thisWeek.expenses)}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Neto:</span>
                <span className={`text-sm font-bold ${
                  (periodMetrics.thisWeek.income - periodMetrics.thisWeek.expenses) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency && formatCurrency(periodMetrics.thisWeek.income - periodMetrics.thisWeek.expenses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Este mes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Este Mes
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ingresos:</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency && formatCurrency(periodMetrics.thisMonth.income)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gastos:</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency && formatCurrency(periodMetrics.thisMonth.expenses)}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Neto:</span>
                <span className={`text-sm font-bold ${
                  (periodMetrics.thisMonth.income - periodMetrics.thisMonth.expenses) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency && formatCurrency(periodMetrics.thisMonth.income - periodMetrics.thisMonth.expenses)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de rendimiento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Métricas de Rendimiento
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          {/* Tasa de conversión */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {(performanceStats.conversionRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Tasa de Conversión</div>
          </div>
          
          {/* Tiempo promedio de procesamiento */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {performanceStats.averageProcessingTime.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600">Tiempo Procesamiento</div>
          </div>
          
          {/* Satisfacción del cliente */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {(performanceStats.customerSatisfaction * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Satisfacción Cliente</div>
          </div>
          
          {/* Transacciones fallidas */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {mainMetrics.failedTransactions}
            </div>
            <div className="text-sm text-gray-600">Transacciones Fallidas</div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="text-sm text-gray-600 text-center">
          Última actualización: {formatDate && formatDate(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
        
        {pendingDashboard && Object.keys(pendingDashboard).length > 0 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Dashboard actualizado automáticamente cada 5 minutos
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryTab;

// Este componente muestra el resumen financiero completo del sistema de pagos
// Incluye métricas principales, análisis por períodos, tendencias y rendimiento
// Proporciona una vista ejecutiva de todas las operaciones financieras