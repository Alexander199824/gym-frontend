// src/pages/dashboard/AdminDashboard.js
// FUNCIÓN: Dashboard CORREGIDO - Sin React Query + Debug habilitado
// MANTIENE: Tabs overview, operations, content originales
// CORRIGE: Reemplaza useQuery con useState + useEffect

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  Download,
  Settings,
  Edit,
  Eye,
  Globe,
  Image,
  MessageSquare,
  Star,
  ShoppingBag,
  FileText,
  Palette,
  Layout,
  Video,
  UserPlus,
  Plus,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Crown,
  Save,
  Upload,
  Trash2,
  Package,
  Tag,
  Shield,
  Award,
  Heart,
  Dumbbell,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Percent,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// 📊 Componentes específicos del dashboard ORIGINALES
import DashboardCard from '../../components/common/DashboardCard';
import QuickActionCard from '../../components/common/QuickActionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// 🆕 NUEVOS Componentes de gestión específica
import ServicesManager from './components/ServicesManager';
import PlansManager from './components/PlansManager';
import ProductsManager from './components/ProductsManager';
import ContentEditor from './components/ContentEditor';
import MediaUploader from './components/MediaUploader';
import BrandingEditor from './components/BrandingEditor';

const AdminDashboard = () => {
  const { user, canManageContent } = useAuth();
  const { formatCurrency, formatDate, showError, showSuccess, isMobile } = useApp();
  
  console.log('🔍 AdminDashboard Debug Info:');
  console.log('  - User:', user);
  console.log('  - canManageContent:', canManageContent);
  console.log('  - User role:', user?.role);
  
  // 📅 Fecha actual
  const today = new Date().toISOString().split('T')[0];
  
  // 📱 Estados locales ORIGINALES
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'operations' | 'content'
  
  // 🆕 NUEVOS Estados para gestión
  const [activeContentTab, setActiveContentTab] = useState('general'); // Sub-tab dentro de content
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 📊 Estados para datos (REEMPLAZA useQuery)
  const [userStats, setUserStats] = useState({ data: null, isLoading: false, error: null });
  const [membershipStats, setMembershipStats] = useState({ data: null, isLoading: false, error: null });
  const [paymentReports, setPaymentReports] = useState({ data: null, isLoading: false, error: null });
  const [expiredMemberships, setExpiredMemberships] = useState({ data: null, isLoading: false, error: null });
  const [expiringSoon, setExpiringSoon] = useState({ data: null, isLoading: false, error: null });
  const [pendingTransfers, setPendingTransfers] = useState({ data: null, isLoading: false, error: null });
  const [todayPayments, setTodayPayments] = useState({ data: null, isLoading: false, error: null });
  const [recentUsers, setRecentUsers] = useState({ data: null, isLoading: false, error: null });
  
  // 🆕 Estados para gestión de contenido
  const [gymConfig, setGymConfig] = useState({ data: null, isLoading: false, error: null });
  const [services, setServices] = useState({ data: null, isLoading: false, error: null });
  const [testimonials, setTestimonials] = useState({ data: null, isLoading: false, error: null });
  const [featuredProducts, setFeaturedProducts] = useState({ data: null, isLoading: false, error: null });
  const [membershipPlans, setMembershipPlans] = useState({ data: null, isLoading: false, error: null });
  
  // 🔄 Función para cargar datos (REEMPLAZA useQuery)
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
      
      // Otros datos operativos...
      // (Se pueden agregar cuando los endpoints estén listos)
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    }
  };
  
  // 🔄 Función para cargar datos de contenido
  const loadContentData = async () => {
    if (!canManageContent) return;
    
    console.log('📄 Loading content management data...');
    
    try {
      // Configuración del gimnasio
      setGymConfig({ data: null, isLoading: true, error: null });
      try {
        const gymConfigData = await apiService.getGymConfig();
        setGymConfig({ data: gymConfigData, isLoading: false, error: null });
        console.log('✅ Gym config loaded:', gymConfigData);
      } catch (error) {
        console.log('⚠️ Gym config not available:', error.message);
        setGymConfig({ data: null, isLoading: false, error });
      }
      
      // Servicios
      setServices({ data: null, isLoading: true, error: null });
      try {
        const servicesData = await apiService.getGymServices();
        setServices({ data: servicesData, isLoading: false, error: null });
        console.log('✅ Services loaded:', servicesData);
      } catch (error) {
        console.log('⚠️ Services not available:', error.message);
        setServices({ data: null, isLoading: false, error });
      }
      
      // Testimonios
      setTestimonials({ data: null, isLoading: true, error: null });
      try {
        const testimonialsData = await apiService.getTestimonials();
        setTestimonials({ data: testimonialsData, isLoading: false, error: null });
        console.log('✅ Testimonials loaded:', testimonialsData);
      } catch (error) {
        console.log('⚠️ Testimonials not available:', error.message);
        setTestimonials({ data: null, isLoading: false, error });
      }
      
      // Productos destacados
      setFeaturedProducts({ data: null, isLoading: true, error: null });
      try {
        const productsData = await apiService.getFeaturedProducts();
        setFeaturedProducts({ data: productsData, isLoading: false, error: null });
        console.log('✅ Products loaded:', productsData);
      } catch (error) {
        console.log('⚠️ Products not available:', error.message);
        setFeaturedProducts({ data: null, isLoading: false, error });
      }
      
      // Planes de membresía
      setMembershipPlans({ data: null, isLoading: true, error: null });
      try {
        const plansData = await apiService.getMembershipPlans();
        setMembershipPlans({ data: plansData, isLoading: false, error: null });
        console.log('✅ Plans loaded:', plansData);
      } catch (error) {
        console.log('⚠️ Plans not available:', error.message);
        setMembershipPlans({ data: null, isLoading: false, error });
      }
      
    } catch (error) {
      console.error('❌ Error loading content data:', error);
    }
  };
  
  // 🔄 Función para refrescar datos ORIGINAL
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    loadDashboardData();
    if (canManageContent) {
      loadContentData();
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
  
  // ⏰ Auto-refresh ORIGINAL (solo para operations)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'operations') {
        loadDashboardData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);
  
  // 📊 Calcular métricas principales ORIGINAL
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
  
  // 🎯 Períodos disponibles ORIGINAL
  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' }
  ];
  
  // 🆕 Sub-tabs para gestión de contenido
  const contentTabs = [
    {
      id: 'general',
      title: 'Información General',
      icon: Settings,
      description: 'Nombre, logo, descripción'
    },
    {
      id: 'services',
      title: 'Servicios',
      icon: Target,
      description: 'Gestionar servicios del gimnasio'
    },
    {
      id: 'plans',
      title: 'Planes de Membresía',
      icon: CreditCard,
      description: 'Crear y editar planes'
    },
    {
      id: 'products',
      title: 'Productos',
      icon: ShoppingBag,
      description: 'Gestionar tienda'
    },
    {
      id: 'media',
      title: 'Multimedia',
      icon: Image,
      description: 'Videos, imágenes, logo'
    },
    {
      id: 'branding',
      title: 'Branding',
      icon: Palette,
      description: 'Colores y estilos'
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
  
  // 📱 Estado de carga general ORIGINAL
  const isLoading = userStats.isLoading || membershipStats.isLoading || paymentReports.isLoading;

  // 📄 Funciones para gestión de contenido
  const refetchConfig = () => loadContentData();
  const refetchServices = () => loadContentData();
  const refetchTestimonials = () => loadContentData();
  const refetchProducts = () => loadContentData();
  const refetchPlans = () => loadContentData();

  return (
    <div className="space-y-6">
      
      {/* 🔍 DEBUG INFO */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🔍 DEBUG INFO</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>User: {user?.firstName} {user?.lastName} ({user?.role})</div>
            <div>canManageContent: {canManageContent ? '✅' : '❌'}</div>
            <div>Active tab: {activeTab}</div>
            <div>Content tab: {activeContentTab}</div>
            <div>Services loaded: {services.data ? '✅' : '❌'}</div>
            <div>Gym config loaded: {gymConfig.data ? '✅' : '❌'}</div>
          </div>
        </div>
      )}
      
      {/* 🏠 HEADER DEL DASHBOARD ORIGINAL - MANTENER IGUAL */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Panel de Administración
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Bienvenido, {user?.firstName}. Control total de tu gimnasio.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* 📅 Selector de período ORIGINAL */}
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
          
          {/* 🔄 Botón de refresh ORIGINAL */}
          <button
            onClick={refreshDashboard}
            className="btn-secondary btn-sm"
            title="Actualizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* 📊 Botón de reportes ORIGINAL */}
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
      
      {/* 🔗 NAVEGACIÓN POR TABS EXPANDIDA */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          
          {/* TAB ORIGINAL: Resumen Ejecutivo */}
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
          
          {/* TAB ORIGINAL: Operaciones */}
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
          
          {/* TAB EXPANDIDO: Gestión de Contenido */}
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
              Gestión de Contenido
              {hasUnsavedChanges && activeTab === 'content' && (
                <span className="ml-1 w-2 h-2 bg-yellow-500 rounded-full inline-block"></span>
              )}
            </button>
          )}
          
        </nav>
      </div>
      
      {/* 📊 CONTENIDO SEGÚN TAB ACTIVO */}
      
      {/* TAB: RESUMEN EJECUTIVO - MANTENER ORIGINAL COMPLETO */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* 📊 MÉTRICAS PRINCIPALES EJECUTIVAS ORIGINALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 👥 Total de usuarios ORIGINAL */}
            <DashboardCard
              title="Usuarios Activos"
              value={mainMetrics.totalUsers}
              icon={Users}
              color="blue"
              isLoading={userStats.isLoading}
              link="/dashboard/users"
              subtitle="Miembros registrados"
            />
            
            {/* 🎫 Membresías activas ORIGINAL */}
            <DashboardCard
              title="Membresías Activas"
              value={mainMetrics.activeMemberships}
              icon={CreditCard}
              color="green"
              isLoading={membershipStats.isLoading}
              link="/dashboard/memberships"
              subtitle="Membresías vigentes"
            />
            
            {/* 💰 Ingresos del período ORIGINAL */}
            <DashboardCard
              title="Ingresos"
              value={formatCurrency(mainMetrics.monthlyRevenue)}
              icon={DollarSign}
              color="primary"
              isLoading={paymentReports.isLoading}
              link="/dashboard/payments"
              subtitle={`Período: ${periods.find(p => p.value === selectedPeriod)?.label}`}
            />
            
            {/* ⚠️ Requieren atención ORIGINAL */}
            <DashboardCard
              title="Requieren Atención"
              value={mainMetrics.expiredCount + mainMetrics.pendingTransfersCount}
              icon={AlertCircle}
              color="red"
              isLoading={expiredMemberships.isLoading || pendingTransfers.isLoading}
              link="/dashboard/alerts"
              alert={mainMetrics.expiredCount + mainMetrics.pendingTransfersCount > 0}
              subtitle="Vencidas + Transferencias"
            />
            
          </div>
          
          {/* 📈 GRÁFICOS Y ANÁLISIS EJECUTIVOS ORIGINALES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 📊 Distribución de usuarios por rol ORIGINAL */}
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
            
            {/* 💳 Métodos de pago ORIGINAL */}
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
          
          {/* 🎯 ACCIONES EJECUTIVAS RÁPIDAS ORIGINAL */}
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
              
              <Link
                to="/dashboard/settings"
                className="btn-primary text-center py-3"
              >
                <Settings className="w-5 h-5 mx-auto mb-1" />
                Configuración
              </Link>
              
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
      
      {/* TAB: OPERACIONES DIARIAS - MANTENER ORIGINAL COMPLETO */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          
          {/* 📊 MÉTRICAS OPERATIVAS DEL DÍA ORIGINALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* ⚠️ Membresías vencidas ORIGINAL */}
            <DashboardCard
              title="Vencidas Hoy"
              value={mainMetrics.expiredCount}
              icon={AlertCircle}
              color="red"
              isLoading={expiredMemberships.isLoading}
              link="/dashboard/memberships/expired"
              alert={mainMetrics.expiredCount > 0}
            />
            
            {/* ⏰ Vencen pronto ORIGINAL */}
            <DashboardCard
              title="Vencen esta semana"
              value={mainMetrics.expiringSoonCount}
              icon={Clock}
              color="yellow"
              isLoading={expiringSoon.isLoading}
              link="/dashboard/memberships/expiring-soon"
              alert={mainMetrics.expiringSoonCount > 0}
            />
            
            {/* 💰 Pagos del día ORIGINAL */}
            <DashboardCard
              title="Pagos Hoy"
              value={mainMetrics.todayPaymentsCount}
              icon={DollarSign}
              color="green"
              isLoading={todayPayments.isLoading}
              link="/dashboard/payments"
              subtitle={`${formatCurrency(mainMetrics.todayRevenue)}`}
            />
            
            {/* 🔄 Transferencias pendientes ORIGINAL */}
            <DashboardCard
              title="Transferencias"
              value={mainMetrics.pendingTransfersCount}
              icon={RefreshCw}
              color="purple"
              isLoading={pendingTransfers.isLoading}
              link="/dashboard/payments/transfers/pending"
              alert={mainMetrics.pendingTransfersCount > 0}
            />
            
          </div>
          
          {/* 🎯 ACCIONES RÁPIDAS OPERATIVAS ORIGINAL */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Acciones Rápidas Operativas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                title="Nuevo Cliente"
                description="Registrar nuevo usuario"
                icon={UserPlus}
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
                title="Buscar Usuario"
                description="Encontrar cliente"
                icon={Users}
                color="purple"
                link="/dashboard/users"
              />
            </div>
          </div>
          
          {/* 📋 CONTENIDO OPERATIVO PRINCIPAL ORIGINAL */}
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
      
      {/* TAB: GESTIÓN DE CONTENIDO - EXPANDIDO CON NUEVAS FUNCIONALIDADES */}
      {activeTab === 'content' && canManageContent && (
        <div className="space-y-6">
          
          {/* 🌐 HEADER DE GESTIÓN DE CONTENIDO MEJORADO */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Gestión Completa de Contenido
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Administra todos los aspectos de tu página web desde aquí.
                  </p>
                </div>
              </div>
              
              {/* Botones de acción globales */}
              <div className="flex space-x-2">
                {hasUnsavedChanges && (
                  <button
                    onClick={() => {
                      // Implementar guardar cambios globales
                      setHasUnsavedChanges(false);
                      showSuccess('Cambios guardados');
                    }}
                    className="btn-primary btn-sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Guardar Todo
                  </button>
                )}
                
                <Link
                  to="/"
                  target="_blank"
                  className="btn-secondary btn-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Vista Previa
                </Link>
              </div>
            </div>
          </div>
          
          {/* 🔗 SUB-NAVEGACIÓN PARA GESTIÓN DE CONTENIDO */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex space-x-1 overflow-x-auto">
              {contentTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveContentTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeContentTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4 inline mr-2" />
                  {tab.title}
                </button>
              ))}
            </div>
          </div>
          
          {/* 📋 CONTENIDO SEGÚN SUB-TAB ACTIVO */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            
            {/* SUB-TAB: Información General */}
            {activeContentTab === 'general' && (
              <ContentEditor 
                gymConfig={gymConfig}
                onSave={(data) => {
                  refetchConfig();
                  setHasUnsavedChanges(false);
                  showSuccess('Información general actualizada');
                }}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            )}
            
            {/* SUB-TAB: Servicios */}
            {activeContentTab === 'services' && (
              <ServicesManager
                services={services?.data || []}
                isLoading={services.isLoading}
                onSave={(data) => {
                  refetchServices();
                  setHasUnsavedChanges(false);
                  showSuccess('Servicios actualizados');
                }}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            )}
            
            {/* SUB-TAB: Planes de Membresía */}
            {activeContentTab === 'plans' && (
              <PlansManager
                plans={membershipPlans?.data || []}
                isLoading={membershipPlans.isLoading}
                onSave={(data) => {
                  refetchPlans();
                  setHasUnsavedChanges(false);
                  showSuccess('Planes actualizados');
                }}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            )}
            
            {/* SUB-TAB: Productos */}
            {activeContentTab === 'products' && (
              <ProductsManager
                products={featuredProducts?.data || []}
                isLoading={featuredProducts.isLoading}
                onSave={(data) => {
                  refetchProducts();
                  setHasUnsavedChanges(false);
                  showSuccess('Productos actualizados');
                }}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            )}
            
            {/* SUB-TAB: Multimedia */}
            {activeContentTab === 'media' && (
              <MediaUploader
                gymConfig={gymConfig}
                onSave={(data) => {
                  refetchConfig();
                  setHasUnsavedChanges(false);
                  showSuccess('Multimedia actualizada');
                }}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            )}
            
            {/* SUB-TAB: Branding */}
            {activeContentTab === 'branding' && (
              <BrandingEditor
                gymConfig={gymConfig}
                onSave={(data) => {
                  refetchConfig();
                  setHasUnsavedChanges(false);
                  showSuccess('Branding actualizado');
                }}
                onUnsavedChanges={(hasChanges) => setHasUnsavedChanges(hasChanges)}
              />
            )}
            
          </div>
          
        </div>
      )}
      
    </div>
  );
};

export default AdminDashboard;