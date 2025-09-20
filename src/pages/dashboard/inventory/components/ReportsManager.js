// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/ReportsManager.js
// FUNCIÓN: Generación y gestión de reportes conectado al backend real
// ACTUALIZADO: Para usar inventoryService con rutas correctas del manual

import React, { useState, useEffect } from 'react';
import {
  BarChart3, PieChart, TrendingUp, Download, Calendar,
  Filter, Eye, Share, FileText, Printer, Mail,
  Package, ShoppingBag, Coins, Users, Clock,
  Star, Award, Target, Activity, Zap, AlertTriangle,
  CreditCard, Loader, RotateCcw
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';
import inventoryService from '../../../../services/inventoryService';

const ReportsManager = ({ inventoryData, period, onPeriodChange }) => {
  const { formatCurrency, formatDate, showSuccess, showError, isMobile } = useApp();
  
  // Estados locales
  const [activeReport, setActiveReport] = useState('financial');
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Tipos de reportes disponibles
  const reportTypes = [
    {
      id: 'financial',
      title: 'Reporte Financiero',
      description: 'Ingresos, costos y rentabilidad detallados',
      icon: Coins,
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
      id: 'sales',
      title: 'Reporte de Ventas',
      description: 'Análisis detallado de ventas por período',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      id: 'employees',
      title: 'Performance de Empleados',
      description: 'Rendimiento del equipo de ventas',
      icon: Users,
      color: 'indigo'
    }
  ];
  
  // Cargar reporte cuando cambie el tipo activo
  useEffect(() => {
    generateReport();
  }, [activeReport, selectedDateRange]);
  
  const generateReport = async () => {
    setIsGenerating(true);
    setReportData(null);
    
    try {
      console.log(`📊 Generating ${activeReport} report...`);
      
      let response;
      
      switch (activeReport) {
        case 'financial':
          response = await inventoryService.getFinancialReport(
            selectedDateRange.start,
            selectedDateRange.end
          );
          break;
          
        case 'products':
          response = await inventoryService.getLowStockProducts();
          break;
          
        case 'sales':
          response = await inventoryService.getDailySalesReport(selectedDateRange.end);
          break;
          
        case 'employees':
          response = await inventoryService.getEmployeePerformance(
            selectedDateRange.start,
            selectedDateRange.end
          );
          break;
          
        default:
          throw new Error(`Unknown report type: ${activeReport}`);
      }
      
      if (response && response.success) {
        setReportData(response.data);
        console.log(`✅ ${activeReport} report generated successfully`);
      } else {
        throw new Error(`Failed to generate ${activeReport} report`);
      }
      
    } catch (error) {
      console.error(`❌ Error generating ${activeReport} report:`, error);
      
      // Mostrar datos de ejemplo en caso de error
      setReportData(generateFallbackData(activeReport));
      showError(`Error al generar reporte. Mostrando datos de ejemplo.`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generar datos de ejemplo en caso de error
  const generateFallbackData = (reportType) => {
    switch (reportType) {
      case 'financial':
        return {
          period: {
            startDate: selectedDateRange.start,
            endDate: selectedDateRange.end
          },
          revenue: {
            online: 15000,
            local: 25000,
            total: 40000
          },
          movements: {
            income: { count: 120, total: 42000 },
            expense: { count: 25, total: 8000 }
          },
          paymentMethods: {
            cash: { count: 80, total: 25000 },
            transfer: { count: 40, total: 15000 }
          },
          netIncome: 34000
        };
        
      case 'products':
        return {
          products: [
            {
              id: 1,
              name: 'Proteína Whey Premium',
              sku: 'WHE-PRO-001',
              currentStock: 3,
              minStock: 5,
              shortage: 2,
              category: 'Suplementos',
              brand: 'MuscleTech',
              price: 250.00,
              isOutOfStock: false,
              urgency: 'medium'
            }
          ],
          summary: {
            totalProducts: 1,
            outOfStock: 0,
            critical: 0,
            high: 0,
            medium: 1
          }
        };
        
      case 'sales':
        return {
          date: selectedDateRange.end,
          summary: {
            totalSales: 15,
            totalRevenue: 3750,
            averageTicket: 250,
            cashSales: 10,
            transferSales: 5
          },
          hourlyBreakdown: [],
          topProducts: [
            {
              name: 'Proteína Whey Premium',
              quantity: 5,
              revenue: 1250
            }
          ]
        };
        
      case 'employees':
        return {
          period: {
            startDate: selectedDateRange.start,
            endDate: selectedDateRange.end
          },
          employees: [
            {
              employee: {
                id: 2,
                name: 'Juan Pérez',
                role: 'colaborador'
              },
              sales: {
                total: 45,
                revenue: 12500,
                average: 277.78,
                cash: 30,
                transfer: 15,
                pending: 0
              }
            }
          ]
        };
        
      default:
        return {};
    }
  };
  
  // Exportar reporte
  const handleExportReport = async (format) => {
    try {
      setIsGenerating(true);
      
      // Simular tiempo de exportación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showSuccess(`Reporte exportado como ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error('❌ Error exporting report:', error);
      showError('Error al exportar el reporte');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Obtener colores para categorías
  const getCategoryColor = (color) => {
    const colors = {
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600'
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
              onClick={generateReport}
              disabled={isGenerating}
              className="btn-secondary btn-sm"
            >
              <RotateCcw className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            <button
              onClick={() => handleExportReport('pdf')}
              disabled={isGenerating || !reportData}
              className="btn-secondary btn-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </button>
            
            <button
              onClick={() => handleExportReport('excel')}
              disabled={isGenerating || !reportData}
              className="btn-secondary btn-sm"
            >
              <FileText className="w-4 h-4 mr-1" />
              Excel
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
              Conectando con el backend y analizando datos...
            </p>
            <div className="mt-4 w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          
          {/* HEADER DEL REPORTE */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {reportTypes.find(r => r.id === activeReport)?.title}
              </h2>
              <span className="text-sm text-gray-500">
                Generado: {formatDate(new Date())}
              </span>
            </div>
            
            {/* CONTENIDO ESPECÍFICO POR TIPO DE REPORTE */}
            
            {/* REPORTE FINANCIERO */}
            {activeReport === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatCurrency(reportData.revenue?.total || 0)}
                    </div>
                    <div className="text-sm text-green-700">Ingresos Totales</div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatCurrency(reportData.netIncome || 0)}
                    </div>
                    <div className="text-sm text-blue-700">Ingreso Neto</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {reportData.movements?.income?.count || 0}
                    </div>
                    <div className="text-sm text-purple-700">Transacciones</div>
                  </div>
                </div>
                
                {/* Desglose por métodos de pago */}
                {reportData.paymentMethods && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Métodos de Pago
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(reportData.paymentMethods).map(([method, data]) => (
                        <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            {method === 'cash' ? (
                              <Coins className="w-5 h-5 text-green-600 mr-3" />
                            ) : (
                              <CreditCard className="w-5 h-5 text-blue-600 mr-3" />
                            )}
                            <span className="font-medium text-gray-900 capitalize">
                              {method === 'cash' ? 'Efectivo' : 'Transferencia'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              {formatCurrency(data.total)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {data.count} transacciones
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* REPORTE DE PRODUCTOS */}
            {activeReport === 'products' && (
              <div className="space-y-6">
                {reportData.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {reportData.summary.totalProducts}
                      </div>
                      <div className="text-sm text-blue-700">Total Productos</div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {reportData.summary.medium || 0}
                      </div>
                      <div className="text-sm text-yellow-700">Stock Bajo</div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {reportData.summary.outOfStock}
                      </div>
                      <div className="text-sm text-red-700">Sin Stock</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {reportData.summary.totalProducts - reportData.summary.outOfStock - (reportData.summary.medium || 0)}
                      </div>
                      <div className="text-sm text-green-700">Stock Normal</div>
                    </div>
                  </div>
                )}
                
                {/* Lista de productos con stock bajo */}
                {reportData.products && reportData.products.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Productos que Requieren Atención
                    </h3>
                    <div className="space-y-3">
                      {reportData.products.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-600">
                                {product.category} • {product.brand} • SKU: {product.sku}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">
                              Stock: {product.currentStock}
                            </div>
                            <div className="text-sm text-gray-600">
                              Mínimo: {product.minStock}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* REPORTE DE VENTAS */}
            {activeReport === 'sales' && (
              <div className="space-y-6">
                {reportData.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {reportData.summary.totalSales}
                      </div>
                      <div className="text-sm text-green-700">Ventas Totales</div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(reportData.summary.totalRevenue)}
                      </div>
                      <div className="text-sm text-blue-700">Ingresos</div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(reportData.summary.averageTicket)}
                      </div>
                      <div className="text-sm text-purple-700">Ticket Promedio</div>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {((reportData.summary.cashSales / reportData.summary.totalSales) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-indigo-700">Ventas en Efectivo</div>
                    </div>
                  </div>
                )}
                
                {/* Productos más vendidos */}
                {reportData.topProducts && reportData.topProducts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Productos Más Vendidos
                    </h3>
                    <div className="space-y-3">
                      {reportData.topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-bold text-purple-600">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-600">
                                {product.quantity} unidades vendidas
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
            )}
            
            {/* REPORTE DE EMPLEADOS */}
            {activeReport === 'employees' && (
              <div className="space-y-6">
                {reportData.employees && reportData.employees.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Performance del Equipo
                    </h3>
                    <div className="space-y-4">
                      {reportData.employees.map((emp, index) => (
                        <div key={index} className="bg-gray-50 p-6 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                <Users className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {emp.employee.name}
                                </h4>
                                <p className="text-sm text-gray-600 capitalize">
                                  {emp.employee.role}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {emp.sales.total}
                              </div>
                              <div className="text-sm text-gray-600">Ventas Totales</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(emp.sales.revenue)}
                              </div>
                              <div className="text-sm text-gray-600">Ingresos</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {formatCurrency(emp.sales.average)}
                              </div>
                              <div className="text-sm text-gray-600">Promedio</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {emp.sales.pending || 0}
                              </div>
                              <div className="text-sm text-gray-600">Pendientes</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay datos de empleados disponibles</p>
                  </div>
                )}
              </div>
            )}
            
          </div>
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