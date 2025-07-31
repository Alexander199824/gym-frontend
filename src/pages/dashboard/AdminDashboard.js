// src/pages/dashboard/AdminDashboard.js
// UBICACIÓN: /gym-frontend/src/pages/dashboard/AdminDashboard.js
// FUNCIÓN: Dashboard EXPANDIDO para administradores con gestión completa
// CAMBIOS: Incluye TODO StaffDashboard + gestión de página principal + métricas avanzadas

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
  Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// 📊 Componentes específicos del dashboard
import DashboardCard from '../../components/common/DashboardCard';
import QuickActionCard from '../../components/common/QuickActionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const { user, canManageContent } = useAuth();
  const { formatCurrency, formatDate, showError, showSuccess } = useApp();
  
  // 📅 Fecha actual
  const today = new Date().toISOString().split('T')[0];
  
  // 📱 Estados locales
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'operations' | 'content'
  
  // 📊 QUERIES PARA DATOS DEL DASHBOARD
  
  // Estadísticas de usuarios
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['userStats', refreshKey],
    queryFn: () => apiService.getUserStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
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
    staleTime: 2 * 60 * 1000, // 2 minutos
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
    staleTime: 1 * 60 * 1000, // 1 minuto
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
  
  // 🆕 QUERIES PARA GESTIÓN DE CONTENIDO
  
  // Configuración del gimnasio
  const { data: gymConfig, isLoading: configLoading } = useQuery({
    queryKey: ['gymConfig', refreshKey],
    queryFn: () => apiService.getGymConfig(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Gym config not available')
  });
  
  // Servicios
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', refreshKey],
    queryFn: () => apiService.getGymServices(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Services not available')
  });
  
  // Testimonios
  const { data: testimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['testimonials', refreshKey],
    queryFn: () => apiService.getTestimonials(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Testimonials not available')
  });
  
  // Productos destacados
  const { data: featuredProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['featuredProducts', refreshKey],
    queryFn: () => apiService.getFeaturedProducts(),
    staleTime: 10 * 60 * 1000,
    enabled: canManageContent,
    onError: (error) => console.log('Products not available')
  });
  
  // 🔄 Función para refrescar datos
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    showSuccess('Datos actualizados');
  };
  
  // ⏰ Auto-refresh cada 30 segundos para datos críticos
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'operations') {
        setRefreshKey(prev => prev + 1);
      }
    }, 30000);
    return () => clearInterval(interval);
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
  
  // 🎯 Períodos disponibles
  const periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'quarter', label: 'Este trimestre' }
  ];
  
  // 📱 Estado de carga general
  const isLoading = userStatsLoading || membershipStatsLoading || paymentReportsLoading;

  return (
    <div className="space-y-6">
      
      {/* 🏠 HEADER DEL DASHBOARD MEJORADO */}
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
        </div>
      </div>
      
      {/* 🔗 NAVEGACIÓN POR TABS */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Resumen Ejecutivo
          </button>
          
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'operations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Operaciones Diarias
          </button>
          
          {canManageContent && (
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Gestión de Contenido
            </button>
          )}
        </nav>
      </div>
      
      {/* 📊 CONTENIDO SEGÚN TAB ACTIVO */}
      
      {/* TAB: RESUMEN EJECUTIVO */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* 📊 MÉTRICAS PRINCIPALES EJECUTIVAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 👥 Total de usuarios */}
            <DashboardCard
              title="Usuarios Activos"
              value={mainMetrics.totalUsers}
              icon={Users}
              color="blue"
              isLoading={userStatsLoading}
              link="/dashboard/users"
              subtitle="Miembros registrados"
            />
            
            {/* 🎫 Membresías activas */}
            <DashboardCard
              title="Membresías Activas"
              value={mainMetrics.activeMemberships}
              icon={CreditCard}
              color="green"
              isLoading={membershipStatsLoading}
              link="/dashboard/memberships"
              subtitle="Membresías vigentes"
            />
            
            {/* 💰 Ingresos del período */}
            <DashboardCard
              title="Ingresos"
              value={formatCurrency(mainMetrics.monthlyRevenue)}
              icon={DollarSign}
              color="primary"
              isLoading={paymentReportsLoading}
              link="/dashboard/payments"
              subtitle={`Período: ${periods.find(p => p.value === selectedPeriod)?.label}`}
            />
            
            {/* ⚠️ Requieren atención */}
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
          
          {/* 📈 GRÁFICOS Y ANÁLISIS EJECUTIVOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 📊 Distribución de usuarios por rol */}
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
            
            {/* 💳 Métodos de pago */}
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
      
      {/* TAB: OPERACIONES DIARIAS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          
          {/* 📊 MÉTRICAS OPERATIVAS DEL DÍA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* ⚠️ Membresías vencidas */}
            <DashboardCard
              title="Vencidas Hoy"
              value={mainMetrics.expiredCount}
              icon={AlertCircle}
              color="red"
              isLoading={expiredLoading}
              link="/dashboard/memberships/expired"
              alert={mainMetrics.expiredCount > 0}
            />
            
            {/* ⏰ Vencen pronto */}
            <DashboardCard
              title="Vencen esta semana"
              value={mainMetrics.expiringSoonCount}
              icon={Clock}
              color="yellow"
              isLoading={expiringSoonLoading}
              link="/dashboard/memberships/expiring-soon"
              alert={mainMetrics.expiringSoonCount > 0}
            />
            
            {/* 💰 Pagos del día */}
            <DashboardCard
              title="Pagos Hoy"
              value={mainMetrics.todayPaymentsCount}
              icon={DollarSign}
              color="green"
              isLoading={todayPaymentsLoading}
              link="/dashboard/payments"
              subtitle={`${formatCurrency(mainMetrics.todayRevenue)}`}
            />
            
            {/* 🔄 Transferencias pendientes */}
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
          
          {/* 🎯 ACCIONES RÁPIDAS OPERATIVAS */}
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
          
          {/* 📋 CONTENIDO OPERATIVO PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 🚨 MEMBRESÍAS VENCIDAS */}
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
            
            {/* 💰 PAGOS RECIENTES */}
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
          
          {/* ⏰ PRÓXIMAS A VENCER */}
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
      
      {/* TAB: GESTIÓN DE CONTENIDO */}
      {activeTab === 'content' && canManageContent && (
        <div className="space-y-6">
          
          {/* 🌐 HEADER DE GESTIÓN DE CONTENIDO */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gestión de Contenido Web
                </h3>
                <p className="text-gray-600 mt-1">
                  Administra el contenido de tu página web, servicios, testimonios y más.
                </p>
              </div>
            </div>
          </div>
          
          {/* 🎯 ACCIONES DE GESTIÓN DE CONTENIDO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 🏢 Configuración del Gimnasio */}
            <QuickActionCard
              title="Configuración General"
              description="Nombre, logo y datos básicos"
              icon={Settings}
              color="blue"
              link="/dashboard/content/config"
              badge={gymConfig?.data?.name ? 'Configurado' : 'Pendiente'}
            />
            
            {/* 🏋️ Servicios */}
            <QuickActionCard
              title="Servicios"
              description="Gestionar servicios ofrecidos"
              icon={Target}
              color="green"
              link="/dashboard/content/services"
              badge={services?.data?.length ? `${services.data.length} servicios` : 'Sin servicios'}
            />
            
            {/* 💬 Testimonios */}
            <QuickActionCard
              title="Testimonios"
              description="Opiniones de clientes"
              icon={MessageSquare}
              color="yellow"
              link="/dashboard/content/testimonials"
              badge={testimonials?.data?.length ? `${testimonials.data.length} testimonios` : 'Sin testimonios'}
            />
            
            {/* 🛍️ Productos Destacados */}
            <QuickActionCard
              title="Productos"
              description="Productos en tienda"
              icon={ShoppingBag}
              color="purple"
              link="/dashboard/content/products"
              badge={featuredProducts?.data?.length ? `${featuredProducts.data.length} productos` : 'Sin productos'}
            />
            
            {/* 🎨 Branding */}
            <QuickActionCard
              title="Branding"
              description="Colores y estilos"
              icon={Palette}
              color="red"
              link="/dashboard/content/branding"
            />
            
            {/* 🎬 Video Hero */}
            <QuickActionCard
              title="Video Principal"
              description="Video de la página de inicio"
              icon={Video}
              color="gray"
              link="/dashboard/content/video"
            />
            
          </div>
          
          {/* 📊 ESTADO DEL CONTENIDO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 📈 Resumen de Contenido */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estado del Contenido
              </h3>
              
              <div className="space-y-4">
                <ContentStatusItem
                  title="Configuración General"
                  status={gymConfig?.data?.name ? 'complete' : 'pending'}
                  description={gymConfig?.data?.name || 'Sin configurar'}
                />
                
                <ContentStatusItem
                  title="Servicios"
                  status={services?.data?.length > 0 ? 'complete' : 'pending'}
                  description={`${services?.data?.length || 0} servicios configurados`}
                />
                
                <ContentStatusItem
                  title="Testimonios"
                  status={testimonials?.data?.length > 0 ? 'complete' : 'pending'}
                  description={`${testimonials?.data?.length || 0} testimonios activos`}
                />
                
                <ContentStatusItem
                  title="Productos"
                  status={featuredProducts?.data?.length > 0 ? 'complete' : 'pending'}
                  description={`${featuredProducts?.data?.length || 0} productos destacados`}
                />
              </div>
            </div>
            
            {/* 🎯 Acciones Recomendadas */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Acciones Recomendadas
              </h3>
              
              <div className="space-y-3">
                {!gymConfig?.data?.name && (
                  <RecommendedAction
                    title="Configurar información básica"
                    description="Agrega el nombre y logo de tu gimnasio"
                    link="/dashboard/content/config"
                    priority="high"
                  />
                )}
                
                {(!services?.data?.length || services.data.length < 3) && (
                  <RecommendedAction
                    title="Agregar más servicios"
                    description="Muestra todos los servicios que ofreces"
                    link="/dashboard/content/services"
                    priority="medium"
                  />
                )}
                
                {(!testimonials?.data?.length || testimonials.data.length < 3) && (
                  <RecommendedAction
                    title="Recopilar testimonios"
                    description="Los testimonios aumentan la confianza"
                    link="/dashboard/content/testimonials"
                    priority="medium"
                  />
                )}
                
                {(!featuredProducts?.data?.length) && (
                  <RecommendedAction
                    title="Destacar productos"
                    description="Promociona tus productos más vendidos"
                    link="/dashboard/content/products"
                    priority="low"
                  />
                )}
              </div>
            </div>
            
          </div>
          
          {/* 🚀 VISTA PREVIA DE LA PÁGINA */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Vista Previa de la Página
              </h3>
              <div className="flex space-x-2">
                <Link
                  to="/"
                  target="_blank"
                  className="btn-secondary btn-sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Página
                </Link>
                <Link
                  to="/dashboard/content/preview"
                  className="btn-primary btn-sm"
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Editor Visual
                </Link>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-center">
                Aquí podrás ver una vista previa de cómo se ve tu página web con el contenido actual.
              </p>
            </div>
          </div>
          
        </div>
      )}
      
    </div>
  );
};

// 📋 COMPONENTE: Lista de membresías vencidas
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

// 📊 COMPONENTE: Estado del contenido
const ContentStatusItem = ({ title, status, description }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
      <div className={`w-3 h-3 rounded-full ${
        status === 'complete' ? 'bg-green-500' :
        status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
    </div>
  );
};

// 🎯 COMPONENTE: Acción recomendada
const RecommendedAction = ({ title, description, link, priority }) => {
  return (
    <div className={`p-3 rounded-lg border-l-4 ${
      priority === 'high' ? 'bg-red-50 border-red-400' :
      priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
      'bg-blue-50 border-blue-400'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>
        <Link
          to={link}
          className={`text-xs px-2 py-1 rounded font-medium ${
            priority === 'high' ? 'bg-red-600 text-white' :
            priority === 'medium' ? 'bg-yellow-600 text-white' :
            'bg-blue-600 text-white'
          }`}
        >
          Configurar
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;