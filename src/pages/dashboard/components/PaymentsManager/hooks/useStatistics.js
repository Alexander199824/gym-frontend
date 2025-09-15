// src/pages/dashboard/components/PaymentsManager/hooks/useStatistics.js
// Author: Alexander Echeverria
// Hook personalizado para manejar estadísticas financieras y dashboard de resumen
// Incluye métricas de ingresos, gastos y análisis financiero por períodos

import { useState, useEffect } from 'react';
import apiService from '../../../../../services/apiService';

const useStatistics = () => {
  // Estados principales de estadísticas
  const [statistics, setStatistics] = useState({});
  const [financialDashboard, setFinancialDashboard] = useState({});
  const [pendingDashboard, setPendingDashboard] = useState({});
  const [loading, setLoading] = useState(false);

  // Función para cargar estadísticas generales de pagos
  const loadStatistics = async () => {
    try {
      console.log('Cargando estadísticas de pagos...');
      setLoading(true);
      
      const response = await apiService.paymentService.getPaymentStatistics();
      setStatistics(response?.data || {});
      
      console.log('Estadísticas de pagos cargadas');
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setStatistics({});
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar dashboard financiero
  const loadFinancialDashboard = async () => {
    try {
      console.log('Cargando dashboard financiero...');
      
      const response = await apiService.paymentService.getFinancialDashboard();
      setFinancialDashboard(response?.data || {});
      
      console.log('Dashboard financiero cargado');
    } catch (error) {
      console.error('Error cargando dashboard financiero:', error);
      setFinancialDashboard({});
    }
  };

  // Función para cargar dashboard de pendientes
  const loadPendingDashboard = async () => {
    try {
      console.log('Cargando dashboard de pendientes...');
      
      const response = await apiService.paymentService.getPendingPaymentsDashboard();
      setPendingDashboard(response?.data || {});
      
      console.log('Dashboard de pendientes cargado');
    } catch (error) {
      console.error('Error cargando dashboard de pendientes:', error);
      setPendingDashboard({});
    }
  };

  // Función para obtener métricas principales
  const getMainMetrics = () => {
    return {
      totalIncome: statistics.totalIncome || 0,
      totalPayments: statistics.totalPayments || 0,
      averagePayment: statistics.averagePayment || 0,
      monthlyGrowth: statistics.monthlyGrowth || 0,
      completedTransactions: statistics.completedTransactions || 0,
      pendingTransactions: statistics.pendingTransactions || 0,
      failedTransactions: statistics.failedTransactions || 0
    };
  };

  // Función para obtener métricas por método de pago
  const getPaymentMethodMetrics = () => {
    return {
      cash: statistics.cashPayments || 0,
      card: statistics.cardPayments || 0,
      transfer: statistics.transferPayments || 0,
      mobile: statistics.mobilePayments || 0
    };
  };

  // Función para obtener métricas por período
  const getPeriodMetrics = () => {
    return {
      today: financialDashboard.today || { income: 0, expenses: 0, net: 0 },
      thisWeek: financialDashboard.thisWeek || { income: 0, expenses: 0, net: 0 },
      thisMonth: financialDashboard.thisMonth || { income: 0, expenses: 0, net: 0 },
      thisYear: financialDashboard.thisYear || { income: 0, expenses: 0, net: 0 }
    };
  };

  // Función para calcular tendencias
  const getTrends = () => {
    const periods = getPeriodMetrics();
    
    return {
      dailyTrend: calculateTrend(periods.today.income, statistics.avgDailyIncome || 0),
      weeklyTrend: calculateTrend(periods.thisWeek.income, statistics.avgWeeklyIncome || 0),
      monthlyTrend: calculateTrend(periods.thisMonth.income, statistics.avgMonthlyIncome || 0)
    };
  };

  // Función auxiliar para calcular tendencia
  const calculateTrend = (current, average) => {
    if (average === 0) return { percentage: 0, direction: 'neutral' };
    
    const percentage = ((current - average) / average) * 100;
    const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral';
    
    return { percentage: Math.abs(percentage), direction };
  };

  // Función para obtener datos de resumen
  const getSummaryData = () => {
    const mainMetrics = getMainMetrics();
    const periodMetrics = getPeriodMetrics();
    const paymentMethods = getPaymentMethodMetrics();
    const trends = getTrends();

    return {
      mainMetrics,
      periodMetrics,
      paymentMethods,
      trends,
      pendingDashboard
    };
  };

  // Función para obtener estadísticas de rendimiento
  const getPerformanceStats = () => {
    return {
      conversionRate: statistics.conversionRate || 0,
      averageProcessingTime: statistics.averageProcessingTime || 0,
      successRate: statistics.successRate || 0,
      customerSatisfaction: statistics.customerSatisfaction || 0
    };
  };

  // Función para cargar todos los datos
  const loadAllStatistics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStatistics(),
        loadFinancialDashboard(),
        loadPendingDashboard()
      ]);
    } catch (error) {
      console.error('Error cargando estadísticas completas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Efecto inicial de carga
  useEffect(() => {
    loadAllStatistics();
  }, []);

  return {
    // Estados principales
    statistics,
    financialDashboard,
    pendingDashboard,
    loading,
    
    // Funciones de carga
    loadStatistics,
    loadFinancialDashboard,
    loadPendingDashboard,
    loadAllStatistics,
    
    // Funciones de métricas
    getMainMetrics,
    getPaymentMethodMetrics,
    getPeriodMetrics,
    getTrends,
    getSummaryData,
    getPerformanceStats
  };
};

export default useStatistics;

// Este hook encapsula toda la lógica relacionada con estadísticas y métricas financieras
// Maneja el dashboard de resumen, métricas por períodos y análisis de tendencias
// Proporciona datos organizados para diferentes vistas de reporting financiero