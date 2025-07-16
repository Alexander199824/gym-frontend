// src/pages/dashboard/StaffDashboard.js
// UBICACIÓN: /gym-frontend/src/pages/dashboard/StaffDashboard.js
// FUNCIÓN: Dashboard para personal/colaboradores con funciones operativas
// CONECTA CON: Endpoints específicos para tareas diarias del staff

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  Clock, 
  UserPlus,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import apiService from '../../services/apiService';

// 📊 Componentes
import DashboardCard from '../../components/common/DashboardCard';
import QuickActionCard from '../../components/common/QuickActionCard';
import TodaySchedule from '../../components/dashboard/TodaySchedule';
import RecentPayments from '../../components/dashboard/RecentPayments';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StaffDashboard = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate, showError } = useApp();
  
  // 📅 Fecha actual
  const today = new Date().toISOString().split('T')[0];
  
  // 📊 QUERIES PARA DATOS DEL STAFF
  
  // Membresías vencidas (prioridad alta)
  const { data: expiredMemberships, isLoading: expiredLoading } = useQuery({
    queryKey: ['expiredMemberships'],
    queryFn: () => apiService.getExpiredMemberships(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    onError: (error) => showError('Error al cargar membresías vencidas')
  });
  
  // Membresías que vencen pronto
  const { data: expiringSoon, isLoading: expiringSoonLoading } = useQuery({
    queryKey: ['expiringSoon'],
    queryFn: () => apiService.getExpiringSoonMemberships(7),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar membresías próximas a vencer')
  });
  
  // Pagos del día
  const { data: todayPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['todayPayments'],
    queryFn: () => apiService.getPayments({ 
      startDate: today,
      endDate: today 
    }),
    staleTime: 1 * 60 * 1000, // 1 minuto
    onError: (error) => showError('Error al cargar pagos del día')
  });
  
  // Usuarios recientes
  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['recentUsers'],
    queryFn: () => apiService.getUsers({ 
      limit: 10,
      page: 1 
    }),
    staleTime: 5 * 60 * 1000,
    onError: (error) => showError('Error al cargar usuarios recientes')
  });
  
  // 📊 Calcular métricas del día
  const todayMetrics = {
    expiredCount: expiredMemberships?.data?.total || 0,
    expiringSoonCount: expiringSoon?.data?.total || 0,
    todayPaymentsCount: todayPayments?.data?.payments?.length || 0,
    todayRevenue: todayPayments?.data?.payments?.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0) || 0
  };

  return (
    <div className="space-y-6">
      
      {/* 🏠 HEADER DEL DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Panel de Trabajo
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user?.firstName}. Aquí están tus tareas del día.
          </p>
        </div>
        
        <div className="flex items-center mt-4 sm:mt-0">
          <div className="text-sm text-gray-500">
            📅 {formatDate(new Date(), 'dd/MM/yyyy')}
          </div>
        </div>
      </div>
      
      {/* 📊 MÉTRICAS DIARIAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* ⚠️ Membresías vencidas */}
        <DashboardCard
          title="Vencidas Hoy"
          value={todayMetrics.expiredCount}
          icon={AlertCircle}
          color="red"
          isLoading={expiredLoading}
          link="/dashboard/memberships/expired"
          alert={todayMetrics.expiredCount > 0}
        />
        
        {/* ⏰ Vencen pronto */}
        <DashboardCard
          title="Vencen esta semana"
          value={todayMetrics.expiringSoonCount}
          icon={Clock}
          color="yellow"
          isLoading={expiringSoonLoading}
          link="/dashboard/memberships/expiring-soon"
          alert={todayMetrics.expiringSoonCount > 0}
        />
        
        {/* 💰 Pagos del día */}
        <DashboardCard
          title="Pagos Hoy"
          value={todayMetrics.todayPaymentsCount}
          icon={DollarSign}
          color="green"
          isLoading={paymentsLoading}
          link="/dashboard/payments"
          subtitle={`${formatCurrency(todayMetrics.todayRevenue)}`}
        />
        
        {/* 👥 Usuarios registrados */}
        <DashboardCard
          title="Usuarios"
          value={recentUsers?.data?.pagination?.total || 0}
          icon={Users}
          color="blue"
          isLoading={usersLoading}
          link="/dashboard/users"
        />
        
      </div>
      
      {/* 🎯 ACCIONES RÁPIDAS */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
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
      
      {/* 📋 CONTENIDO PRINCIPAL */}
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
          
          {paymentsLoading ? (
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
            {todayMetrics.expiringSoonCount} membresías
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
      
      {/* 📈 RESUMEN SEMANAL */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Resumen de la Semana
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(todayMetrics.todayRevenue)}
            </div>
            <div className="text-sm text-gray-600">Ingresos hoy</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {todayMetrics.todayPaymentsCount}
            </div>
            <div className="text-sm text-gray-600">Pagos procesados</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {todayMetrics.expiredCount + todayMetrics.expiringSoonCount}
            </div>
            <div className="text-sm text-gray-600">Requieren atención</div>
          </div>
        </div>
      </div>
      
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

export default StaffDashboard;