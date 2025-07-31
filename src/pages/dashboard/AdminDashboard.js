// src/pages/dashboard/AdminDashboard.js
// FUNCIÓN: Dashboard EXPANDIDO manteniendo TODA la funcionalidad existente + nuevas gestiones
// MANTIENE: Tabs overview, operations, content originales
// AGREGA: Nuevos sub-tabs para gestión completa

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  
  // 📅 Fecha actual
  const today = new Date().toISOString().split('T')[0];
  
  // 📱 Estados locales ORIGINALES
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'operations' | 'content' | 'management'
  
  // 🆕 NUEVOS Estados para gestión
  const [activeContentTab, setActiveContentTab] = useState('general'); // Sub-tab dentro de content
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // 📊 QUERIES ORIGINALES PARA DATOS DEL DASHBOARD (mantener todo igual)
  
  // Estadísticas de usuarios
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['userStats', refreshKey],
    queryFn: () => apiService.getUserStats(),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar estadísticas de usuarios')
  });
  
  // Estadísticas de membresías
  const { data: membershipStats, isLoading: membershipStatsLoading } = useQuery({
    queryKey: ['membershipStats', refreshKey],
    queryFn: () => apiService.getMembershipStats(),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar estadísticas de membresías')
  });
  
  // Reportes de pagos
  const { data: paymentReports, isLoading: paymentReportsLoading } = useQuery({
    queryKey: ['paymentReports', selectedPeriod, refreshKey],
    queryFn: () => apiService.getPaymentReports({ period: selectedPeriod }),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar reportes de pagos')
  });
  
  // Membresías vencidas
  const { data: expiredMemberships, isLoading: expiredLoading } = useQuery({
    queryKey: ['expiredMemberships', refreshKey],
    queryFn: () => apiService.getExpiredMemberships(),
    staleTime: 2 * 60 * 1000,
    onError: (error) => showError('Error al cargar membresías vencidas')
  });
  
  // Membresías que vencen pronto
  const { data: expiringSoon, isLoading: expiringSoonLoading } = useQuery({
    queryKey: ['expiringSoon', refreshKey],
    queryFn: () => apiService.getExpiringSoonMemberships(7),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar membresías próximas a vencer')
  });
  
  // Transferencias pendientes
  const { data: pendingTransfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['pendingTransfers', refreshKey],
    queryFn: () => apiService.getPendingTransfers(),
    staleTime: 1 * 60 * 1000,
    onError: (error) => showError('Error al cargar transferencias pendientes')
  });
  
  // Pagos del día
  const { data: todayPayments, isLoading: todayPaymentsLoading } = useQuery({
    queryKey: ['todayPayments', refreshKey],
    queryFn: () => apiService.getPayments({ 
      startDate: today,
      endDate: today 
    }),
    staleTime: 1 * 60 * 1000,
    onError: (error) => showError('Error al cargar pagos del día')
  });
  
  // Usuarios recientes
  const { data: recentUsers, isLoading: recentUsersLoading } = useQuery({
    queryKey: ['recentUsers', refreshKey],
    queryFn: () => apiService.getUsers({ 
      limit: 10,
      page: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar usuarios recientes')
  });
  
  // 🆕 NUEVAS QUERIES para gestión de contenido
  
  // Configuración del gimnasio
  const { data: gymConfig, isLoading: configLoading, refetch: refetchConfig } = useQuery({
    queryKey: ['gymConfig', refreshKey],
    queryFn: () => apiService.getGymConfig(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Gym config not available')
  });
  
  // Servicios
  const { data: services, isLoading: servicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ['services', refreshKey],
    queryFn: () => apiService.getGymServices(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Services not available')
  });
  
  // Testimonios
  const { data: testimonials, isLoading: testimonialsLoading, refetch: refetchTestimonials } = useQuery({
    queryKey: ['testimonials', refreshKey],
    queryFn: () => apiService.getTestimonials(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Testimonials not available')
  });
  
  // Productos destacados
  const { data: featuredProducts, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['featuredProducts', refreshKey],
    queryFn: () => apiService.getFeaturedProducts(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Products not available')
  });
  
  // Planes de membresía
  const { data: membershipPlans, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['membershipPlans', refreshKey],
    queryFn: () => apiService.getMembershipPlans(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Plans not available')
  });
  
  // 🔄 Función para refrescar datos ORIGINAL
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    showSuccess('Datos actualizados');
  };
  
  // ⏰ Auto-refresh ORIGINAL
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'operations') {
        setRefreshKey(prev => prev + 1);
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
  const isLoading = userStatsLoading || membershipStatsLoading || paymentReportsLoading;

  return (
    <div className="space-y-6">
      
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
              isLoading={userStatsLoading}
              link="/dashboard/users"
              subtitle="Miembros registrados"
            />
            
            {/* 🎫 Membresías activas ORIGINAL */}
            <DashboardCard
              title="Membresías Activas"
              value={mainMetrics.activeMemberships}
              icon={CreditCard}
              color="green"
              isLoading={membershipStatsLoading}
              link="/dashboard/memberships"
              subtitle="Membresías vigentes"
            />
            
            {/* 💰 Ingresos del período ORIGINAL */}
            <DashboardCard
              title="Ingresos"
              value={formatCurrency(mainMetrics.monthlyRevenue)}
              icon={DollarSign}
              color="primary"
              isLoading={paymentReportsLoading}
              link="/dashboard/payments"
              subtitle={`Período: ${periods.find(p => p.value === selectedPeriod)?.label}`}
            />
            
            {/* ⚠️ Requieren atención ORIGINAL */}
            <DashboardCard
              title="Requieren Atención"
              value={mainMetrics.expiredCount + mainMetrics.pendingTransfersCount}
              icon={AlertCircle}
              color="red"
              isLoading={expiredLoading || transfersLoading}
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
              
              {userStatsLoading ? (
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
              
              {paymentReportsLoading ? (
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
              isLoading={expiredLoading}
              link="/dashboard/memberships/expired"
              alert={mainMetrics.expiredCount > 0}
            />
            
            {/* ⏰ Vencen pronto ORIGINAL */}
            <DashboardCard
              title="Vencen esta semana"
              value={mainMetrics.expiringSoonCount}
              icon={Clock}
              color="yellow"
              isLoading={expiringSoonLoading}
              link="/dashboard/memberships/expiring-soon"
              alert={mainMetrics.expiringSoonCount > 0}
            />
            
            {/* 💰 Pagos del día ORIGINAL */}
            <DashboardCard
              title="Pagos Hoy"
              value={mainMetrics.todayPaymentsCount}
              icon={DollarSign}
              color="green"
              isLoading={todayPaymentsLoading}
              link="/dashboard/payments"
              subtitle={`${formatCurrency(mainMetrics.todayRevenue)}`}
            />
            
            {/* 🔄 Transferencias pendientes ORIGINAL */}
            <DashboardCard
              title="Transferencias"
              value={mainMetrics.pendingTransfersCount}
              icon={RefreshCw}
              color="purple"
              isLoading={transfersLoading}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 🚨 MEMBRESÍAS VENCIDAS ORIGINAL */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Membresías Vencidas
                </h3>
                <Link 
                  to="/dashboard/memberships/expired"
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  Ver todas
                </Link>
              </div>
              
              {expiredLoading ? (
                <LoadingSpinner />
              ) : (
                <ExpiredMembershipsList 
                  memberships={expiredMemberships?.data?.memberships?.slice(0, 5) || []} 
                />
              )}
            </div>
            
            {/* 💰 PAGOS RECIENTES ORIGINAL */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Pagos de Hoy
                </h3>
                <Link 
                  to="/dashboard/payments"
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  Ver todos
                </Link>
              </div>
              
              {todayPaymentsLoading ? (
                <LoadingSpinner />
              ) : (
                <RecentPaymentsList 
                  payments={todayPayments?.data?.payments?.slice(0, 5) || []} 
                />
              )}
            </div>
            
          </div>
          
          {/* ⏰ PRÓXIMAS A VENCER ORIGINAL */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Vencen esta semana
              </h3>
              <span className="text-sm text-gray-500">
                {mainMetrics.expiringSoonCount} membresías
              </span>
            </div>
            
            {expiringSoonLoading ? (
              <LoadingSpinner />
            ) : (
              <ExpiringSoonList 
                memberships={expiringSoon?.data?.memberships || []} 
              />
            )}
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
                isLoading={servicesLoading}
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
                isLoading={plansLoading}
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
                isLoading={productsLoading}
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

// 📋 COMPONENTES ORIGINALES - MANTENER IGUAL

// COMPONENTE: Lista de membresías vencidas
const ExpiredMembershipsList = ({ memberships }) => {
  if (memberships.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
        <p>¡Excelente! No hay membresías vencidas hoy.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {memberships.map((membership) => (
        <div key={membership.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {membership.user?.firstName} {membership.user?.lastName}
            </p>
            <p className="text-xs text-gray-600">
              {membership.type === 'monthly' ? 'Mensual' : 'Diaria'} - 
              Venció: {new Date(membership.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/dashboard/memberships/${membership.id}`}
              className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
            >
              Ver
            </Link>
            <Link
              to={`/dashboard/memberships/${membership.id}/renew`}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            >
              Renovar
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

// 💰 COMPONENTE: Lista de pagos recientes
const RecentPaymentsList = ({ payments }) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="w-8 h-8 mx-auto mb-2" />
        <p>No hay pagos registrados hoy.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {payment.user?.firstName} {payment.user?.lastName}
            </p>
            <p className="text-xs text-gray-600">
              {payment.paymentType === 'membership' ? 'Membresía' : 'Pago diario'} - 
              {payment.paymentMethod === 'cash' ? 'Efectivo' : 
               payment.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-600">
              ${payment.amount}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(payment.paymentDate).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ⏰ COMPONENTE: Lista de próximas a vencer
const ExpiringSoonList = ({ memberships }) => {
  if (memberships.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-green-500" />
        <p>No hay membresías que venzan esta semana.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vence
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Días restantes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {memberships.map((membership) => {
            const daysLeft = Math.ceil((new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <tr key={membership.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {membership.user?.firstName} {membership.user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {membership.user?.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {membership.type === 'monthly' ? 'Mensual' : 'Diaria'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(membership.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    daysLeft <= 1 ? 'bg-red-100 text-red-800' :
                    daysLeft <= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    to={`/dashboard/memberships/${membership.id}`}
                    className="text-primary-600 hover:text-primary-900 mr-2"
                  >
                    Ver
                  </Link>
                  <Link
                    to={`/dashboard/memberships/${membership.id}/renew`}
                    className="text-green-600 hover:text-green-900"
                  >
                    Renovar
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;