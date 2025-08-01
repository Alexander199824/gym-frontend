// src/pages/dashboard/AdminDashboard.js
// FUNCIÓN: Dashboard ACTUALIZADO - Interfaz mejorada, header simplificado, debug discreto
// CAMBIOS: Eliminado header de gestión web, debug info discreto, interfaz más limpia

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, CreditCard, DollarSign, TrendingUp, AlertCircle,
  Calendar, Clock, ArrowRight, RefreshCw, Download, Settings,
  BarChart3, PieChart, Activity, Target, Zap, Crown, Save,
  Globe, Image, ShoppingBag, Info, CheckCircle, Package,
  Truck, Plus, Loader, Bug
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// 📊 Componentes específicos del dashboard
import DashboardCard from '../../components/common/DashboardCard';
import QuickActionCard from '../../components/common/QuickActionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// 🆕 COMPONENTES CORREGIDOS para gestión de contenido
import ContentEditor from './components/ContentEditor';
import ServicesManager from './components/ServicesManager';
import PlansManager from './components/PlansManager';
import ProductsManager from './components/ProductsManager';
import MediaUploader from './components/MediaUploader';

const AdminDashboard = () => {
  const { user, canManageContent } = useAuth();
  const { formatCurrency, formatDate, showError, showSuccess, isMobile } = useApp();
  
  // 📅 Fecha actual
  const today = new Date().toISOString().split('T')[0];
  
  // 📱 Estados locales para operaciones
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 🆕 Estados para gestión de contenido
  const [activeContentTab, setActiveContentTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 🐛 Estado para debug info
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // 📊 Estados para datos operativos
  const [userStats, setUserStats] = useState({ data: null, isLoading: false, error: null });
  const [membershipStats, setMembershipStats] = useState({ data: null, isLoading: false, error: null });
  const [paymentReports, setPaymentReports] = useState({ data: null, isLoading: false, error: null });
  const [expiredMemberships, setExpiredMemberships] = useState({ data: null, isLoading: false, error: null });
  const [expiringSoon, setExpiringSoon] = useState({ data: null, isLoading: false, error: null });
  const [pendingTransfers, setPendingTransfers] = useState({ data: null, isLoading: false, error: null });
  const [todayPayments, setTodayPayments] = useState({ data: null, isLoading: false, error: null });
  
  // 🆕 Estados para datos de contenido - MEJORADOS
  const [gymConfigData, setGymConfigData] = useState({ data: null, isLoading: false, error: null });
  const [servicesData, setServicesData] = useState({ data: null, isLoading: false, error: null });
  const [membershipPlansData, setMembershipPlansData] = useState({ data: null, isLoading: false, error: null });
  const [featuredProductsData, setFeaturedProductsData] = useState({ data: null, isLoading: false, error: null });
  
  // 🛍️ Estados para gestión de inventario
  const [inventoryStats, setInventoryStats] = useState({ data: null, isLoading: false, error: null });
  
  // 🔄 CARGAR DATOS OPERATIVOS
  const loadDashboardData = async () => {
    console.log('📊 Loading dashboard data...');
    
    try {
      // Stats de usuarios
      setUserStats({ data: null, isLoading: true, error: null });
      try {
        const userStatsData = await apiService.getUserStats();
        setUserStats({ data: userStatsData, isLoading: false, error: null });
      } catch (error) {
        console.log('⚠️ User stats not available:', error.message);
        setUserStats({ data: null, isLoading: false, error });
      }
      
      // Stats de membresías
      setMembershipStats({ data: null, isLoading: true, error: null });
      try {
        const membershipStatsData = await apiService.getMembershipStats();
        setMembershipStats({ data: membershipStatsData, isLoading: false, error: null });
      } catch (error) {
        console.log('⚠️ Membership stats not available:', error.message);
        setMembershipStats({ data: null, isLoading: false, error });
      }
      
      // Reportes de pagos
      setPaymentReports({ data: null, isLoading: true, error: null });
      try {
        const paymentReportsData = await apiService.getPaymentReports({ period: selectedPeriod });
        setPaymentReports({ data: paymentReportsData, isLoading: false, error: null });
      } catch (error) {
        console.log('⚠️ Payment reports not available:', error.message);
        setPaymentReports({ data: null, isLoading: false, error });
      }
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    }
  };
  
  // 🔄 CARGAR DATOS DE CONTENIDO - MEJORADO
  const loadContentData = async () => {
    if (!canManageContent) return;
    
    console.log('📄 Loading content management data...');
    
    try {
      // Configuración del gimnasio
      setGymConfigData({ data: null, isLoading: true, error: null });
      try {
        const gymConfigResponse = await apiService.getGymConfig();
        const configData = gymConfigResponse?.data || gymConfigResponse;
        setGymConfigData({ data: configData, isLoading: false, error: null });
        console.log('✅ Gym config loaded for AdminDashboard:', configData);
      } catch (error) {
        console.log('⚠️ Gym config not available:', error.message);
        setGymConfigData({ data: null, isLoading: false, error });
      }
      
      // Servicios
      setServicesData({ data: null, isLoading: true, error: null });
      try {
        const servicesResponse = await apiService.getGymServices();
        const services = servicesResponse?.data || servicesResponse;
        setServicesData({ data: services, isLoading: false, error: null });
        console.log('✅ Services loaded for AdminDashboard:', services);
      } catch (error) {
        console.log('⚠️ Services not available:', error.message);
        setServicesData({ data: null, isLoading: false, error });
      }
      
      // Planes de membresía
      setMembershipPlansData({ data: null, isLoading: true, error: null });
      try {
        const plansResponse = await apiService.getMembershipPlans();
        const plans = plansResponse?.data || plansResponse;
        setMembershipPlansData({ data: plans, isLoading: false, error: null });
        console.log('✅ Plans loaded for AdminDashboard:', plans);
      } catch (error) {
        console.log('⚠️ Plans not available:', error.message);
        setMembershipPlansData({ data: null, isLoading: false, error });
      }
      
      // Productos destacados
      setFeaturedProductsData({ data: null, isLoading: true, error: null });
      try {
        const productsResponse = await apiService.getFeaturedProducts();
        const products = productsResponse?.data || productsResponse;
        setFeaturedProductsData({ data: products, isLoading: false, error: null });
        console.log('✅ Products loaded for AdminDashboard:', products);
      } catch (error) {
        console.log('⚠️ Products not available:', error.message);
        setFeaturedProductsData({ data: null, isLoading: false, error });
      }
      
    } catch (error) {
      console.error('❌ Error loading content data:', error);
    }
  };
  
  // 📦 Cargar datos de inventario
  const loadInventoryData = async () => {
    console.log('📦 Loading inventory data...');
    
    try {
      setInventoryStats({ data: null, isLoading: true, error: null });
      try {
        const inventoryData = await apiService.getInventoryStats();
        setInventoryStats({ data: inventoryData, isLoading: false, error: null });
        console.log('✅ Inventory stats loaded:', inventoryData);
      } catch (error) {
        console.log('⚠️ Inventory stats not available:', error.message);
        setInventoryStats({ data: null, isLoading: false, error });
      }
    } catch (error) {
      console.error('❌ Error loading inventory data:', error);
    }
  };
  
  // 🔄 Refrescar datos
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    loadDashboardData();
    if (canManageContent) {
      loadContentData();
    }
    if (activeTab === 'inventory') {
      loadInventoryData();
    }
    showSuccess('Datos actualizados');
  };
  
  // ⏰ Cargar datos al montar el componente
  useEffect(() => {
    console.log('🚀 AdminDashboard mounted, loading data...');
    loadDashboardData();
    if (canManageContent) {
      loadContentData();
    }
  }, [refreshKey, selectedPeriod]);
  
  // ⏰ Auto-refresh para operaciones
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'operations') {
        loadDashboardData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);
  
  // 🔄 Cargar datos de inventario cuando se cambia a esa tab
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventoryData();
    }
  }, [activeTab]);
  
  // 📊 Calcular métricas principales
  const mainMetrics = {
    totalUsers: userStats?.data?.totalActiveUsers || 0,
    activeMemberships: membershipStats?.data?.activeMemberships || 0,
    monthlyRevenue: paymentReports?.data?.totalIncome || 0,
    expiredCount: expiredMemberships?.data?.total || 0,
    expiringSoonCount: expiringSoon?.data?.total || 0,
    pendingTransfersCount: pendingTransfers?.data?.total || 0,
    todayPaymentsCount: todayPayments?.data?.payments?.length || 0,
    todayRevenue: todayPayments?.data?.payments?.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0) || 0
  };
  
  // 📦 Calcular métricas de inventario
  const inventoryMetrics = {
    totalProducts: inventoryStats?.data?.totalProducts || 0,
    lowStockProducts: inventoryStats?.data?.lowStockProducts || 0,
    outOfStockProducts: inventoryStats?.data?.outOfStockProducts || 0,
    totalInventoryValue: inventoryStats?.data?.totalValue || 0,
    totalSalesToday: inventoryStats?.data?.salesToday || 0
  };
  
  // 🎯 Períodos disponibles
  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' }
  ];
  
  // 🆕 Tabs para gestión de contenido - ACTUALIZADOS
  const contentTabs = [
    {
      id: 'general',
      title: 'Información General',
      icon: Info,
      description: 'Nombre, descripción, contacto, horarios, estadísticas',
      dataLoaded: !!gymConfigData.data && !gymConfigData.isLoading
    },
    {
      id: 'services',
      title: 'Servicios',
      icon: Target,
      description: 'Servicios del gimnasio',
      dataLoaded: !!servicesData.data && !servicesData.isLoading
    },
    {
      id: 'plans',
      title: 'Planes de Membresía',
      icon: CreditCard,
      description: 'Planes y precios',
      dataLoaded: !!membershipPlansData.data && !membershipPlansData.isLoading
    },
    {
      id: 'products',
      title: 'Productos',
      icon: ShoppingBag,
      description: 'Tienda del gimnasio',
      dataLoaded: !!featuredProductsData.data && !featuredProductsData.isLoading
    },
    {
      id: 'media',
      title: 'Multimedia',
      icon: Image,
      description: 'Logo, imágenes, videos',
      dataLoaded: !!gymConfigData.data && !gymConfigData.isLoading
    }
  ];
  
  // 🔔 Advertencia de cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  // 📱 Estado de carga general
  const isLoading = userStats.isLoading || membershipStats.isLoading || paymentReports.isLoading;

  // 📄 FUNCIONES DE GUARDADO PARA COMPONENTES
  const handleSaveConfig = (data) => {
    console.log('💾 AdminDashboard - Saving gym config:', data);
    // Aquí iría la llamada a apiService.updateGymConfig(data)
    // Por ahora simulamos éxito
    showSuccess('Configuración guardada (simulado)');
  };
  
  const handleSaveServices = (data) => {
    console.log('💾 AdminDashboard - Saving services:', data);
    // Aquí iría la llamada a apiService.updateGymServices(data)
    showSuccess('Servicios guardados (simulado)');
  };
  
  const handleSavePlans = (data) => {
    console.log('💾 AdminDashboard - Saving plans:', data);
    // Aquí iría la llamada a apiService.updateMembershipPlans(data)
    showSuccess('Planes guardados (simulado)');
  };
  
  const handleSaveProducts = (data) => {
    console.log('💾 AdminDashboard - Saving products:', data);
    // Aquí iría la llamada a apiService.updateFeaturedProducts(data)
    showSuccess('Productos guardados (simulado)');
  };
  
  const handleSaveMedia = (data) => {
    console.log('💾 AdminDashboard - Saving media:', data);
    // Aquí iría la llamada para actualizar multimedia
    showSuccess('Multimedia guardada (simulado)');
  };

  return (
    <div className="space-y-6 relative">
      
      {/* 🐛 DEBUG INFO DISCRETO - En esquina inferior derecha */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            title="Debug Info"
          >
            <Bug className="w-4 h-4" />
          </button>
          
          {showDebugInfo && (
            <div className="absolute bottom-10 right-0 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 shadow-lg min-w-80">
              <div className="font-medium mb-2">🔍 DEBUG INFO</div>
              <div className="space-y-1">
                <div>User: {user?.firstName} {user?.lastName} ({user?.role})</div>
                <div>canManageContent: {canManageContent ? '✅' : '❌'}</div>
                <div>Active tab: {activeTab}</div>
                <div>Content tab: {activeContentTab}</div>
                <div>Data loaded: Config {gymConfigData.data ? '✅' : '❌'} | Services {servicesData.data ? '✅' : '❌'} | Plans {membershipPlansData.data ? '✅' : '❌'}</div>
                <div>Content loading: Config {gymConfigData.isLoading ? '⏳' : '✅'} | Services {servicesData.isLoading ? '⏳' : '✅'}</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 🏠 HEADER DEL DASHBOARD */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Bienvenido, {user?.firstName}. Gestiona tu página web y gimnasio.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* 📅 Selector de período */}
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
          
          {/* 🔄 Botón de refresh */}
          <button
            onClick={refreshDashboard}
            className="btn-secondary btn-sm"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* 📊 Botón de reportes */}
          <Link
            to="/dashboard/reports"
            className="btn-primary btn-sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Reportes
          </Link>
          
          {/* 🆕 Indicador de cambios sin guardar */}
          {hasUnsavedChanges && (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Cambios sin guardar
            </div>
          )}
        </div>
      </div>
      
      {/* 🔗 NAVEGACIÓN POR TABS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          
          {/* TAB: Resumen Ejecutivo */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Resumen Ejecutivo
          </button>
          
          {/* TAB: Operaciones */}
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'operations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Operaciones Diarias
          </button>
          
          {/* TAB: Gestión de Página Web - SIMPLIFICADO */}
          {canManageContent && (
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Página Web
              {hasUnsavedChanges && activeTab === 'content' && (
                <span className="ml-1 w-2 h-2 bg-yellow-500 rounded-full inline-block"></span>
              )}
            </button>
          )}
          
          {/* TAB: Gestión de Inventario/Tienda */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Inventario y Ventas
          </button>
          
        </nav>
      </div>
      
      {/* 📊 CONTENIDO SEGÚN TAB ACTIVO */}
      
      {/* TAB: RESUMEN EJECUTIVO */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* 📊 MÉTRICAS PRINCIPALES EJECUTIVAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <DashboardCard
              title="Usuarios Activos"
              value={mainMetrics.totalUsers}
              icon={Users}
              color="blue"
              isLoading={userStats.isLoading}
              link="/dashboard/users"
              subtitle="Total registrados"
            />
            
            <DashboardCard
              title="Membresías Activas"
              value={mainMetrics.activeMemberships}
              icon={CreditCard}
              color="green"
              isLoading={membershipStats.isLoading}
              link="/dashboard/memberships"
              subtitle="Total vigentes"
            />
            
            <DashboardCard
              title="Ingresos Totales"
              value={formatCurrency(mainMetrics.monthlyRevenue)}
              icon={DollarSign}
              color="primary"
              isLoading={paymentReports.isLoading}
              link="/dashboard/payments"
              subtitle="Total del período"
            />
            
            <DashboardCard
              title="Productos Totales"
              value={inventoryMetrics.totalProducts}
              icon={Package}
              color="purple"
              isLoading={inventoryStats.isLoading}
              link="#"
              subtitle="Total en catálogo"
            />
            
          </div>
          
          {/* 📈 GRÁFICOS Y ANÁLISIS EJECUTIVOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 📊 Distribución de usuarios por rol */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Distribución de Usuarios
              </h3>
              
              {userStats.isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  {Object.entries(userStats?.data?.roleStats || {}).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded mr-3 ${
                          role === 'admin' ? 'bg-purple-500' :
                          role === 'colaborador' ? 'bg-blue-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">
                          {role === 'admin' ? 'Administradores' : 
                           role === 'colaborador' ? 'Personal' : 'Clientes'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">
                          {count}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({Math.round((count / mainMetrics.totalUsers) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 💳 Métodos de pago */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ingresos por Método de Pago
              </h3>
              
              {paymentReports.isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  {paymentReports?.data?.incomeByMethod?.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded mr-3 ${
                          method.method === 'cash' ? 'bg-green-500' :
                          method.method === 'card' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">
                          {method.method === 'cash' ? 'Efectivo' : 
                           method.method === 'card' ? 'Tarjeta' : 
                           method.method === 'transfer' ? 'Transferencia' : method.method}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(method.total)}
                      </span>
                    </div>
                  )) || []}
                </div>
              )}
            </div>
            
          </div>
          
          {/* 🎯 ACCIONES EJECUTIVAS RÁPIDAS */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Acciones Ejecutivas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/dashboard/reports/financial"
                className="btn-primary text-center py-3"
              >
                <PieChart className="w-5 h-5 mx-auto mb-1" />
                Reporte Financiero
              </Link>
              
              <Link
                to="/dashboard/analytics"
                className="btn-primary text-center py-3"
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                Analytics
              </Link>
              
              <button
                onClick={() => setActiveTab('content')}
                className="btn-primary text-center py-3"
              >
                <Globe className="w-5 h-5 mx-auto mb-1" />
                Editar Página Web
              </button>
              
              <Link
                to="/dashboard/backup"
                className="btn-primary text-center py-3"
              >
                <Download className="w-5 h-5 mx-auto mb-1" />
                Respaldo
              </Link>
            </div>
          </div>
          
        </div>
      )}
      
      {/* TAB: OPERACIONES DIARIAS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          
          {/* 📊 MÉTRICAS OPERATIVAS DEL DÍA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <DashboardCard
              title="Vencidas"
              value={mainMetrics.expiredCount}
              icon={AlertCircle}
              color="red"
              isLoading={expiredMemberships.isLoading}
              link="/dashboard/memberships/expired"
              subtitle="Hoy"
            />
            
            <DashboardCard
              title="Por Vencer"
              value={mainMetrics.expiringSoonCount}
              icon={Clock}
              color="yellow"
              isLoading={expiringSoon.isLoading}
              link="/dashboard/memberships/expiring-soon"
              subtitle="Esta semana"
            />
            
            <DashboardCard
              title="Pagos"
              value={mainMetrics.todayPaymentsCount}
              icon={DollarSign}
              color="green"
              isLoading={todayPayments.isLoading}
              link="/dashboard/payments"
              subtitle="Hoy"
            />
            
            <DashboardCard
              title="Ventas"
              value={inventoryMetrics.totalSalesToday}
              icon={ShoppingBag}
              color="purple"
              isLoading={inventoryStats.isLoading}
              link="#"
              subtitle="Hoy"
            />
            
          </div>
          
          {/* 🎯 ACCIONES RÁPIDAS OPERATIVAS */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Acciones Rápidas Operativas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                title="Nuevo Cliente"
                description="Registrar nuevo usuario"
                icon={Users}
                color="blue"
                link="/dashboard/users/create"
              />
              
              <QuickActionCard
                title="Nueva Membresía"
                description="Crear membresía"
                icon={CreditCard}
                color="green"
                link="/dashboard/memberships/create"
              />
              
              <QuickActionCard
                title="Registrar Pago"
                description="Pago en efectivo"
                icon={DollarSign}
                color="yellow"
                link="/dashboard/payments/create"
              />
              
              <QuickActionCard
                title="Venta en Tienda"
                description="Registrar venta física"
                icon={ShoppingBag}
                color="purple"
                onClick={() => setActiveTab('inventory')}
              />
            </div>
          </div>
          
          {/* 📋 CONTENIDO OPERATIVO PRINCIPAL */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resumen Operativo
            </h3>
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>Módulo operativo en construcción</p>
              <p className="text-sm">Los datos se cargarán cuando el backend esté listo</p>
            </div>
          </div>
          
        </div>
      )}
      
      {/* TAB: PÁGINA WEB - SIMPLIFICADO SIN HEADER GRANDE */}
      {activeTab === 'content' && canManageContent && (
        <div className="space-y-6">
          
          {/* 🔗 SUB-NAVEGACIÓN PARA GESTIÓN DE PÁGINA WEB */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-1 overflow-x-auto">
                {contentTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveContentTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center ${
                      activeContentTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.title}
                    {tab.dataLoaded && (
                      <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Botones de acción */}
              <div className="flex space-x-2">
                {hasUnsavedChanges && (
                  <button
                    onClick={() => {
                      setHasUnsavedChanges(false);
                      showSuccess('Cambios guardados');
                    }}
                    className="btn-primary btn-sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Guardar
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* 📋 CONTENIDO SEGÚN SUB-TAB ACTIVO */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            
            {/* SUB-TAB: Información General */}
            {activeContentTab === 'general' && (
              <ContentEditor 
                gymConfig={gymConfigData}
                onSave={handleSaveConfig}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
            {/* SUB-TAB: Servicios */}
            {activeContentTab === 'services' && (
              <ServicesManager
                services={servicesData.data}
                isLoading={servicesData.isLoading}
                onSave={handleSaveServices}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
            {/* SUB-TAB: Planes de Membresía */}
            {activeContentTab === 'plans' && (
              <PlansManager
                plans={membershipPlansData.data}
                isLoading={membershipPlansData.isLoading}
                onSave={handleSavePlans}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
            {/* SUB-TAB: Productos */}
            {activeContentTab === 'products' && (
              <ProductsManager
                products={featuredProductsData.data}
                isLoading={featuredProductsData.isLoading}
                onSave={handleSaveProducts}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
            {/* SUB-TAB: Multimedia */}
            {activeContentTab === 'media' && (
              <MediaUploader
                gymConfig={gymConfigData}
                onSave={handleSaveMedia}
                onUnsavedChanges={setHasUnsavedChanges}
              />
            )}
            
          </div>
          
        </div>
      )}
      
      {/* TAB: GESTIÓN DE INVENTARIO Y VENTAS */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          
          {/* 📦 HEADER DE INVENTARIO */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Inventario y Ventas
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Gestiona productos y ventas en tienda física.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="btn-primary btn-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Nueva Venta
                </button>
                
                <button className="btn-secondary btn-sm">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Reportes
                </button>
              </div>
            </div>
          </div>
          
          {/* 📊 MÉTRICAS DE INVENTARIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <DashboardCard
              title="Productos Totales"
              value={inventoryMetrics.totalProducts}
              icon={Package}
              color="blue"
              isLoading={inventoryStats.isLoading}
              subtitle="En catálogo"
            />
            
            <DashboardCard
              title="Stock Bajo"
              value={inventoryMetrics.lowStockProducts}
              icon={AlertCircle}
              color="yellow"
              isLoading={inventoryStats.isLoading}
              alert={inventoryMetrics.lowStockProducts > 0}
              subtitle="Requieren reposición"
            />
            
            <DashboardCard
              title="Sin Stock"
              value={inventoryMetrics.outOfStockProducts}
              icon={AlertCircle}
              color="red"
              isLoading={inventoryStats.isLoading}
              alert={inventoryMetrics.outOfStockProducts > 0}
              subtitle="Agotados"
            />
            
            <DashboardCard
              title="Valor Inventario"
              value={formatCurrency(inventoryMetrics.totalInventoryValue)}
              icon={DollarSign}
              color="green"
              isLoading={inventoryStats.isLoading}
              subtitle="Valor total en stock"
            />
            
          </div>
          
          {/* 🚧 CONTENIDO EN CONSTRUCCIÓN */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Sistema de Inventario y Ventas
            </h3>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Sistema en Desarrollo
              </h4>
              
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                El sistema completo de inventario y ventas estará disponible próximamente. 
                Incluirá gestión de stock, ventas en tienda física, control de productos y reportes detallados.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <h5 className="font-medium text-gray-900 mb-1">Control de Stock</h5>
                  <p className="text-sm text-gray-600">Añadir, reducir y ajustar inventario</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <ShoppingBag className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <h5 className="font-medium text-gray-900 mb-1">Ventas en Tienda</h5>
                  <p className="text-sm text-gray-600">Registrar ventas físicas directas</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <BarChart3 className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <h5 className="font-medium text-gray-900 mb-1">Reportes Detallados</h5>
                  <p className="text-sm text-gray-600">Analytics de ventas y stock</p>
                </div>
              </div>
              
              <div className="mt-8">
                <p className="text-sm text-gray-500">
                  Por ahora, los productos se gestionan desde la tab "Página Web" → "Productos"
                </p>
              </div>
            </div>
          </div>
          
        </div>
      )}
      
    </div>
  );
};

export default AdminDashboard;