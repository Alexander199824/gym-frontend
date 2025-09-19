// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/ReportsManager.js
// FUNCIÓN: Generación y gestión de reportes de inventario y ventas
// ACTUALIZADO: Import CreditCard corregido

import React, { useState, useEffect } from 'react';
import {
  BarChart3, PieChart, TrendingUp, Download, Calendar,
  Filter, Eye, Share, FileText, Printer, Mail,
  Package, ShoppingBag, Coins, Users, Clock,
  Star, Award, Target, Activity, Zap, AlertTriangle,
  CreditCard // ✅ AGREGADO: Import faltante de CreditCard
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';

const ReportsManager = ({ inventoryData, period, onPeriodChange }) => {
  const { formatCurrency, formatDate, showSuccess, showError, isMobile } = useApp();
  
  // Estados locales
  const [activeReport, setActiveReport] = useState('sales');
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Tipos de reportes disponibles
  const reportTypes = [
    {
      id: 'sales',
      title: 'Reporte de Ventas',
      description: 'Análisis detallado de ventas por período',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'products',
      title: 'Reporte de Productos',
      description: 'Inventario y rotación de productos',
      icon: Package,
      color: 'blue'
    },
    {
      id: 'financial',
      title: 'Reporte Financiero',
      description: 'Ingresos, costos y rentabilidad',
      icon: Coins,
      color: 'yellow'
    },
    {
      id: 'customers',
      title: 'Reporte de Clientes',
      description: 'Análisis de comportamiento de clientes',
      icon: Users,
      color: 'purple'
    }
  ];
  
  // Generar datos del reporte según el tipo activo
  useEffect(() => {
    generateReportData();
  }, [activeReport, inventoryData, period, selectedDateRange]);
  
  const generateReportData = async () => {
    setIsGenerating(true);
    
    try {
      // Simular tiempo de generación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos base del inventario
      const stats = inventoryData?.stats?.data || {};
      const products = inventoryData?.products?.data || [];
      const sales = inventoryData?.sales?.data || [];
      
      let data;
      
      switch (activeReport) {
        case 'sales':
          data = generateSalesReport(stats, sales);
          break;
        case 'products':
          data = generateProductsReport(stats, products);
          break;
        case 'financial':
          data = generateFinancialReport(stats, sales);
          break;
        case 'customers':
          data = generateCustomersReport(sales);
          break;
        default:
          data = {};
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generando reporte:', error);
      showError('Error al generar el reporte');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generar reporte de ventas
  const generateSalesReport = (stats, sales) => ({
    summary: {
      totalSales: sales.length,
      totalRevenue: stats.salesThisMonth || 67000,
      averageTicket: stats.salesThisMonth > 0 ? (stats.salesThisMonth / sales.length) || 0 : 0,
      topSellingDay: 'Miércoles',
      growthRate: 15.3
    },
    breakdown: {
      daily: [
        { date: '2024-01-15', sales: 12, revenue: 3200 },
        { date: '2024-01-16', sales: 8, revenue: 2100 },
        { date: '2024-01-17', sales: 15, revenue: 4300 },
        { date: '2024-01-18', sales: 18, revenue: 5100 },
        { date: '2024-01-19', sales: 10, revenue: 2800 }
      ],
      byCategory: [
        { category: 'Suplementos', sales: 35, revenue: 8750, percentage: 42 },
        { category: 'Proteínas', sales: 28, revenue: 7000, percentage: 34 },
        { category: 'Ropa', sales: 15, revenue: 3750, percentage: 18 },
        { category: 'Accesorios', sales: 8, revenue: 1250, percentage: 6 }
      ],
      paymentMethods: [
        { method: 'Efectivo', count: 45, percentage: 52 },
        { method: 'Tarjeta', count: 32, percentage: 37 },
        { method: 'Transferencia', count: 9, percentage: 11 }
      ]
    }
  });
  
  // Generar reporte de productos
  const generateProductsReport = (stats, products) => ({
    summary: {
      totalProducts: stats.totalProducts || 0,
      inStock: (stats.totalProducts || 0) - (stats.outOfStockProducts || 0),
      lowStock: stats.lowStockProducts || 0,
      outOfStock: stats.outOfStockProducts || 0,
      totalValue: stats.totalValue || 0
    },
    topProducts: [
      { name: 'Proteína Whey Premium', sold: 25, revenue: 6250 },
      { name: 'Creatina Monohidratada', sold: 18, revenue: 1530 },
      { name: 'Pre-entreno Energía', sold: 12, revenue: 1440 },
      { name: 'BCAA Recovery', sold: 10, revenue: 750 },
      { name: 'Glutamina Pura', sold: 8, revenue: 640 }
    ],
    categoryPerformance: [
      { category: 'Suplementos', products: 15, averageRotation: 2.3 },
      { category: 'Proteínas', products: 8, averageRotation: 3.1 },
      { category: 'Ropa', products: 12, averageRotation: 1.2 },
      { category: 'Accesorios', products: 10, averageRotation: 0.8 }
    ],
    stockAlerts: products.filter(p => (p.stock || 0) <= (p.minStock || 5)).slice(0, 5)
  });
  
  // Generar reporte financiero
  const generateFinancialReport = (stats, sales) => ({
    summary: {
      totalRevenue: stats.salesThisMonth || 67000,
      totalCosts: 45000,
      grossProfit: (stats.salesThisMonth || 67000) - 45000,
      profitMargin: 32.8,
      operatingExpenses: 15000,
      netProfit: (stats.salesThisMonth || 67000) - 45000 - 15000
    },
    breakdown: {
      revenueByCategory: [
        { category: 'Suplementos', revenue: 28000, cost: 18000, profit: 10000 },
        { category: 'Proteínas', revenue: 22000, cost: 15000, profit: 7000 },
        { category: 'Ropa', revenue: 12000, cost: 8000, profit: 4000 },
        { category: 'Accesorios', revenue: 5000, cost: 4000, profit: 1000 }
      ],
      monthlyTrend: [
        { month: 'Octubre', revenue: 58000, profit: 18000 },
        { month: 'Noviembre', revenue: 62000, profit: 19500 },
        { month: 'Diciembre', revenue: 67000, profit: 22000 }
      ]
    }
  });
  
  // Generar reporte de clientes
  const generateCustomersReport = (sales) => ({
    summary: {
      totalCustomers: 245,
      newCustomers: 15,
      returningCustomers: 230,
      averageOrderValue: 285,
      customerLifetimeValue: 1250
    },
    topCustomers: [
      { name: 'María González', orders: 8, totalSpent: 2100 },
      { name: 'Carlos Ruiz', orders: 6, totalSpent: 1850 },
      { name: 'Ana Martínez', orders: 5, totalSpent: 1650 },
      { name: 'Luis Hernández', orders: 4, totalSpent: 1200 },
      { name: 'Patricia López', orders: 7, totalSpent: 1900 }
    ],
    demographics: {
      ageGroups: [
        { range: '18-25', count: 45, percentage: 18 },
        { range: '26-35', count: 95, percentage: 39 },
        { range: '36-45', count: 75, percentage: 31 },
        { range: '46+', count: 30, percentage: 12 }
      ],
      frequencySegments: [
        { segment: 'Clientes VIP', count: 25, criteria: '10+ compras' },
        { segment: 'Regulares', count: 85, criteria: '3-9 compras' },
        { segment: 'Ocasionales', count: 135, criteria: '1-2 compras' }
      ]
    }
  });
  
  // Exportar reporte
  const handleExportReport = (format) => {
    setIsGenerating(true);
    
    // Simular exportación
    setTimeout(() => {
      setIsGenerating(false);
      showSuccess(`Reporte exportado como ${format.toUpperCase()}`);
    }, 2000);
  };
  
  // Obtener colores para categorías
  const getCategoryColor = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      
      {/* SELECTOR DE TIPO DE REPORTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          const isActive = activeReport === report.id;
          
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(report.color)}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                {isActive && (
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                )}
              </div>
              
              <h3 className="font-medium text-gray-900 mb-1">
                {report.title}
              </h3>
              <p className="text-sm text-gray-600">
                {report.description}
              </p>
            </button>
          );
        })}
      </div>
      
      {/* CONTROLES DE REPORTE */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Rango de fechas:</span>
            </div>
            
            <input
              type="date"
              value={selectedDateRange.start}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            
            <span className="text-gray-500">-</span>
            
            <input
              type="date"
              value={selectedDateRange.end}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportReport('pdf')}
              disabled={isGenerating}
              className="btn-secondary btn-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </button>
            
            <button
              onClick={() => handleExportReport('excel')}
              disabled={isGenerating}
              className="btn-secondary btn-sm"
            >
              <FileText className="w-4 h-4 mr-1" />
              Excel
            </button>
            
            <button
              onClick={() => handleExportReport('print')}
              disabled={isGenerating}
              className="btn-secondary btn-sm"
            >
              <Printer className="w-4 h-4 mr-1" />
              Imprimir
            </button>
          </div>
          
        </div>
      </div>
      
      {/* CONTENIDO DEL REPORTE */}
      {isGenerating ? (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Activity className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Generando Reporte
            </h3>
            <p className="text-gray-600">
              Analizando datos y preparando el reporte...
            </p>
            <div className="mt-4 w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          
          {/* RESUMEN DEL REPORTE */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {reportTypes.find(r => r.id === activeReport)?.title}
              </h2>
              <span className="text-sm text-gray-500">
                Generado: {formatDate(new Date())}
              </span>
            </div>
            
            {/* Métricas del resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(reportData.summary || {}).map(([key, value], index) => {
                const labels = {
                  totalSales: 'Ventas Totales',
                  totalRevenue: 'Ingresos Totales',
                  totalProducts: 'Productos Totales',
                  totalCustomers: 'Clientes Totales',
                  averageTicket: 'Ticket Promedio',
                  grossProfit: 'Ganancia Bruta',
                  profitMargin: 'Margen (%)',
                  inStock: 'En Stock',
                  lowStock: 'Stock Bajo',
                  outOfStock: 'Sin Stock',
                  newCustomers: 'Nuevos Clientes',
                  growthRate: 'Crecimiento (%)'
                };
                
                const isMonetary = ['totalRevenue', 'averageTicket', 'grossProfit', 'totalValue', 'netProfit'].includes(key);
                const isPercentage = ['profitMargin', 'growthRate'].includes(key);
                
                let displayValue = value;
                if (isMonetary) {
                  displayValue = formatCurrency(value);
                } else if (isPercentage) {
                  displayValue = `${value}%`;
                }
                
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {displayValue}
                    </div>
                    <div className="text-sm text-gray-600">
                      {labels[key] || key}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* CONTENIDO ESPECÍFICO POR TIPO DE REPORTE */}
          {activeReport === 'sales' && reportData.breakdown && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Ventas por categoría */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ventas por Categoría
                </h3>
                <div className="space-y-3">
                  {reportData.breakdown.byCategory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-700">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.revenue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.percentage}% • {item.sales} ventas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Métodos de pago */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Métodos de Pago
                </h3>
                <div className="space-y-3">
                  {reportData.breakdown.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          method.method === 'Efectivo' ? 'bg-green-100' :
                          method.method === 'Tarjeta' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {method.method === 'Efectivo' ? (
                            <Coins className="w-4 h-4 text-green-600" />
                          ) : method.method === 'Tarjeta' ? (
                            <CreditCard className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {method.method}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {method.count}
                        </div>
                        <div className="text-xs text-gray-500">
                          {method.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          )}
          
          {/* Productos top (para reporte de productos) */}
          {activeReport === 'products' && reportData.topProducts && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Top 5 Productos Más Vendidos
              </h3>
              
              <div className="space-y-3">
                {reportData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {product.sold} unidades vendidas
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(product.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Selecciona un tipo de reporte
            </h3>
            <p className="text-gray-600">
              Elige el tipo de análisis que deseas generar
            </p>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ReportsManager;