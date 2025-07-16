// src/pages/dashboard/AdminDashboard.js
// UBICACIÓN: /gym-frontend/src/pages/dashboard/AdminDashboard.js
// FUNCIÓN: Dashboard principal para administradores con métricas completas
// CONECTA CON: Múltiples endpoints del backend para estadísticas

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
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// 📊 Componentes específicos del dashboard
import DashboardCard from '../../components/common/DashboardCard';
import QuickStats from '../../components/dashboard/QuickStats';
import RecentActivity from '../../components/dashboard/RecentActivity';
import ExpiredMemberships from '../../components/dashboard/ExpiredMemberships';
import PaymentChart from '../../components/dashboard/PaymentChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate, showError } = useApp();
  
  // 📱 Estados locales
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshKey, setRefreshKey] = useState(0);
  
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
  
  // Transferencias pendientes
  const { data: pendingTransfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['pendingTransfers', refreshKey],
    queryFn: () => apiService.getPendingTransfers(),
    staleTime: 1 * 60 * 1000, // 1 minuto
    onError: (error) => showError('Error al cargar transferencias pendientes')
  });
  
  // 🔄 Función para refrescar datos
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // ⏰ Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(refreshDashboard, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // 📊 Calcular métricas principales
  const mainMetrics = {
    totalUsers: userStats?.data?.totalActiveUsers || 0,
    activeMemberships: membershipStats?.data?.activeMemberships || 0,
    monthlyRevenue: paymentReports?.data?.totalIncome || 0,
    expiredCount: expiredMemberships?.data?.total || 0,
    pendingTransfersCount: pendingTransfers?.data?.total || 0
  };
  
  // 📈 Datos para gráficos
  const chartData = paymentReports?.data?.dailyPayments || [];
  
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
      
      {/* 🏠 HEADER DEL DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user?.firstName}. Aquí está el resumen de tu gimnasio.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
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
        </div>
      </div>
      
      {/* 📊 MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 👥 Total de usuarios */}
        <DashboardCard
          title="Usuarios Activos"
          value={mainMetrics.totalUsers}
          icon={Users}
          color="blue"
          isLoading={userStatsLoading}
          link="/dashboard/users"
        />
        
        {/* 🎫 Membresías activas */}
        <DashboardCard
          title="Membresías Activas"
          value={mainMetrics.activeMemberships}
          icon={CreditCard}
          color="green"
          isLoading={membershipStatsLoading}
          link="/dashboard/memberships"
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
        
        {/* ⚠️ Membresías vencidas */}
        <DashboardCard
          title="Vencidas"
          value={mainMetrics.expiredCount}
          icon={AlertCircle}
          color="red"
          isLoading={expiredLoading}
          link="/dashboard/memberships/expired"
          alert={mainMetrics.expiredCount > 0}
        />
        
      </div>
      
      {/* 📈 GRÁFICO DE INGRESOS */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Ingresos Diarios
          </h3>
          <button className="btn-ghost btn-sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
        
        {paymentReportsLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <PaymentChart data={chartData} />
        )}
      </div>
      
      {/* 🏃‍♂️ GRID DE CONTENIDO PRINCIPAL */}
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
            <ExpiredMemberships 
              memberships={expiredMemberships?.data?.memberships?.slice(0, 5) || []} 
              showActions={true}
            />
          )}
        </div>
        
        {/* 🔄 TRANSFERENCIAS PENDIENTES */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Transferencias Pendientes
            </h3>
            <Link 
              to="/dashboard/payments/transfers/pending"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Ver todas
            </Link>
          </div>
          
          {transfersLoading ? (
            <LoadingSpinner />
          ) : (
            <PendingTransfersList 
              transfers={pendingTransfers?.data?.transfers?.slice(0, 5) || []} 
            />
          )}
        </div>
        
      </div>
      
      {/* 📊 ESTADÍSTICAS DETALLADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 👥 Distribución de usuarios */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Usuarios por Rol
          </h3>
          
          {userStatsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {Object.entries(userStats?.data?.roleStats || {}).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {role === 'admin' ? 'Administradores' : 
                     role === 'colaborador' ? 'Personal' : 'Clientes'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 🎫 Tipos de membresías */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tipos de Membresías
          </h3>
          
          {membershipStatsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {Object.entries(membershipStats?.data?.membershipsByType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {type === 'monthly' ? 'Mensual' : 'Diaria'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 💳 Métodos de pago */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Métodos de Pago
          </h3>
          
          {paymentReportsLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {paymentReports?.data?.incomeByMethod?.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {method.method === 'cash' ? 'Efectivo' : 
                     method.method === 'card' ? 'Tarjeta' : 
                     method.method === 'transfer' ? 'Transferencia' : method.method}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(method.total)}
                  </span>
                </div>
              )) || []}
            </div>
          )}
        </div>
        
      </div>
      
      {/* 🎯 ACCIONES RÁPIDAS */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/users/create"
            className="btn-primary text-center py-3"
          >
            <Users className="w-5 h-5 mx-auto mb-1" />
            Nuevo Usuario
          </Link>
          
          <Link
            to="/dashboard/memberships/create"
            className="btn-primary text-center py-3"
          >
            <CreditCard className="w-5 h-5 mx-auto mb-1" />
            Nueva Membresía
          </Link>
          
          <Link
            to="/dashboard/payments/create"
            className="btn-primary text-center py-3"
          >
            <DollarSign className="w-5 h-5 mx-auto mb-1" />
            Registrar Pago
          </Link>
          
          <Link
            to="/dashboard/reports"
            className="btn-primary text-center py-3"
          >
            <TrendingUp className="w-5 h-5 mx-auto mb-1" />
            Ver Reportes
          </Link>
        </div>
      </div>
      
    </div>
  );
};

// 🔄 COMPONENTE: Lista de transferencias pendientes
const PendingTransfersList = ({ transfers }) => {
  if (transfers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2" />
        <p>No hay transferencias pendientes</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {transfers.map((transfer) => (
        <div key={transfer.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {transfer.user?.firstName} {transfer.user?.lastName}
            </p>
            <p className="text-xs text-gray-600">
              ${transfer.amount} - {new Date(transfer.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Link
            to={`/dashboard/payments/${transfer.id}`}
            className="text-yellow-600 hover:text-yellow-500"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;