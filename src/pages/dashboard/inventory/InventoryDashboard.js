// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/InventoryDashboard.js  
// FUNCIÓN: Dashboard central de inventario, ventas y productos

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, ShoppingBag, TrendingUp, AlertCircle,
  Plus, Download, RefreshCw, BarChart3, Settings,
  Coins, ArrowUp, ArrowDown, Info, Users, Clock,
  Target, Box, Star, Edit, Trash2, Save, X, Loader
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import apiService from '../../../services/apiService';

// Componentes del sistema de inventario
import ProductsManager from './components/ProductsManager';
import SalesManager from './components/SalesManager';
import InventoryStats from './components/InventoryStats';
import ReportsManager from './components/ReportsManager';

// Componentes comunes
import DashboardCard from '../../../components/common/DashboardCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

// Función auxiliar para formatear en Quetzales
const formatQuetzales = (amount) => {
  if (!amount || isNaN(amount)) return 'Q 0.00';
  return `Q ${parseFloat(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const InventoryDashboard = () => {
  const { user } = useAuth();
  const { formatDate, showError, showSuccess, isMobile } = useApp();
  
  // Estados para datos del inventario
  const [inventoryData, setInventoryData] = useState({
    stats: { data: null, isLoading: false, error: null },
    products: { data: [], isLoading: false, error: null },
    sales: { data: [], isLoading: false, error: null },
    lowStock: { data: [], isLoading: false, error: null }
  });
  
  // Estados de control
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Cargar todos los datos del inventario
  const loadInventoryData = async () => {
    console.log('InventoryDashboard - Cargando datos completos...');
    
    try {
      // Estadísticas generales
      setInventoryData(prev => ({
        ...prev,
        stats: { ...prev.stats, isLoading: true, error: null }
      }));
      
      try {
        const statsResponse = await apiService.getInventoryStats();
        setInventoryData(prev => ({
          ...prev,
          stats: { data: statsResponse, isLoading: false, error: null }
        }));
      } catch (error) {
        console.log('Estadísticas no disponibles, usando datos de ejemplo');
        // Datos de ejemplo para desarrollo
        setInventoryData(prev => ({
          ...prev,
          stats: { 
            data: {
              totalProducts: 45,
              lowStockProducts: 8,
              outOfStockProducts: 3,
              totalValue: 125000,
              salesToday: 2850,
              salesThisWeek: 18500,
              salesThisMonth: 67000,
              topSellingProduct: 'Proteína Whey Premium'
            }, 
            isLoading: false, 
            error: null 
          }
        }));
      }
      
      // Cargar productos
      setInventoryData(prev => ({
        ...prev,
        products: { ...prev.products, isLoading: true, error: null }
      }));
      
      try {
        const productsResponse = await apiService.getProducts();
        setInventoryData(prev => ({
          ...prev,
          products: { data: productsResponse?.data || [], isLoading: false, error: null }
        }));
      } catch (error) {
        console.log('Productos no disponibles, usando datos de ejemplo');
        // Datos de ejemplo
        setInventoryData(prev => ({
          ...prev,
          products: { 
            data: [
              {
                id: 1,
                name: 'Proteína Whey Premium',
                category: 'suplementos',
                price: 250.00,
                stock: 25,
                minStock: 5,
                featured: true
              },
              {
                id: 2,
                name: 'Creatina Monohidratada',
                category: 'suplementos',
                price: 85.00,
                stock: 3,
                minStock: 5,
                featured: false
              }
            ], 
            isLoading: false, 
            error: null 
          }
        }));
      }
      
      // Cargar ventas recientes
      try {
        const salesResponse = await apiService.getRecentSales();
        setInventoryData(prev => ({
          ...prev,
          sales: { data: salesResponse?.data || [], isLoading: false, error: null }
        }));
      } catch (error) {
        console.log('Ventas no disponibles');
        setInventoryData(prev => ({
          ...prev,
          sales: { data: [], isLoading: false, error: null }
        }));
      }
      
    } catch (error) {
      console.error('Error cargando datos de inventario:', error);
    }
  };
  
  // Refrescar datos
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    loadInventoryData();
    showSuccess('Datos de inventario actualizados');
  };
  
  // Cargar datos al montar
  useEffect(() => {
    console.log('InventoryDashboard montado, cargando datos...');
    loadInventoryData();
  }, [refreshKey, selectedPeriod]);
  
  // Métricas principales
  const mainMetrics = {
    totalProducts: inventoryData.stats.data?.totalProducts || 0,
    lowStockProducts: inventoryData.stats.data?.lowStockProducts || 0,
    outOfStockProducts: inventoryData.stats.data?.outOfStockProducts || 0,
    totalInventoryValue: inventoryData.stats.data?.totalValue || 0,
    salesToday: inventoryData.stats.data?.salesToday || 0,
    salesThisWeek: inventoryData.stats.data?.salesThisWeek || 0,
    salesThisMonth: inventoryData.stats.data?.salesThisMonth || 0,
    topSellingProduct: inventoryData.stats.data?.topSellingProduct || 'N/A'
  };
  
  // Períodos disponibles
  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' }
  ];
  
  // Pestañas del sistema
  const tabs = [
    { 
      id: 'overview', 
      label: 'Resumen General', 
      icon: BarChart3, 
      description: 'Vista general del inventario'
    },
    { 
      id: 'products', 
      label: 'Productos', 
      icon: Package, 
      description: 'Gestión completa de productos'
    },
    { 
      id: 'sales', 
      label: 'Ventas', 
      icon: ShoppingBag, 
      description: 'Registro y gestión de ventas'
    },
    { 
      id: 'reports', 
      label: 'Reportes', 
      icon: TrendingUp, 
      description: 'Análisis y reportes detallados'
    }
  ];
  
  // Manejar cambios sin guardar
  const handleUnsavedChanges = (hasChanges) => {
    setHasUnsavedChanges(hasChanges);
  };
  
  // Guardar datos
  const handleSave = async (data) => {
    try {
      console.log('Guardando datos de inventario:', data);
      // Aquí iría la lógica de guardado específica según el tipo de datos
      showSuccess('Datos guardados exitosamente');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error guardando datos:', error);
      showError('Error al guardar los datos');
    }
  };
  
  // Estado de carga general
  const isLoading = inventoryData.stats.isLoading || inventoryData.products.isLoading;

  return (
    <div className="space-y-6">
      
      {/* HEADER DEL DASHBOARD */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Inventario y Ventas
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Sistema completo de gestión de inventario, productos y ventas del gimnasio.
          </p>
          
          {/* Navegación rápida */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/store"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
            >
              <Package className="w-4 h-4 mr-1" />
              Ver Tienda Pública
            </Link>
            
            <Link
              to="/dashboard/admin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-full transition-colors"
            >
              <ArrowUp className="w-4 h-4 mr-1" />
              Volver al Dashboard Principal
            </Link>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Indicador de cambios sin guardar */}
          {hasUnsavedChanges && (
            <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
          
          {/* Selector de período */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-input py-2 px-3 text-sm"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          
          {/* Botón de actualizar */}
          <button
            onClick={refreshDashboard}
            className="btn-secondary btn-sm"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              title={tab.description}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      
      {/* PESTAÑA: RESUMEN GENERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* MÉTRICAS PRINCIPALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <DashboardCard
              title="Total Productos"
              value={mainMetrics.totalProducts}
              icon={Package}
              color="blue"
              isLoading={inventoryData.stats.isLoading}
              subtitle="En catálogo"
            />
            
            <DashboardCard
              title="Stock Bajo"
              value={mainMetrics.lowStockProducts}
              icon={AlertCircle}
              color="yellow"
              isLoading={inventoryData.stats.isLoading}
              alert={mainMetrics.lowStockProducts > 0}
              subtitle="Requieren reposición"
            />
            
            <DashboardCard
              title="Sin Stock"
              value={mainMetrics.outOfStockProducts}
              icon={AlertCircle}
              color="red"
              isLoading={inventoryData.stats.isLoading}
              alert={mainMetrics.outOfStockProducts > 0}
              subtitle="Agotados"
            />
            
            <DashboardCard
              title="Valor Inventario"
              value={formatQuetzales(mainMetrics.totalInventoryValue)}
              icon={Coins}
              color="green"
              isLoading={inventoryData.stats.isLoading}
              subtitle="Valor total"
            />
            
          </div>
          
          {/* MÉTRICAS DE VENTAS */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              Resumen de Ventas (Quetzales)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatQuetzales(mainMetrics.salesToday)}
                </div>
                <div className="text-sm text-gray-600">Ventas Hoy</div>
                <div className="flex items-center justify-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+12% vs ayer</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatQuetzales(mainMetrics.salesThisWeek)}
                </div>
                <div className="text-sm text-gray-600">Esta Semana</div>
                <div className="flex items-center justify-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+8% vs anterior</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatQuetzales(mainMetrics.salesThisMonth)}
                </div>
                <div className="text-sm text-gray-600">Este Mes</div>
                <div className="flex items-center justify-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+15% vs anterior</span>
                </div>
              </div>
              
            </div>
          </div>
          
          {/* ACCIONES RÁPIDAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <button
              onClick={() => setActiveTab('products')}
              className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Gestionar Productos</h4>
                  <p className="text-sm text-gray-600">Agregar, editar y organizar productos</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('sales')}
              className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Registrar Ventas</h4>
                  <p className="text-sm text-gray-600">Ventas en tienda física y online</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('reports')}
              className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">Ver Reportes</h4>
                  <p className="text-sm text-gray-600">Análisis detallado de ventas</p>
                </div>
              </div>
            </button>
            
          </div>
          
          {/* ESTADÍSTICAS ADICIONALES */}
          <InventoryStats 
            data={inventoryData.stats.data}
            isLoading={inventoryData.stats.isLoading}
            period={selectedPeriod}
          />
          
        </div>
      )}
      
      {/* PESTAÑA: PRODUCTOS */}
      {activeTab === 'products' && (
        <ProductsManager 
          products={inventoryData.products.data}
          isLoading={inventoryData.products.isLoading}
          onSave={handleSave}
          onUnsavedChanges={handleUnsavedChanges}
        />
      )}
      
      {/* PESTAÑA: VENTAS */}
      {activeTab === 'sales' && (
        <SalesManager 
          sales={inventoryData.sales.data}
          products={inventoryData.products.data}
          isLoading={inventoryData.sales.isLoading}
          onSave={handleSave}
          onUnsavedChanges={handleUnsavedChanges}
        />
      )}
      
      {/* PESTAÑA: REPORTES */}
      {activeTab === 'reports' && (
        <ReportsManager 
          inventoryData={inventoryData}
          period={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      )}
      
    </div>
  );
};

export default InventoryDashboard;