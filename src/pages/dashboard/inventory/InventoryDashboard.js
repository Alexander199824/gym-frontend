// Autor: Alexander Echeverria
// Archivo: src/pages/dashboard/inventory/InventoryDashboard.js  
// FUNCIÓN: Dashboard central de inventario conectado al backend real
// ACTUALIZADO: Para usar inventoryService con rutas correctas del manual

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
import inventoryService from '../../../services/inventoryService';

// Componentes del sistema de inventario
import ProductsManager from './components/ProductsManager';
import SalesManager from './components/SalesManager';
import InventoryStats from './components/InventoryStats';
import ReportsManager from './components/ReportsManager';
import CategoriesBrandsManager from './components/CategoriesBrandsManager';

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
  const [activeSubTab, setActiveSubTab] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  
  // Cargar todos los datos del inventario usando el nuevo servicio
  const loadInventoryData = async () => {
    console.log('InventoryDashboard - Cargando datos con inventoryService...');
    setIsLoadingDashboard(true);
    
    try {
      // 1. Cargar estadísticas principales
      setInventoryData(prev => ({
        ...prev,
        stats: { ...prev.stats, isLoading: true, error: null }
      }));
      
      try {
        console.log('📊 Loading inventory stats...');
        const statsResponse = await inventoryService.getInventoryStats(selectedPeriod);
        
        if (statsResponse.success && statsResponse.data) {
          setInventoryData(prev => ({
            ...prev,
            stats: { data: statsResponse.data, isLoading: false, error: null }
          }));
          console.log('✅ Inventory stats loaded:', statsResponse.data);
        } else {
          throw new Error('Invalid stats response');
        }
        
      } catch (error) {
        console.log('⚠️ Stats endpoint not available, using fallback');
        // Usar datos de fallback del servicio
        const fallbackStats = {
          inventory: {
            totalProducts: 0,
            lowStockProducts: 0,
            outOfStockProducts: 0,
            totalValue: 0
          },
          sales: {
            period: selectedPeriod,
            data: []
          },
          products: {
            topSelling: []
          },
          alerts: {
            pendingTransfers: { total: 0, online: 0, local: 0 },
            lowStockProducts: 0
          },
          categories: []
        };
        
        setInventoryData(prev => ({
          ...prev,
          stats: { data: fallbackStats, isLoading: false, error: null }
        }));
      }
      
      // 2. Cargar productos básicos para mostrar resumen
      setInventoryData(prev => ({
        ...prev,
        products: { ...prev.products, isLoading: true, error: null }
      }));
      
      try {
        console.log('📦 Loading products summary...');
        const productsResponse = await inventoryService.getProducts({ limit: 50 });
        
        if (productsResponse.success && productsResponse.data) {
          const products = productsResponse.data.products || [];
          setInventoryData(prev => ({
            ...prev,
            products: { data: products, isLoading: false, error: null }
          }));
          console.log(`✅ Loaded ${products.length} products`);
          
          // Actualizar stats con datos reales de productos si no tenemos stats del backend
          if (!inventoryData.stats.data?.inventory?.totalProducts) {
            updateStatsWithProductData(products);
          }
        }
        
      } catch (error) {
        console.log('⚠️ Products endpoint error:', error.message);
        setInventoryData(prev => ({
          ...prev,
          products: { data: [], isLoading: false, error: error.message }
        }));
      }
      
      // 3. Cargar ventas locales recientes
      try {
        console.log('💰 Loading recent sales...');
        const salesResponse = await inventoryService.getLocalSales({ 
          limit: 10,
          page: 1
        });
        
        if (salesResponse.success && salesResponse.data) {
          const sales = salesResponse.data.sales || [];
          setInventoryData(prev => ({
            ...prev,
            sales: { data: sales, isLoading: false, error: null }
          }));
          console.log(`✅ Loaded ${sales.length} recent sales`);
        }
        
      } catch (error) {
        console.log('⚠️ Sales endpoint not available');
        setInventoryData(prev => ({
          ...prev,
          sales: { data: [], isLoading: false, error: null }
        }));
      }
      
      // 4. Cargar productos con stock bajo
      try {
        console.log('⚠️ Loading low stock products...');
        const lowStockResponse = await inventoryService.getLowStockProducts();
        
        if (lowStockResponse.success && lowStockResponse.data) {
          const lowStockProducts = lowStockResponse.data.products || [];
          setInventoryData(prev => ({
            ...prev,
            lowStock: { data: lowStockProducts, isLoading: false, error: null }
          }));
          console.log(`✅ Loaded ${lowStockProducts.length} low stock products`);
        }
        
      } catch (error) {
        console.log('⚠️ Low stock endpoint not available');
        setInventoryData(prev => ({
          ...prev,
          lowStock: { data: [], isLoading: false, error: null }
        }));
      }
      
    } catch (error) {
      console.error('❌ Error loading inventory data:', error);
      showError('Error al cargar datos del inventario');
    } finally {
      setIsLoadingDashboard(false);
    }
  };
  
  // Actualizar estadísticas con datos reales de productos
  const updateStatsWithProductData = (products) => {
    console.log('📊 Calculating stats from product data...');
    
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => 
      (p.stockQuantity || 0) <= (p.minStock || 5) && (p.stockQuantity || 0) > 0
    ).length;
    const outOfStockProducts = products.filter(p => (p.stockQuantity || 0) === 0).length;
    const totalValue = products.reduce((sum, product) => 
      sum + ((product.price || 0) * (product.stockQuantity || 0)), 0
    );
    
    const calculatedStats = {
      inventory: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalValue
      },
      sales: {
        period: selectedPeriod,
        data: []
      },
      products: {
        topSelling: products.filter(p => p.isFeatured).slice(0, 5)
      },
      alerts: {
        pendingTransfers: { total: 0, online: 0, local: 0 },
        lowStockProducts
      },
      categories: []
    };
    
    setInventoryData(prev => ({
      ...prev,
      stats: { data: calculatedStats, isLoading: false, error: null }
    }));
    
    console.log('✅ Stats calculated from products:', calculatedStats.inventory);
  };
  
  // Refrescar datos
  const refreshDashboard = async () => {
    console.log('🔄 Refreshing inventory dashboard...');
    setRefreshKey(prev => prev + 1);
    await loadInventoryData();
    showSuccess('Dashboard actualizado');
  };
  
  // Cargar datos al montar y cuando cambia el período
  useEffect(() => {
    console.log('InventoryDashboard mounted, loading data...');
    loadInventoryData();
  }, [refreshKey, selectedPeriod]);
  
  // Métricas principales calculadas
  const mainMetrics = {
    totalProducts: inventoryData.stats.data?.inventory?.totalProducts || 0,
    lowStockProducts: inventoryData.stats.data?.inventory?.lowStockProducts || 0,
    outOfStockProducts: inventoryData.stats.data?.inventory?.outOfStockProducts || 0,
    totalInventoryValue: inventoryData.stats.data?.inventory?.totalValue || 0,
    salesToday: inventoryData.stats.data?.sales?.salesToday || 0,
    salesThisWeek: inventoryData.stats.data?.sales?.salesThisWeek || 0,
    salesThisMonth: inventoryData.stats.data?.sales?.salesThisMonth || 0,
    topSellingProduct: inventoryData.stats.data?.products?.topSelling?.[0]?.name || 'N/A'
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
      console.log('💾 Saving inventory data:', data);
      
      if (data.type === 'products' && onSave) {
        await onSave(data);
      }
      
      showSuccess('Datos guardados exitosamente');
      setHasUnsavedChanges(false);
      
      // Refrescar datos después de guardar
      await loadInventoryData();
      
    } catch (error) {
      console.error('❌ Error saving data:', error);
      showError('Error al guardar los datos');
    }
  };

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
          
          {/* Estado de conexión */}
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Conectado al backend
            </div>
            
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
              Dashboard Principal
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
            disabled={isLoadingDashboard}
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
            disabled={isLoadingDashboard}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Debug button (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => inventoryService.debugInventorySystem()}
              className="btn-secondary btn-sm text-xs"
              title="Debug sistema"
            >
              🔍 Debug
            </button>
          )}
        </div>
      </div>
      
      {/* INDICADOR DE CARGA GENERAL */}
      {isLoadingDashboard && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center">
            <Loader className="w-5 h-5 text-blue-400 animate-spin mr-3" />
            <div>
              <p className="text-sm text-blue-700">
                Cargando datos del inventario desde el backend...
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Conectándose a las APIs: /api/inventory/*, /api/store/management/*
              </p>
            </div>
          </div>
        </div>
      )}
      
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
          
          {/* RESUMEN DE VENTAS (si disponible) */}
          {(mainMetrics.salesToday > 0 || mainMetrics.salesThisWeek > 0 || mainMetrics.salesThisMonth > 0) && (
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
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatQuetzales(mainMetrics.salesThisWeek)}
                  </div>
                  <div className="text-sm text-gray-600">Esta Semana</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {formatQuetzales(mainMetrics.salesThisMonth)}
                  </div>
                  <div className="text-sm text-gray-600">Este Mes</div>
                </div>
                
              </div>
            </div>
          )}
          
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
                  <p className="text-sm text-gray-600">Ventas en tienda física</p>
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
        <div className="space-y-6">
          {/* Submenu para productos */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveSubTab('products-list')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeSubTab === 'products-list' || !activeSubTab
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📦 Lista de Productos
            </button>
            <button
              onClick={() => setActiveSubTab('categories-brands')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeSubTab === 'categories-brands'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏷️ Categorías y Marcas
            </button>
          </div>
          
          {/* Contenido según subtab */}
          {(!activeSubTab || activeSubTab === 'products-list') && (
            <ProductsManager 
              onSave={handleSave}
              onUnsavedChanges={handleUnsavedChanges}
            />
          )}
          
          {activeSubTab === 'categories-brands' && (
            <CategoriesBrandsManager 
              onSave={handleSave}
              onUnsavedChanges={handleUnsavedChanges}
            />
          )}
        </div>
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