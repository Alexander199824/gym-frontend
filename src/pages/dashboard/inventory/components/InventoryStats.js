// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/components/InventoryStats.js
// FUNCIÓN: Componente de estadísticas detalladas del inventario

import React from 'react';
import {
  Package, TrendingUp, TrendingDown, AlertCircle,
  Star, Target, Award, Clock, Users, ShoppingBag,
  Coins, BarChart3, PieChart, Activity, Zap
} from 'lucide-react';
import { useApp } from '../../../../contexts/AppContext';

const InventoryStats = ({ data, isLoading, period }) => {
  const { formatCurrency, isMobile } = useApp();
  
  // Si no hay datos, mostrar placeholder
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Estadísticas calculadas
  const stats = {
    // Productos
    totalProducts: data.totalProducts || 0,
    lowStockProducts: data.lowStockProducts || 0,
    outOfStockProducts: data.outOfStockProducts || 0,
    featuredProducts: data.featuredProducts || 0,
    
    // Valores monetarios
    totalInventoryValue: data.totalValue || 0,
    averageProductValue: data.totalProducts > 0 
      ? (data.totalValue || 0) / data.totalProducts 
      : 0,
    
    // Ventas
    salesToday: data.salesToday || 0,
    salesYesterday: data.salesYesterday || 0,
    salesThisWeek: data.salesThisWeek || 0,
    salesLastWeek: data.salesLastWeek || 0,
    
    // Productos más vendidos
    topSellingProduct: data.topSellingProduct || 'N/A',
    topSellingCategory: data.topSellingCategory || 'N/A',
    
    // Métricas adicionales
    turnoverRate: data.turnoverRate || 0,
    averageOrderValue: data.averageOrderValue || 0,
    customerReturnRate: data.customerReturnRate || 0
  };
  
  // Calcular cambios porcentuales
  const salesChange = stats.salesYesterday > 0 
    ? ((stats.salesToday - stats.salesYesterday) / stats.salesYesterday * 100).toFixed(1)
    : 0;
    
  const weeklyChange = stats.salesLastWeek > 0
    ? ((stats.salesThisWeek - stats.salesLastWeek) / stats.salesLastWeek * 100).toFixed(1)
    : 0;
  
  // Porcentaje de stock crítico
  const criticalStockPercentage = stats.totalProducts > 0
    ? ((stats.lowStockProducts + stats.outOfStockProducts) / stats.totalProducts * 100).toFixed(1)
    : 0;
  
  // Configuración de tarjetas de estadísticas
  const statCards = [
    {
      title: 'Productos Totales',
      value: stats.totalProducts,
      icon: Package,
      color: 'blue',
      description: 'Productos en catálogo',
      trend: null
    },
    {
      title: 'Valor del Inventario',
      value: formatCurrency(stats.totalInventoryValue),
      icon: Coins,
      color: 'green',
      description: 'Valor total en stock',
      trend: null
    },
    {
      title: 'Ventas Hoy',
      value: formatCurrency(stats.salesToday),
      icon: TrendingUp,
      color: 'purple',
      description: 'Comparado con ayer',
      trend: {
        value: `${salesChange >= 0 ? '+' : ''}${salesChange}%`,
        positive: salesChange >= 0
      }
    },
    {
      title: 'Stock Crítico',
      value: `${criticalStockPercentage}%`,
      icon: AlertCircle,
      color: criticalStockPercentage > 20 ? 'red' : criticalStockPercentage > 10 ? 'yellow' : 'green',
      description: `${stats.lowStockProducts + stats.outOfStockProducts} productos`,
      trend: null
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(stats.averageOrderValue),
      icon: Target,
      color: 'indigo',
      description: 'Valor promedio por venta',
      trend: null
    },
    {
      title: 'Rotación de Inventario',
      value: `${stats.turnoverRate.toFixed(1)}x`,
      icon: Activity,
      color: 'orange',
      description: 'Veces por período',
      trend: null
    }
  ];
  
  // Obtener colores según el tipo
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      
      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          const colorClasses = getColorClasses(card.color);
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                
                {card.trend && (
                  <div className={`flex items-center text-sm ${
                    card.trend.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.trend.positive ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {card.trend.value}
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {card.title}
                </div>
                <div className="text-xs text-gray-500">
                  {card.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* ANÁLISIS DETALLADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Productos y Categorías */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            Productos Destacados
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Producto Más Vendido</div>
                <div className="text-sm text-gray-600">{stats.topSellingProduct}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Líder
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Categoría Principal</div>
                <div className="text-sm text-gray-600">{stats.topSellingCategory}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">
                  <Award className="w-4 h-4 inline mr-1" />
                  Top
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">Productos Destacados</div>
                <div className="text-sm text-gray-600">En página principal</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">
                  {stats.featuredProducts}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Análisis de Tendencias */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
            Análisis de Tendencias
          </h3>
          
          <div className="space-y-4">
            
            {/* Comparación Ventas Diarias */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Ventas vs Ayer</div>
                <div className="text-sm text-gray-600">
                  Hoy: {formatCurrency(stats.salesToday)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium flex items-center ${
                  salesChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {salesChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {salesChange >= 0 ? '+' : ''}{salesChange}%
                </div>
              </div>
            </div>
            
            {/* Comparación Ventas Semanales */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">Ventas vs Semana Pasada</div>
                <div className="text-sm text-gray-600">
                  Esta semana: {formatCurrency(stats.salesThisWeek)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium flex items-center ${
                  weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {weeklyChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {weeklyChange >= 0 ? '+' : ''}{weeklyChange}%
                </div>
              </div>
            </div>
            
            {/* Tasa de Retorno de Clientes */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">Retorno de Clientes</div>
                <div className="text-sm text-gray-600">Clientes que regresan</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-600">
                  {stats.customerReturnRate.toFixed(1)}%
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>
      
      {/* ALERTAS Y RECOMENDACIONES */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 text-yellow-600 mr-2" />
          Alertas y Recomendaciones
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Alerta Stock Bajo */}
          {stats.lowStockProducts > 0 && (
            <div className="bg-white bg-opacity-60 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">Stock Bajo</span>
              </div>
              <p className="text-sm text-yellow-700">
                {stats.lowStockProducts} productos necesitan reposición urgente
              </p>
            </div>
          )}
          
          {/* Alerta Sin Stock */}
          {stats.outOfStockProducts > 0 && (
            <div className="bg-white bg-opacity-60 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">Sin Stock</span>
              </div>
              <p className="text-sm text-red-700">
                {stats.outOfStockProducts} productos están agotados
              </p>
            </div>
          )}
          
          {/* Recomendación Positiva */}
          {salesChange > 10 && (
            <div className="bg-white bg-opacity-60 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">¡Excelente!</span>
              </div>
              <p className="text-sm text-green-700">
                Las ventas han aumentado {salesChange}% vs ayer
              </p>
            </div>
          )}
          
          {/* Mensaje por defecto si no hay alertas */}
          {stats.lowStockProducts === 0 && stats.outOfStockProducts === 0 && salesChange <= 10 && (
            <div className="bg-white bg-opacity-60 rounded-lg p-4 md:col-span-3">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <span className="font-medium text-green-800">Todo en Orden</span>
                  <p className="text-sm text-green-700 mt-1">
                    El inventario está funcionando correctamente sin alertas críticas
                  </p>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
      
    </div>
  );
};

export default InventoryStats;